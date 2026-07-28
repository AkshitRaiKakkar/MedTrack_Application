package com.medtrack.auth.microsegmentation.controller;

import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.service.MicrosegmentationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Zero-Trust Microsegmentation & Software-Defined Perimeter (SDP).
 */
@RestController
@RequestMapping("/api/auth/microsegmentation")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Microsegmentation & SDP Subsystem", description = "APIs for network microsegmentation rules, posture-aware traffic controls, and encrypted SDP tunnel orchestration.")
public class MicrosegmentationController {

    private final MicrosegmentationService microsegmentationService;

    @GetMapping("/rules")
    @Operation(summary = "Get All Microsegmentation Rules", description = "Retrieves all configured network segment isolation policies.")
    public ResponseEntity<List<MicrosegmentationPolicyResponse>> getAllPolicies() {
        List<MicrosegmentationPolicyResponse> policies = microsegmentationService.getAllPolicies();
        return ResponseEntity.ok(policies);
    }

    @PostMapping("/rules")
    @Operation(summary = "Create Microsegmentation Rule", description = "Creates a new network isolation rule restricting segment-to-segment traffic.")
    public ResponseEntity<MicrosegmentationPolicyResponse> createRule(@Valid @RequestBody CreateMicrosegmentationRuleRequest request) {
        MicrosegmentationPolicyResponse response = microsegmentationService.createRule(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/rules/{ruleId}/toggle")
    @Operation(summary = "Toggle Rule Status", description = "Enables or disables a microsegmentation policy rule.")
    public ResponseEntity<MicrosegmentationPolicyResponse> toggleRuleStatus(@PathVariable String ruleId, @RequestParam boolean active) {
        MicrosegmentationPolicyResponse response = microsegmentationService.toggleRuleStatus(ruleId, active);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tunnels")
    @Operation(summary = "Get All SDP Tunnels", description = "Retrieves active and terminated Software-Defined Perimeter encrypted tunnel sessions.")
    public ResponseEntity<List<SdpTunnelSessionResponse>> getAllTunnels() {
        List<SdpTunnelSessionResponse> tunnels = microsegmentationService.getAllTunnels();
        return ResponseEntity.ok(tunnels);
    }

    @PostMapping("/tunnels/establish")
    @Operation(summary = "Establish SDP Tunnel", description = "Establishes a WireGuard/IPsec encrypted SDP tunnel session to a protected segment.")
    public ResponseEntity<SdpTunnelSessionResponse> establishTunnel(@Valid @RequestBody EstablishSdpTunnelRequest request) {
        SdpTunnelSessionResponse response = microsegmentationService.establishTunnel(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/tunnels/{sessionId}/terminate")
    @Operation(summary = "Terminate SDP Tunnel", description = "Terminates an active SDP encrypted tunnel session.")
    public ResponseEntity<SdpTunnelSessionResponse> terminateTunnel(@PathVariable String sessionId) {
        SdpTunnelSessionResponse response = microsegmentationService.terminateTunnel(sessionId);
        return ResponseEntity.ok(response);
    }
}
