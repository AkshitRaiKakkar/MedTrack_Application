package com.medtrack.auth.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${security.rate-limit.auth.capacity:10}")
    private int authCapacity;

    @Value("${security.rate-limit.auth.refill-tokens:10}")
    private int authRefillTokens;

    @Value("${security.rate-limit.auth.refill-duration:1m}")
    private String authRefillDurationStr;

    @Value("${security.rate-limit.get.capacity:100}")
    private int getCapacity;

    @Value("${security.rate-limit.get.refill-tokens:100}")
    private int getRefillTokens;

    @Value("${security.rate-limit.get.refill-duration:1m}")
    private String getRefillDurationStr;

    @Value("${security.rate-limit.write.capacity:30}")
    private int writeCapacity;

    @Value("${security.rate-limit.write.refill-tokens:30}")
    private int writeRefillTokens;

    @Value("${security.rate-limit.write.refill-duration:1m}")
    private String writeRefillDurationStr;

    /**
     * Peer addresses whose {@code X-Forwarded-For} header is trusted.
     *
     * <p>Empty by default, which means the header is ignored entirely and every request is keyed on
     * {@code getRemoteAddr()}. Defaulting to "trust nothing" is the safe direction: a deployment
     * behind a proxy that has not configured this rate-limits per-proxy, which is over-restrictive
     * and visible, whereas the previous behaviour was silently no rate limiting at all.</p>
     *
     * <p>Set to the proxy addresses, e.g.
     * {@code security.rate-limit.trusted-proxies=127.0.0.1,10.0.0.5}.</p>
     */
    @Value("${security.rate-limit.trusted-proxies:}")
    private String trustedProxiesRaw;

    /**
     * Maximum number of buckets held at once.
     *
     * <p>The cache was previously unbounded, so every distinct key created a permanent entry. With
     * the key derived from a client-supplied header, a single loop varying
     * {@code X-Forwarded-For} grew it without limit until the heap was exhausted - the same request
     * pattern that bypassed the limiter also took the process down.</p>
     */
    @Value("${security.rate-limit.max-tracked-clients:10000}")
    private int maxTrackedClients;

    /** Idle period after which a bucket is discarded. */
    @Value("${security.rate-limit.client-ttl:10m}")
    private String clientTtlStr;

    private Set<String> trustedProxies = Set.of();
    private Duration clientTtl = Duration.ofMinutes(10);

    private final ConcurrentHashMap<String, TrackedBucket> cache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Bandwidth authBandwidth;
    private Bandwidth getBandwidth;
    private Bandwidth writeBandwidth;

    @PostConstruct
    public void init() {
        this.authBandwidth = Bandwidth.classic(authCapacity, Refill.intervally(authRefillTokens, parseDuration(authRefillDurationStr)));
        this.getBandwidth = Bandwidth.classic(getCapacity, Refill.intervally(getRefillTokens, parseDuration(getRefillDurationStr)));
        this.writeBandwidth = Bandwidth.classic(writeCapacity, Refill.intervally(writeRefillTokens, parseDuration(writeRefillDurationStr)));
        this.clientTtl = parseDuration(clientTtlStr);
        this.trustedProxies = parseTrustedProxies(trustedProxiesRaw);
    }

    static Set<String> parseTrustedProxies(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(entry -> !entry.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();

        if (path.startsWith("/api/")) {
            String group = resolveGroup(path, method);
            String ip = resolveClientKey(request);
            String key = group + ":" + ip;

            Bucket bucket = resolveBucket(key, group);

            if (!bucket.tryConsume(1)) {
                sendTooManyRequestsResponse(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveGroup(String path, String method) {
        if ("POST".equalsIgnoreCase(method) && (
            "/api/auth/login".equals(path) ||
            "/api/auth/register".equals(path) ||
            "/api/auth/forgot-password".equals(path) ||
            "/api/auth/verify-otp".equals(path) ||
            "/api/auth/reset-password".equals(path) ||
            "/api/auth/refresh-token".equals(path)
        )) {
            return "auth";
        }
        if ("GET".equalsIgnoreCase(method)) {
            return "get";
        }
        return "write";
    }

    private Bandwidth resolveBandwidth(String group) {
        switch (group) {
            case "auth": return authBandwidth;
            case "get":  return getBandwidth;
            default:     return writeBandwidth;
        }
    }

    /**
     * Resolves the address to rate-limit on.
     *
     * <p>{@code X-Forwarded-For} is a plain request header that any client can set to anything, so
     * it is only consulted when the immediate peer is a configured trusted proxy. Previously it was
     * trusted unconditionally, which meant the rate-limit key was attacker-chosen: varying the header
     * per request produced a fresh full-capacity bucket every time and defeated the limit on
     * {@code /api/auth/login} entirely.</p>
     *
     * <p>When a trusted chain is present, the <strong>rightmost untrusted</strong> hop is taken, not
     * the leftmost. The leftmost entry is whatever the original client supplied and is therefore
     * still forgeable; only the entries appended by trusted infrastructure can be relied on.</p>
     */
    String resolveClientKey(HttpServletRequest request) {
        String peer = request.getRemoteAddr();

        if (trustedProxies.isEmpty() || peer == null || !trustedProxies.contains(peer)) {
            return peer == null ? "unknown" : peer;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank() || "unknown".equalsIgnoreCase(forwarded)) {
            return peer;
        }

        String[] hops = forwarded.split(",");
        for (int index = hops.length - 1; index >= 0; index--) {
            String hop = hops[index].trim();
            if (!hop.isEmpty() && !trustedProxies.contains(hop)) {
                return hop;
            }
        }

        // Every hop in the chain is a trusted proxy; the peer is the best available identity.
        return peer;
    }

    /**
     * Returns the bucket for a key, bounding the cache.
     *
     * <p>Entries idle for longer than {@link #clientTtl} are discarded, and when the cache is at
     * {@link #maxTrackedClients} a sweep runs before inserting. If the sweep frees nothing - which
     * means every tracked client is currently active - the request is served from a shared overflow
     * bucket rather than growing the map. That degrades to a global limit under pressure instead of
     * either failing open (no limiting) or failing closed (rejecting everyone).</p>
     */
    private Bucket resolveBucket(String key, String group) {
        TrackedBucket tracked = cache.get(key);
        if (tracked != null) {
            tracked.touch();
            return tracked.bucket();
        }

        if (cache.size() >= maxTrackedClients) {
            evictIdle();
            if (cache.size() >= maxTrackedClients) {
                return overflowBucket(group);
            }
        }

        return cache.computeIfAbsent(key,
                        ignored -> new TrackedBucket(Bucket.builder().addLimit(resolveBandwidth(group)).build()))
                .bucket();
    }

    private void evictIdle() {
        long cutoff = System.nanoTime() - clientTtl.toNanos();
        cache.entrySet().removeIf(entry -> entry.getValue().lastSeenNanos() < cutoff);
    }

    private Bucket overflowBucket(String group) {
        return overflowBuckets.computeIfAbsent(group,
                ignored -> Bucket.builder().addLimit(resolveBandwidth(group)).build());
    }

    /** Buckets shared by all clients once {@link #maxTrackedClients} is reached. */
    private final ConcurrentHashMap<String, Bucket> overflowBuckets = new ConcurrentHashMap<>();

    /** Visible for tests: how many distinct clients are currently tracked. */
    int trackedClientCount() {
        return cache.size();
    }

    /** A bucket plus the last time it was used, so idle entries can be reclaimed. */
    private static final class TrackedBucket {
        private final Bucket bucket;
        private volatile long lastSeenNanos;

        private TrackedBucket(Bucket bucket) {
            this.bucket = bucket;
            this.lastSeenNanos = System.nanoTime();
        }

        private Bucket bucket() {
            return bucket;
        }

        private void touch() {
            this.lastSeenNanos = System.nanoTime();
        }

        private long lastSeenNanos() {
            return lastSeenNanos;
        }
    }

    private Duration parseDuration(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Duration.ofMinutes(1);
        }
        value = value.trim().toLowerCase();
        if (value.endsWith("s")) {
            return Duration.ofSeconds(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("h")) {
            return Duration.ofHours(Long.parseLong(value.substring(0, value.length() - 1)));
        } else if (value.endsWith("d")) {
            return Duration.ofDays(Long.parseLong(value.substring(0, value.length() - 1)));
        } else {
            return Duration.ofSeconds(Long.parseLong(value));
        }
    }

    private void sendTooManyRequestsResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorDetails = new LinkedHashMap<>();
        errorDetails.put("timestamp", Instant.now().toString());
        errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorDetails.put("error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase());
        errorDetails.put("message", "Too many requests. Please try again later.");
        errorDetails.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getWriter(), errorDetails);
        response.getWriter().flush();
    }
}
