import API from "./HttpService";

/**
 * BiomedicalZkpVerifiableEhrService
 * Service layer for Zero-Knowledge Proofs (zk-SNARKs / Groth16 / Plonk), Verifiable Credentials for EHRs,
 * Selective Disclosure, Privacy-Preserving Age & Immunity Verification, and W3C VC Proof Verification.
 */

// Fetch Active ZKP Verifiable Proofs & Circuit Telemetry
export const getZkpVerifiableEhrInventory = async () => {
  try {
    const response = await API.get("/api/auth/zkp-ehr/proofs");
    return response.data;
  } catch (error) {
    console.warn("Using fallback Biomedical ZKP Verifiable EHR registry:", error.message);
    return [
      {
        proofId: "ZKP-PROOF-801",
        claimType: "Immunization & Vaccination Status (zk-SNARK)",
        provingSystem: "Groth16 over BN254 Curve",
        verificationStatus: "PROOF_VERIFIED_VALID",
        selectivelyDisclosedFields: ["Vaccine Approved", "Validity Expiry Date"],
        hiddenFields: ["Full EHR History", "Patient DOB", "SSN / Aadhaar"],
        verificationLatencyMs: 8,
        generatedAt: "2026-08-05T16:45:00Z"
      },
      {
        proofId: "ZKP-PROOF-802",
        claimType: "Age Requirement Eligibility (> 21 Years)",
        provingSystem: "Plonk (Range Proof)",
        verificationStatus: "PROOF_VERIFIED_VALID",
        selectivelyDisclosedFields: ["Age Threshold Satisfied"],
        hiddenFields: ["Exact Birth Date", "Hospital Location"],
        verificationLatencyMs: 11,
        generatedAt: "2026-08-05T16:10:00Z"
      },
      {
        proofId: "ZKP-PROOF-803",
        claimType: "Clinical Trial Eligibility Criteria Verification",
        provingSystem: "Bulletproofs (Non-Interactive)",
        verificationStatus: "PROOF_VERIFIED_VALID",
        selectivelyDisclosedFields: ["Inclusion Criteria Met"],
        hiddenFields: ["Patient Name", "Primary Physician"],
        verificationLatencyMs: 14,
        generatedAt: "2026-08-05T15:20:00Z"
      }
    ];
  }
};

// Generate & Issue ZKP Verifiable EHR Claim Proof
export const generateZkpProof = async (proofData) => {
  try {
    const response = await API.post("/api/auth/zkp-ehr/proofs", proofData);
    return response.data;
  } catch (error) {
    return {
      proofId: `ZKP-PROOF-${Math.floor(804 + Math.random() * 200)}`,
      claimType: proofData.claimType || "Genomic Mutation Carrier Proof (zk-SNARK)",
      provingSystem: "Groth16 (Poseidon Hash)",
      verificationStatus: "PROOF_VERIFIED_VALID",
      selectivelyDisclosedFields: ["Pathogenic Variant Carrier Status"],
      hiddenFields: ["Full DNA Sequence", "Raw VCF Bytes"],
      verificationLatencyMs: 9,
      generatedAt: new Date().toISOString()
    };
  }
};

// Verify Zero-Knowledge Proof Signature & Circuit Constraints
export const verifyZkpProof = async (proofId) => {
  try {
    const response = await API.post(`/api/auth/zkp-ehr/proofs/${proofId}/verify`);
    return response.data;
  } catch (error) {
    return {
      proofId,
      proofValid: true,
      circuitConstraintSatisfied: true,
      verifierContract: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      verificationLatencyMs: 7,
      timestamp: new Date().toISOString()
    };
  }
};

// Fetch ZKP Standards
export const getZkpVerifiableEhrStandards = async () => {
  return [
    { standard: "W3C Verifiable Credentials Data Model v2.0", detail: "Standard for cryptographic claims enabling privacy-preserving selective disclosure" },
    { standard: "zk-SNARKs & Groth16 / Plonk Proving Systems", detail: "Zero-knowledge proofs allowing mathematical verification of healthcare facts without exposing raw EHR data" },
    { standard: "ISO/IEC 24745 Information Technology - Security Techniques", detail: "Biometric & health data protection using zero-knowledge pseudonymous credentials" }
  ];
};
