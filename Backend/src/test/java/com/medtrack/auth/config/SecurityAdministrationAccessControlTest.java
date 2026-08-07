package com.medtrack.auth.config;

import java.util.List;
import java.util.stream.Stream;

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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/**
 * Verifies the role boundary for security administration modules that are not
 * self-service authentication flows. These routes manage organization-wide
 * security policies, telemetry, evidence, posture, cloud configuration and
 * incident response, so writes must never fall through to authenticated-only
 * access.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "app.data-initializer.enabled=false",
        "security.rate-limit.auth.capacity=10000",
        "security.rate-limit.get.capacity=10000",
        "security.rate-limit.write.capacity=10000",
        "app.jwt.secret=integration-test-secret-value-long-enough-for-hmac-sha256"
})
@DisplayName("Security administration API access control")
class SecurityAdministrationAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static Stream<Arguments> readRoutes() {
        return Stream.of(
                Arguments.of(HttpMethod.GET, "/api/auth/compliance/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/compliance/reports"),
                Arguments.of(HttpMethod.GET, "/api/auth/cspm/accounts"),
                Arguments.of(HttpMethod.GET, "/api/auth/cspm/findings"),
                Arguments.of(HttpMethod.GET, "/api/auth/evidence/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/evidence/records"),
                Arguments.of(HttpMethod.GET, "/api/auth/governance/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/governance/controls"),
                Arguments.of(HttpMethod.GET, "/api/auth/microsegmentation/rules"),
                Arguments.of(HttpMethod.GET, "/api/auth/microsegmentation/tunnels"),
                Arguments.of(HttpMethod.GET, "/api/auth/observability/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/observability/streams"),
                Arguments.of(HttpMethod.GET, "/api/auth/playbook/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/playbook/executions"),
                Arguments.of(HttpMethod.GET, "/api/auth/posture/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/posture/evaluations"),
                Arguments.of(HttpMethod.GET, "/api/auth/reporting/config"),
                Arguments.of(HttpMethod.GET, "/api/auth/reporting/exports"),
                Arguments.of(HttpMethod.GET, "/api/auth/saml/config"),
                Arguments.of(HttpMethod.GET, "/api/auth/saml/sessions"),
                Arguments.of(HttpMethod.GET, "/api/auth/sbom/artifacts"),
                Arguments.of(HttpMethod.GET, "/api/auth/sbom/components"),
                Arguments.of(HttpMethod.GET, "/api/auth/soar/playbooks"),
                Arguments.of(HttpMethod.GET, "/api/auth/soar/executions"),
                Arguments.of(HttpMethod.GET, "/api/auth/threat/policy"),
                Arguments.of(HttpMethod.GET, "/api/auth/threat/incidents"),
                Arguments.of(HttpMethod.GET, "/api/auth/threatintel/config"),
                Arguments.of(HttpMethod.GET, "/api/auth/threatintel/ioc"));
    }

    private static Stream<Arguments> mutationRoutes() {
        return Stream.of(
                Arguments.of(HttpMethod.PUT, "/api/auth/compliance/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/compliance/audit/run"),
                Arguments.of(HttpMethod.POST, "/api/auth/compliance/controls/evidence"),
                Arguments.of(HttpMethod.POST, "/api/auth/cspm/accounts"),
                Arguments.of(HttpMethod.POST, "/api/auth/cspm/findings/ingest"),
                Arguments.of(HttpMethod.PUT, "/api/auth/cspm/findings/1/remediate"),
                Arguments.of(HttpMethod.PUT, "/api/auth/evidence/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/evidence/records/ingest"),
                Arguments.of(HttpMethod.POST, "/api/auth/evidence/chain/verify"),
                Arguments.of(HttpMethod.PUT, "/api/auth/governance/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/governance/scan"),
                Arguments.of(HttpMethod.POST, "/api/auth/microsegmentation/rules"),
                Arguments.of(HttpMethod.PUT, "/api/auth/microsegmentation/rules/1/toggle"),
                Arguments.of(HttpMethod.POST, "/api/auth/microsegmentation/tunnels/establish"),
                Arguments.of(HttpMethod.PUT, "/api/auth/observability/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/observability/streams/ingest"),
                Arguments.of(HttpMethod.POST, "/api/auth/observability/metrics/record"),
                Arguments.of(HttpMethod.PUT, "/api/auth/playbook/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/playbook/trigger"),
                Arguments.of(HttpMethod.POST, "/api/auth/playbook/steps/record"),
                Arguments.of(HttpMethod.PUT, "/api/auth/posture/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/posture/evaluation/run"),
                Arguments.of(HttpMethod.POST, "/api/auth/posture/controls/check"),
                Arguments.of(HttpMethod.PUT, "/api/auth/reporting/config"),
                Arguments.of(HttpMethod.POST, "/api/auth/reporting/generate"),
                Arguments.of(HttpMethod.PUT, "/api/auth/saml/config"),
                Arguments.of(HttpMethod.POST, "/api/auth/saml/assertion/process"),
                Arguments.of(HttpMethod.POST, "/api/auth/sbom/artifacts"),
                Arguments.of(HttpMethod.POST, "/api/auth/sbom/components/ingest"),
                Arguments.of(HttpMethod.POST, "/api/auth/soar/playbooks"),
                Arguments.of(HttpMethod.PUT, "/api/auth/soar/playbooks/1/toggle"),
                Arguments.of(HttpMethod.POST, "/api/auth/soar/execute"),
                Arguments.of(HttpMethod.PUT, "/api/auth/threat/policy"),
                Arguments.of(HttpMethod.POST, "/api/auth/threat/incidents"),
                Arguments.of(HttpMethod.POST, "/api/auth/threat/containment"),
                Arguments.of(HttpMethod.PUT, "/api/auth/threatintel/config"),
                Arguments.of(HttpMethod.POST, "/api/auth/threatintel/ioc/ingest"),
                Arguments.of(HttpMethod.POST, "/api/auth/threatintel/mitigate/trigger"));
    }

    private static Stream<Arguments> allRoutes() {
        return Stream.concat(readRoutes(), mutationRoutes());
    }

    private MvcResult call(HttpMethod method, String path, RequestPostProcessor caller)
            throws Exception {
        return mockMvc.perform(request(method, path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(caller))
                .andReturn();
    }

    private static RequestPostProcessor nonAdmin() {
        return user("technician@medtrack.com").roles("TECHNICIAN");
    }

    private static RequestPostProcessor hospitalAdmin() {
        return user("hospital@medtrack.com").roles("HOSPITAL");
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("allRoutes")
    @DisplayName("anonymous callers receive 401")
    void anonymousCallerIsRejected(HttpMethod method, String path) throws Exception {
        int status = call(method, path, anonymous()).getResponse().getStatus();

        assertEquals(401, status,
                method + " " + path + " must require an authenticated caller");
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("mutationRoutes")
    @DisplayName("non-admin callers receive 403 on mutations")
    void nonAdminCannotChangeSecurityAdministrationData(HttpMethod method, String path) throws Exception {
        int status = call(method, path, nonAdmin()).getResponse().getStatus();

        assertEquals(403, status,
                method + " " + path + " must require the HOSPITAL role");
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("readRoutes")
    @DisplayName("authenticated non-admin callers retain read access")
    void nonAdminCanReadSecurityAdministrationData(HttpMethod method, String path) throws Exception {
        int status = call(method, path, nonAdmin()).getResponse().getStatus();

        assertNotEquals(401, status, method + " " + path + " should accept authenticated users");
        assertNotEquals(403, status, method + " " + path + " should remain readable");
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("allRoutes")
    @DisplayName("hospital administrators pass authorization")
    void hospitalAdminIsNotBlocked(HttpMethod method, String path) throws Exception {
        int status = call(method, path, hospitalAdmin()).getResponse().getStatus();

        assertNotEquals(401, status, method + " " + path + " rejected an authenticated admin");
        assertNotEquals(403, status, method + " " + path + " rejected a hospital admin");
    }

    @Test
    @DisplayName("all unclassified security administration trees are covered")
    void routeInventoryCoversEverySecurityAdministrationTree() {
        List<String> paths = allRoutes().map(arguments -> (String) arguments.get()[1]).toList();

        for (String tree : List.of(
                "/api/auth/compliance/",
                "/api/auth/cspm/",
                "/api/auth/evidence/",
                "/api/auth/governance/",
                "/api/auth/microsegmentation/",
                "/api/auth/observability/",
                "/api/auth/playbook/",
                "/api/auth/posture/",
                "/api/auth/reporting/",
                "/api/auth/saml/",
                "/api/auth/sbom/",
                "/api/auth/soar/",
                "/api/auth/threat/",
                "/api/auth/threatintel/")) {
            assertTrue(paths.stream().anyMatch(path -> path.startsWith(tree)),
                    "no authorization route is covered under " + tree);
        }
        assertEquals(66, paths.size(), "route inventory changed; re-check authorization coverage");
    }
}
