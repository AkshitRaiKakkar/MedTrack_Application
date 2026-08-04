package com.medtrack.auth.saml.controller;

import com.medtrack.auth.saml.dto.*;
import com.medtrack.auth.saml.service.SamlIdentityProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Enterprise SAML 2.0 Identity Federation & SSO Assertion Processing.
 */
@RestController
@RequestMapping("/api/auth/saml")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "SAML 2.0 Identity Federation Subsystem", description = "APIs for Okta/AzureAD SAML2 IdP configuration, assertion XML payload validation, and active SSO sessions.")
public class SamlIdentityProviderController {

    private final SamlIdentityProviderService samlService;

    @GetMapping("/config")
    @Operation(summary = "Get SAML IdP Config", description = "Retrieves active SAML 2.0 Identity Provider configuration and x509 fingerprint.")
    public ResponseEntity<SamlIdpConfigResponse> getActiveConfig() {
        SamlIdpConfigResponse config = samlService.getActiveConfig();
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    @Operation(summary = "Update SAML IdP Config", description = "Updates SAML 2.0 IdP entityId, SSO URL, binding type, and signing options.")
    public ResponseEntity<SamlIdpConfigResponse> updateConfig(@Valid @RequestBody UpdateSamlConfigRequest request) {
        SamlIdpConfigResponse updated = samlService.updateConfig(request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/assertion/process")
    @Operation(summary = "Process SAML 2.0 Assertion", description = "Validates XML signature and processes incoming SAML2 SSO assertion payload.")
    public ResponseEntity<SamlSessionLogResponse> processSamlAssertion(@Valid @RequestBody ProcessSamlAssertionRequest request) {
        SamlSessionLogResponse response = samlService.processSamlAssertion(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get All SAML SSO Sessions", description = "Retrieves historical log of validated SAML 2.0 single sign-on assertions.")
    public ResponseEntity<List<SamlSessionLogResponse>> getAllSessionLogs() {
        List<SamlSessionLogResponse> logs = samlService.getAllSessionLogs();
        return ResponseEntity.ok(logs);
    }
}
