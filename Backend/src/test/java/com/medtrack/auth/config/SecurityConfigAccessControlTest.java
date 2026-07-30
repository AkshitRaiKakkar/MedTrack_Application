package com.medtrack.auth.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/**
 * Asserts that the PAM, SCIM, command-center and vulnerability API trees are no longer anonymous.
 *
 * <p>All four were listed in {@code SecurityConfig}'s {@code permitAll()} block alongside
 * {@code /api/auth/login}. Because {@code permitAll()} matchers are evaluated before the trailing
 * {@code .anyRequest().authenticated()} rule, nothing downstream could recover them: every route,
 * including every mutating one, was reachable with no token.</p>
 *
 * <p>These tests assert the <em>authorization outcome</em> rather than a specific success status. A
 * route may legitimately answer 200, 400 (empty request body) or 404 (referenced entity absent);
 * what matters is:</p>
 *
 * <ul>
 *   <li>anonymous callers are rejected with 401,</li>
 *   <li>an authenticated non-admin is rejected with 403 on mutating routes,</li>
 *   <li>a {@code ROLE_HOSPITAL} caller is <em>not</em> rejected with 401 or 403.</li>
 * </ul>
 *
 * <p>Pinning exact success codes would couple this suite to controller behaviour it is not testing
 * and would start failing for reasons unrelated to access control.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "app.data-initializer.enabled=false",
        // The rate limiter runs first in the chain and would otherwise start answering 429 partway
        // through a parameterised sweep, masking the authorization result under test.
        "security.rate-limit.auth.capacity=10000",
        "security.rate-limit.get.capacity=10000",
        "security.rate-limit.write.capacity=10000",
        "app.jwt.secret=integration-test-secret-value-long-enough-for-hmac-sha256"
})
@DisplayName("SecurityConfig access control for security-administration APIs")
class SecurityConfigAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * {@code KafkaEventPublisher} requires a {@code KafkaTemplate}, so the context cannot be built
     * without one — and it would be built by {@code KafkaAutoConfiguration} only against a real
     * broker. Overriding the bean keeps the context focused on access control and means no test
     * here depends on Kafka being reachable.
     */
    @MockitoBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    /** Read routes across the four trees that were anonymous. */
    private static Stream<Arguments> readRoutes() {
        return Stream.of(
                Arguments.of(HttpMethod.GET, "/api/auth/pam/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/pam/requests"),
                Arguments.of(HttpMethod.GET, "/api/auth/pam/session/logs"),

                Arguments.of(HttpMethod.GET, "/api/auth/scim/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/scim/users"),
                Arguments.of(HttpMethod.GET, "/api/auth/scim/audit-logs"),

                Arguments.of(HttpMethod.GET, "/api/auth/commandcenter/summary"),
                Arguments.of(HttpMethod.GET, "/api/auth/commandcenter/config"),
                Arguments.of(HttpMethod.GET, "/api/auth/commandcenter/alerts"),

                Arguments.of(HttpMethod.GET, "/api/auth/vulnerability/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/vulnerability/list"),
                Arguments.of(HttpMethod.GET, "/api/auth/vulnerability/patch-logs"),
                Arguments.of(HttpMethod.GET, "/api/auth/vulnerability/cve"),
                Arguments.of(HttpMethod.GET, "/api/auth/vulnerability/patch/logs"));
    }

    /** Mutating routes across the four trees that were anonymous. */
    private static Stream<Arguments> mutatingRoutes() {
        return Stream.of(
                Arguments.of(HttpMethod.PUT, "/api/auth/pam/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/pam/request"),
                Arguments.of(HttpMethod.PUT, "/api/auth/pam/request/1/approve"),
                Arguments.of(HttpMethod.POST, "/api/auth/pam/session/log"),

                Arguments.of(HttpMethod.PUT, "/api/auth/scim/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/scim/users/provision"),
                Arguments.of(HttpMethod.POST, "/api/auth/scim/users/deprovision"),

                Arguments.of(HttpMethod.PUT, "/api/auth/commandcenter/config"),
                Arguments.of(HttpMethod.POST, "/api/auth/commandcenter/alerts/acknowledge"),

                Arguments.of(HttpMethod.PUT, "/api/auth/vulnerability/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/vulnerability/report"),
                Arguments.of(HttpMethod.POST, "/api/auth/vulnerability/patch"),
                Arguments.of(HttpMethod.POST, "/api/auth/vulnerability/scan"),
                Arguments.of(HttpMethod.POST, "/api/auth/vulnerability/cve/ingest"),
                Arguments.of(HttpMethod.POST, "/api/auth/vulnerability/patch/trigger"));
    }

    private static Stream<Arguments> allRoutes() {
        return Stream.concat(readRoutes(), mutatingRoutes());
    }

    private static Stream<Arguments> publicAuthRoutes() {
        return Stream.of(
                Arguments.of(HttpMethod.POST, "/api/auth/login"),
                Arguments.of(HttpMethod.POST, "/api/auth/register"),
                Arguments.of(HttpMethod.POST, "/api/auth/forgot-password"),
                Arguments.of(HttpMethod.POST, "/api/auth/verify-otp"),
                Arguments.of(HttpMethod.POST, "/api/auth/reset-password"),
                Arguments.of(HttpMethod.POST, "/api/auth/refresh-token"));
    }

    /**
     * Applies the caller identity as a request post-processor rather than via {@code @WithMockUser}.
     *
     * <p>{@code SecurityConfig} sets {@code SessionCreationPolicy.STATELESS}, so the
     * session-backed security context that {@code @WithMockUser} populates is never read back and
     * every authenticated request would arrive anonymous — producing 401 where 403 or 200 is
     * expected. A post-processor puts the context on the request itself, which the stateless chain
     * does honour.</p>
     */
    private MvcResult call(HttpMethod method, String path, RequestPostProcessor caller)
            throws Exception {
        return mockMvc.perform(request(method, path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(caller))
                .andReturn();
    }

    private static RequestPostProcessor technician() {
        return user("tech@medtrack.com").roles("TECHNICIAN");
    }

    private static RequestPostProcessor hospitalAdmin() {
        return user("hospital@medtrack.com").roles("HOSPITAL");
    }

    // -----------------------------------------------------------------
    // anonymous
    // -----------------------------------------------------------------

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("allRoutes")
    @DisplayName("anonymous callers get 401")
    void anonymousIsRejected(HttpMethod method, String path) throws Exception {
        int status = call(method, path, anonymous()).getResponse().getStatus();

        assertEquals(401, status,
                method + " " + path + " answered " + status + " to an anonymous caller. Every "
                        + "route in these four trees used to be reachable with no token at all, "
                        + "because the whole tree was listed in permitAll().");
    }

    // -----------------------------------------------------------------
    // authenticated non-admin
    // -----------------------------------------------------------------

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("mutatingRoutes")
    @DisplayName("a non-admin role gets 403 on mutating routes")
    void nonAdminCannotMutate(HttpMethod method, String path) throws Exception {
        int status = call(method, path, technician()).getResponse().getStatus();

        assertEquals(403, status,
                method + " " + path + " answered " + status + " to ROLE_TECHNICIAN. These routes "
                        + "provision accounts, approve privilege elevation, suppress security "
                        + "alerts and govern CVE patching, so they are admin-only.");
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("readRoutes")
    @DisplayName("any authenticated role may read")
    void anyAuthenticatedRoleCanRead(HttpMethod method, String path) throws Exception {
        int status = call(method, path, technician()).getResponse().getStatus();

        assertNotEquals(401, status, method + " " + path + " should accept an authenticated caller");
        assertNotEquals(403, status,
                method + " " + path + " should not be admin-only for reads; that would break the "
                        + "self-service security consoles for technician and supplier accounts.");
    }

    // -----------------------------------------------------------------
    // hospital admin
    // -----------------------------------------------------------------

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("allRoutes")
    @DisplayName("a hospital admin is never blocked by authorization")
    void hospitalAdminIsNotBlocked(HttpMethod method, String path) throws Exception {
        int status = call(method, path, hospitalAdmin()).getResponse().getStatus();

        // 400/404/500 are all acceptable here: an empty {} body or a missing entity is a controller
        // concern, not an access-control one. Only 401 and 403 would mean the rules are too tight.
        assertNotEquals(401, status, method + " " + path + " rejected an authenticated admin");
        assertNotEquals(403, status, method + " " + path + " forbade ROLE_HOSPITAL");
    }

    // -----------------------------------------------------------------
    // the authentication endpoints must stay open
    // -----------------------------------------------------------------

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("publicAuthRoutes")
    @DisplayName("genuine authentication endpoints remain anonymous")
    void authenticationEndpointsRemainPublic(HttpMethod method, String path) throws Exception {
        int status = call(method, path, anonymous()).getResponse().getStatus();

        assertNotEquals(401, status,
                path + " must stay public: a user cannot authenticate in order to authenticate.");
    }

    /**
     * Records what this suite is responsible for, so a route added under one of these trees later
     * is noticed rather than silently uncovered.
     */
    @Test
    @DisplayName("the sweep covers all four trees")
    void sweepCoversEveryTree() {
        List<String> paths = allRoutes().map(arguments -> (String) arguments.get()[1]).toList();

        for (String tree : List.of("/api/auth/pam/", "/api/auth/scim/",
                "/api/auth/commandcenter/", "/api/auth/vulnerability/")) {
            assertTrue(paths.stream().anyMatch(path -> path.startsWith(tree)),
                    "no route covered under " + tree);
        }
        assertEquals(29, paths.size(),
                "route inventory changed; re-check that every route is still covered");
    }
}
