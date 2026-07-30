package com.medtrack.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Covers {@link RateLimitingFilter}.
 *
 * <p>This suite errored on every case before this change:</p>
 *
 * <pre>
 * IllegalArgumentException: Could not find field 'capacity' of type [null] on target object
 * [com.medtrack.auth.security.RateLimitingFilter@...]
 * </pre>
 *
 * <p>The filter was refactored from one global bucket to three per-group buckets, so {@code capacity}
 * became {@code authCapacity}/{@code getCapacity}/{@code writeCapacity}, and the test was never
 * updated. It is the only coverage of the rate limiter, and it has been non-functional throughout —
 * including the period in which the {@code X-Forwarded-For} bypass was introduced, which is exactly
 * the kind of change working coverage here would have caught.</p>
 *
 * <p>Fields are set per group rather than globally so a future rename fails loudly on the specific
 * group instead of silently skipping a limit.</p>
 */
@DisplayName("RateLimitingFilter")
class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
        filterChain = Mockito.mock(FilterChain.class);
        configure(2, 2, 2, "");
    }

    /** Configures small capacities so limits are reachable within a test. */
    private void configure(int authCapacity, int getCapacity, int writeCapacity, String trustedProxies) {
        ReflectionTestUtils.setField(filter, "authCapacity", authCapacity);
        ReflectionTestUtils.setField(filter, "authRefillTokens", authCapacity);
        ReflectionTestUtils.setField(filter, "authRefillDurationStr", "1m");

        ReflectionTestUtils.setField(filter, "getCapacity", getCapacity);
        ReflectionTestUtils.setField(filter, "getRefillTokens", getCapacity);
        ReflectionTestUtils.setField(filter, "getRefillDurationStr", "1m");

        ReflectionTestUtils.setField(filter, "writeCapacity", writeCapacity);
        ReflectionTestUtils.setField(filter, "writeRefillTokens", writeCapacity);
        ReflectionTestUtils.setField(filter, "writeRefillDurationStr", "1m");

        ReflectionTestUtils.setField(filter, "trustedProxiesRaw", trustedProxies);
        ReflectionTestUtils.setField(filter, "maxTrackedClients", 1000);
        ReflectionTestUtils.setField(filter, "clientTtlStr", "10m");

        filter.init();
    }

    private MockHttpServletRequest request(String method, String uri, String remoteAddr, String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr(remoteAddr);
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        return request;
    }

    private int call(String method, String uri, String remoteAddr, String forwardedFor)
            throws ServletException, IOException {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request(method, uri, remoteAddr, forwardedFor), response, filterChain);
        return response.getStatus();
    }

    // -----------------------------------------------------------------
    // baseline limiting
    // -----------------------------------------------------------------

    @Nested
    @DisplayName("per-group limits")
    class GroupLimits {

        @Test
        @DisplayName("auth endpoints are limited at the auth capacity")
        void authGroupIsLimited() throws Exception {
            assertEquals(200, call("POST", "/api/auth/login", "1.1.1.1", null));
            assertEquals(200, call("POST", "/api/auth/login", "1.1.1.1", null));

            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "1.1.1.1", null),
                    "the third request exceeds an auth capacity of 2");
            verify(filterChain, times(2)).doFilter(Mockito.any(), Mockito.any());
        }

        @Test
        @DisplayName("read endpoints use the get bucket, independently of the auth bucket")
        void getGroupIsSeparate() throws Exception {
            call("POST", "/api/auth/login", "1.1.1.1", null);
            call("POST", "/api/auth/login", "1.1.1.1", null);

            // The auth bucket is now empty; a GET must still be served from its own bucket.
            assertEquals(200, call("GET", "/api/equipment", "1.1.1.1", null));
        }

        @Test
        @DisplayName("write endpoints use the write bucket")
        void writeGroupIsSeparate() throws Exception {
            assertEquals(200, call("POST", "/api/equipment", "1.1.1.1", null));
            assertEquals(200, call("PUT", "/api/equipment/1", "1.1.1.1", null));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("DELETE", "/api/equipment/1", "1.1.1.1", null));
        }

        @Test
        @DisplayName("non-API paths are never limited")
        void nonApiPathsAreNotLimited() throws Exception {
            for (int i = 0; i < 10; i++) {
                assertEquals(200, call("GET", "/index.html", "1.1.1.1", null));
            }
            verify(filterChain, times(10)).doFilter(Mockito.any(), Mockito.any());
        }

        @Test
        @DisplayName("different clients get independent buckets")
        void distinctClientsAreIndependent() throws Exception {
            call("POST", "/api/auth/login", "1.1.1.1", null);
            call("POST", "/api/auth/login", "1.1.1.1", null);

            assertEquals(200, call("POST", "/api/auth/login", "2.2.2.2", null),
                    "a different client must not inherit another client's exhausted bucket");
        }

        @Test
        @DisplayName("a 429 carries a JSON error payload")
        void tooManyRequestsBodyIsJson() throws Exception {
            call("POST", "/api/auth/login", "1.1.1.1", null);
            call("POST", "/api/auth/login", "1.1.1.1", null);

            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request("POST", "/api/auth/login", "1.1.1.1", null), response, filterChain);

            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), response.getStatus());
            assertTrue(response.getContentType().startsWith("application/json"),
                    response.getContentType());
            assertTrue(response.getContentAsString().contains("Too Many Requests"),
                    response.getContentAsString());
        }
    }

    // -----------------------------------------------------------------
    // X-Forwarded-For handling
    // -----------------------------------------------------------------

    @Nested
    @DisplayName("client identification")
    class ClientIdentification {

        @Test
        @DisplayName("a spoofed X-Forwarded-For cannot buy a fresh bucket when no proxy is trusted")
        void spoofedHeaderIsIgnoredByDefault() throws Exception {
            // This is the bypass. With the header trusted unconditionally, each new value produced a
            // fresh full-capacity bucket, so a caller could make unlimited login attempts against a
            // configured limit of 10/min simply by varying it.
            assertEquals(200, call("POST", "/api/auth/login", "9.9.9.9", "10.0.0.1"));
            assertEquals(200, call("POST", "/api/auth/login", "9.9.9.9", "10.0.0.2"));

            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "9.9.9.9", "10.0.0.3"),
                    "varying X-Forwarded-For must not reset the limit for the same peer");
        }

        @Test
        @DisplayName("100 distinct spoofed addresses still consume one bucket and one cache entry")
        void spoofingAtScaleStillHitsOneBucket() throws Exception {
            int served = 0;
            for (int i = 0; i < 100; i++) {
                if (call("POST", "/api/auth/login", "9.9.9.9", "10.0.0." + i) == 200) {
                    served++;
                }
            }

            assertEquals(2, served, "only the configured capacity of 2 should have been served");
            assertEquals(1, filter.trackedClientCount(),
                    "100 spoofed addresses must not create 100 cache entries");
        }

        @Test
        @DisplayName("X-Forwarded-For is honoured when the peer is a trusted proxy")
        void trustedProxyHeaderIsHonoured() throws Exception {
            configure(2, 2, 2, "10.0.0.5");

            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "203.0.113.7"));
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "203.0.113.7"));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "10.0.0.5", "203.0.113.7"));

            // A different real client behind the same proxy still has its own bucket.
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "203.0.113.8"));
        }

        @Test
        @DisplayName("the rightmost untrusted hop is used, not the leftmost")
        void rightmostUntrustedHopIsUsed() throws Exception {
            configure(2, 2, 2, "10.0.0.5,10.0.0.6");

            // The original client supplies the leftmost entry, so it stays forgeable. Only entries
            // appended by trusted infrastructure can be relied on: here the real client is
            // 203.0.113.7 and the first entry is whatever the caller claimed.
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "1.2.3.4, 203.0.113.7, 10.0.0.6"));
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "9.9.9.9, 203.0.113.7, 10.0.0.6"));

            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "10.0.0.5", "8.8.8.8, 203.0.113.7, 10.0.0.6"),
                    "changing only the forgeable leftmost entry must not reset the limit");
        }

        @Test
        @DisplayName("an all-trusted chain falls back to the peer address")
        void allTrustedChainFallsBackToPeer() throws Exception {
            configure(2, 2, 2, "10.0.0.5,10.0.0.6");

            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "10.0.0.6"));
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "10.0.0.6"));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "10.0.0.5", "10.0.0.6"));
        }

        @Test
        @DisplayName("a trusted peer sending no header falls back to the peer address")
        void trustedPeerWithoutHeader() throws Exception {
            configure(2, 2, 2, "10.0.0.5");

            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", null));
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", null));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "10.0.0.5", null));
        }

        @Test
        @DisplayName("the literal value 'unknown' is not treated as an address")
        void unknownHeaderIsIgnored() throws Exception {
            configure(2, 2, 2, "10.0.0.5");

            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "unknown"));
            assertEquals(200, call("POST", "/api/auth/login", "10.0.0.5", "unknown"));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("POST", "/api/auth/login", "10.0.0.5", "unknown"));
        }

        @Test
        @DisplayName("trusted-proxy parsing tolerates whitespace and empty entries")
        void trustedProxyParsing() {
            assertEquals(Set.of(), RateLimitingFilter.parseTrustedProxies(null));
            assertEquals(Set.of(), RateLimitingFilter.parseTrustedProxies(""));
            assertEquals(Set.of(), RateLimitingFilter.parseTrustedProxies("   "));
            assertEquals(Set.of("10.0.0.5"), RateLimitingFilter.parseTrustedProxies(" 10.0.0.5 "));
            assertEquals(Set.of("10.0.0.5", "10.0.0.6"),
                    RateLimitingFilter.parseTrustedProxies("10.0.0.5, ,10.0.0.6,"));
        }
    }

    // -----------------------------------------------------------------
    // cache bounding
    // -----------------------------------------------------------------

    @Nested
    @DisplayName("bucket cache")
    class BucketCache {

        @Test
        @DisplayName("the cache never grows past its configured cap")
        void cacheIsBounded() throws Exception {
            configure(100, 100, 100, "10.0.0.5");
            ReflectionTestUtils.setField(filter, "maxTrackedClients", 25);

            // Every request presents a distinct proxy-forwarded address, so each is a legitimately
            // distinct client. Before this change the map grew one entry per address, unbounded and
            // never evicted.
            for (int i = 0; i < 500; i++) {
                call("GET", "/api/equipment", "10.0.0.5", "203.0.113." + (i % 256) + "-" + i);
            }

            assertTrue(filter.trackedClientCount() <= 25,
                    "cache grew to " + filter.trackedClientCount() + " entries against a cap of 25");
        }

        @Test
        @DisplayName("traffic beyond the cap is still limited, not served without a bucket")
        void overflowStillLimits() throws Exception {
            configure(1, 1, 1, "10.0.0.5");
            ReflectionTestUtils.setField(filter, "maxTrackedClients", 1);

            // The first client claims the only tracked slot and exhausts it.
            assertEquals(200, call("GET", "/api/equipment", "10.0.0.5", "203.0.113.1"));
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(),
                    call("GET", "/api/equipment", "10.0.0.5", "203.0.113.1"));

            // Subsequent clients fall to the shared overflow bucket. They must still be limited:
            // failing open here would reintroduce the bypass this change closes.
            int first = call("GET", "/api/equipment", "10.0.0.5", "203.0.113.2");
            int second = call("GET", "/api/equipment", "10.0.0.5", "203.0.113.3");

            assertTrue(first == 200 || first == HttpStatus.TOO_MANY_REQUESTS.value());
            assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), second,
                    "overflow traffic must degrade to a shared limit, not to no limit");
        }

        @Test
        @DisplayName("idle entries are reclaimed")
        void idleEntriesAreEvicted() throws Exception {
            configure(100, 100, 100, "10.0.0.5");
            ReflectionTestUtils.setField(filter, "maxTrackedClients", 5);
            // A zero TTL makes every existing entry immediately idle, so the sweep can reclaim.
            ReflectionTestUtils.setField(filter, "clientTtl", Duration.ZERO);

            for (int i = 0; i < 50; i++) {
                call("GET", "/api/equipment", "10.0.0.5", "203.0.113." + i);
            }

            assertTrue(filter.trackedClientCount() <= 5,
                    "expected eviction to hold the cache at or below 5, saw "
                            + filter.trackedClientCount());
        }
    }
}
