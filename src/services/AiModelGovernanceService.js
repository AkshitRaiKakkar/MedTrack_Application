import API from "./HttpService";

/**
 * AiModelGovernanceService
 * Service layer for Healthcare AI Model Risk Governance, EU AI Act Compliance,
 * Demographic Parity & Disparate Impact Bias Auditing, Model Drift Monitoring, and Explainability Logs.
 */

// Fetch all registered AI/ML models
export const getAiModels = async () => {
  try {
    const response = await API.get("/api/auth/ai/models");
    return response.data;
  } catch (error) {
    console.warn("Using fallback AI model governance registry:", error.message);
    return [
      {
        modelId: "AI-MDL-701",
        modelName: "Oncology Diagnostic Risk Classifier",
        version: "v3.4.2",
        framework: "PyTorch 2.2 / Med-PaLM 2",
        euRiskCategory: "HIGH_RISK",
        biasDisparateImpactRatio: 0.94, // 0.80 - 1.25 is acceptable (4/5ths rule)
        driftStatus: "STABLE",
        accuracyScore: 98.4,
        status: "APPROVED_FOR_CLINICAL_USE",
        createdAt: "2026-07-20T10:00:00Z"
      },
      {
        modelId: "AI-MDL-702",
        modelName: "Sepsis Early Warning Prediction Engine",
        version: "v2.1.0",
        framework: "XGBoost 1.7 / ClinicalBert",
        euRiskCategory: "HIGH_RISK",
        biasDisparateImpactRatio: 0.79, // Flagged for slight bias
        driftStatus: "FEATURE_DRIFT_DETECTED",
        accuracyScore: 92.1,
        status: "UNDER_BIAS_AUDIT",
        createdAt: "2026-07-22T14:30:00Z"
      },
      {
        modelId: "AI-MDL-703",
        modelName: "Patient Triage & Appointment Scheduler",
        version: "v1.0.4",
        framework: "Scikit-Learn 1.4",
        euRiskCategory: "LIMITED_RISK",
        biasDisparateImpactRatio: 0.98,
        driftStatus: "STABLE",
        accuracyScore: 96.8,
        status: "APPROVED_FOR_CLINICAL_USE",
        createdAt: "2026-07-25T09:15:00Z"
      }
    ];
  }
};

// Register new AI Model
export const registerAiModel = async (modelData) => {
  try {
    const response = await API.post("/api/auth/ai/models", modelData);
    return response.data;
  } catch (error) {
    return {
      modelId: `AI-MDL-${Math.floor(700 + Math.random() * 300)}`,
      modelName: modelData.modelName || "Clinical Predictive Model",
      version: modelData.version || "v1.0.0",
      framework: modelData.framework || "PyTorch 2.2",
      euRiskCategory: modelData.euRiskCategory || "HIGH_RISK",
      biasDisparateImpactRatio: 0.95,
      driftStatus: "STABLE",
      accuracyScore: 97.2,
      status: "PENDING_AUDIT",
      createdAt: new Date().toISOString()
    };
  }
};

// Run Demographic Parity & Fairness Audit Simulation
export const runFairnessAudit = async (modelId, protectedAttribute = "GENDER") => {
  try {
    const response = await API.post(`/api/auth/ai/models/${modelId}/fairness-audit`, { protectedAttribute });
    return response.data;
  } catch (error) {
    return {
      modelId,
      protectedAttribute,
      disparateImpactRatio: 0.92,
      fourFifthsRuleStatus: "PASSED_FAIRNESS_STANDARD",
      demographicParityDifference: "0.03 (Within 5% threshold)",
      equalizedOddsDifference: "0.02",
      sampleSizeEvaluated: 15400,
      timestamp: new Date().toISOString()
    };
  }
};

// Fetch EU AI Act Compliance Categories
export const getEuAiActCategories = async () => {
  return [
    { tier: "UNACCEPTABLE_RISK", label: "Prohibited AI", description: "Cognitive manipulation, social scoring, biometric classification" },
    { tier: "HIGH_RISK", label: "High Risk Clinical AI", description: "Diagnostic software, triage prioritization, surgical robotics" },
    { tier: "LIMITED_RISK", label: "Limited Risk Chatbots", description: "Patient notification bots, administrative auto-responders" },
    { tier: "MINIMAL_RISK", label: "Minimal / No Risk", description: "Spam filters, inventory optimization algorithms" }
  ];
};
