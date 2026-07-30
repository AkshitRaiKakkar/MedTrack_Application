package com.medtrack.architecture;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the {@code permitAll()} block in {@code SecurityConfig} against additions that are not
 * genuine authentication endpoints.
 *
 * <p>Four security-administration API trees — {@code /api/auth/scim/**},
 * {@code /api/auth/commandcenter/**}, {@code /api/auth/vulnerability/**} and
 * {@code /api/auth/pam/**} — were sitting in that list next to {@code /api/auth/login}. They are
 * not login endpoints: they provision and deprovision accounts, approve privilege elevation,
 * suppress security alerts and govern CVE patching. Every route under them, mutating ones included,
 * was reachable with no token.</p>
 *
 * <p>The failure mode is easy to repeat. A subsystem is added, its endpoints 401 during local
 * testing, the path gets appended to {@code permitAll()} to get moving, and the entry is never
 * removed. PR #531 closed exactly this hole for {@code /api/auth/rbac}, {@code /authority},
 * {@code /mfa}, {@code /sso}, {@code /audit}, {@code /zerotrust} and {@code /keyvault}; these four
 * trees were added afterwards and reopened it.</p>
 *
 * <p>This test makes the next such addition fail the build instead of shipping. Any new public
 * {@code /api/auth/**} path must be added to {@link #KNOWN_PUBLIC_AUTH_PATHS} deliberately, which
 * puts it in front of a reviewer.</p>
 */
@DisplayName("SecurityConfig public endpoint allowlist")
class PublicEndpointAllowlistTest {

    /**
     * The only {@code /api/auth/**} paths that may be anonymous.
     *
     * <p>Each is required for a caller who does not yet have a token: you cannot authenticate in
     * order to authenticate. {@code /sso/initiate} resolves the identity provider for an email
     * domain before a session exists, and is matched separately in the configuration as a single
     * POST rather than a wildcard subtree.</p>
     */
    private static final Set<String> KNOWN_PUBLIC_AUTH_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh-token",
            "/api/auth/logout",
            "/api/auth/forgot-password",
            "/api/auth/verify-otp",
            "/api/auth/reset-password",
            "/api/auth/sso/initiate");

    private static final Pattern QUOTED_PATH = Pattern.compile("\"(/[^\"]*)\"");

    @Test
    @DisplayName("no /api/auth/** subtree is wildcarded into permitAll()")
    void noAuthSubtreeIsPublic() {
        List<String> offenders = permitAllPaths().stream()
                .filter(path -> path.startsWith("/api/auth/"))
                .filter(path -> !KNOWN_PUBLIC_AUTH_PATHS.contains(path))
                .toList();

        assertTrue(offenders.isEmpty(), () -> """
                %d path(s) under /api/auth/ are in the permitAll() block but are not authentication
                endpoints:

                %s

                permitAll() matchers are evaluated before .anyRequest().authenticated(), so nothing
                declared later can recover these routes - they are reachable with no token at all.

                If one of these really must be public, add it to KNOWN_PUBLIC_AUTH_PATHS in this
                test with a comment explaining why a caller cannot hold a token yet.""".formatted(
                offenders.size(),
                offenders.stream().map(path -> "  " + path).reduce((a, b) -> a + "\n" + b).orElse("")));
    }

    @Test
    @DisplayName("no wildcard subtree is public at all")
    void noWildcardSubtreeIsPublic() {
        List<String> wildcards = permitAllPaths().stream()
                .filter(path -> path.contains("/**"))
                .filter(path -> !path.startsWith("/h2-console")
                        && !path.startsWith("/swagger-ui")
                        && !path.startsWith("/v3/api-docs"))
                .toList();

        assertTrue(wildcards.isEmpty(), () -> """
                %d wildcard subtree(s) are public:

                %s

                A wildcard grants anonymous access to every current *and future* route beneath it.
                The four security-administration trees that caused this test to be written were all
                added as wildcards. Only the API documentation and local database console are
                exempt.""".formatted(
                wildcards.size(),
                wildcards.stream().map(path -> "  " + path).reduce((a, b) -> a + "\n" + b).orElse("")));
    }

    @Test
    @DisplayName("the parser actually found the permitAll block")
    void parserFoundThePermitAllBlock() {
        List<String> paths = permitAllPaths();

        assertFalse(paths.isEmpty(),
                "No permitAll() paths were parsed out of SecurityConfig. The parsing in this test "
                        + "has drifted from the configuration and every assertion above is now "
                        + "vacuously true.");
        assertTrue(paths.contains("/api/auth/login"),
                "Expected /api/auth/login among the parsed public paths but got: " + paths);
    }

    /**
     * Extracts the string literals from every {@code .requestMatchers(...).permitAll()} chain in
     * {@code SecurityConfig}.
     *
     * <p>Comments are stripped first, so the explanatory note left where the four offending trees
     * used to be listed is not mistaken for a live entry.</p>
     */
    private static List<String> permitAllPaths() {
        String source = stripComments(read(securityConfig()));
        List<String> paths = new ArrayList<>();

        int cursor = 0;
        while (true) {
            int matcherStart = source.indexOf(".requestMatchers(", cursor);
            if (matcherStart < 0) {
                break;
            }
            int permitAll = source.indexOf(".permitAll()", matcherStart);
            int nextMatcher = source.indexOf(".requestMatchers(", matcherStart + 1);

            // Only collect when .permitAll() terminates *this* matcher chain rather than a later
            // one; otherwise an .authenticated() chain would be harvested as public.
            boolean permitAllBelongsToThisChain =
                    permitAll > 0 && (nextMatcher < 0 || permitAll < nextMatcher);

            if (permitAllBelongsToThisChain) {
                Matcher literals = QUOTED_PATH.matcher(source.substring(matcherStart, permitAll));
                while (literals.find()) {
                    paths.add(literals.group(1));
                }
            }
            cursor = matcherStart + 1;
        }

        return paths;
    }

    /**
     * Removes comments so their contents are never mistaken for live configuration.
     *
     * <p>Line comments are stripped <em>before</em> block comments, and the order matters. An API
     * path written in a line comment - {@code // /api/auth/scim/**, ...} - contains the character
     * sequence that opens a block comment. Stripping blocks first treats that as the start of a
     * comment and swallows the rest of the file up to the next {@code *}{@code /}, which silently
     * empties the parse. The {@code parserFoundThePermitAllBlock} assertion below exists because
     * this exact mistake was made while writing this test.</p>
     */
    private static String stripComments(String source) {
        // A regex block-comment strip is unsafe here: Ant-style path patterns such as
        // "/swagger-ui/**" contain the character sequence that opens a block comment, so a naive
        // strip swallows the rest of the file and silently empties the parse instead of failing
        // loudly. Scanning with string-literal awareness is the only reliable approach; the
        // "did the scan find anything" assertions above exist because this mistake was made
        // while writing these tests.
        StringBuilder out = new StringBuilder(source.length());
        int index = 0;
        int length = source.length();

        while (index < length) {
            char current = source.charAt(index);

            if (current == '"') {
                int end = index + 1;
                while (end < length) {
                    if (source.charAt(end) == '\\') {
                        end += 2;
                        continue;
                    }
                    if (source.charAt(end) == '"') {
                        break;
                    }
                    end++;
                }
                out.append(source, index, Math.min(end + 1, length));
                index = end + 1;
                continue;
            }

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '/') {
                while (index < length && source.charAt(index) != '\n') {
                    index++;
                }
                continue;
            }

            if (current == '/' && index + 1 < length && source.charAt(index + 1) == '*') {
                int end = source.indexOf("*/", index + 2);
                index = end < 0 ? length : end + 2;
                continue;
            }

            out.append(current);
            index++;
        }

        return out.toString();
    }

    private static Path securityConfig() {
        Path relative = Paths.get("src", "main", "java", "com", "medtrack", "auth", "config",
                "SecurityConfig.java");
        Path fromModule = relative.toAbsolutePath().normalize();
        if (Files.isRegularFile(fromModule)) {
            return fromModule;
        }
        Path fromRepositoryRoot = Paths.get("Backend").resolve(relative).toAbsolutePath().normalize();
        if (Files.isRegularFile(fromRepositoryRoot)) {
            return fromRepositoryRoot;
        }
        throw new IllegalStateException("Could not locate SecurityConfig.java from working "
                + "directory " + Paths.get("").toAbsolutePath());
    }

    private static String read(Path source) {
        try {
            return Files.readString(source, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Unable to read " + source, e);
        }
    }
}
