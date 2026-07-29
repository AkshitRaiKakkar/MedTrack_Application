import API from "./HttpService";

// Get all tracked build artifacts
export const getAllArtifacts = async () => {
  const response = await API.get("/api/auth/sbom/artifacts");
  return response.data;
};

// Register a new build artifact for SBOM tracking
export const registerArtifact = async (data) => {
  const response = await API.post("/api/auth/sbom/artifacts", data);
  return response.data;
};

// Get all open-source dependency components
export const getAllComponents = async () => {
  const response = await API.get("/api/auth/sbom/components");
  return response.data;
};

// Ingest a CycloneDX dependency component
export const ingestComponent = async (data) => {
  const response = await API.post("/api/auth/sbom/components/ingest", data);
  return response.data;
};

// Generate SHA-256 supply chain attestation report bundle
export const generateAttestation = async (artifactId) => {
  const response = await API.get("/api/auth/sbom/attest", {
    params: { artifactId }
  });
  return response.data;
};
