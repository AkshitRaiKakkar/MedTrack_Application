import API from "./HttpService";

// Fetch hospital analytics metrics
export const getHospitalAnalytics = async () => {
  const response = await API.get("/api/analytics/hospital");
  return response.data;
};

// Fetch equipment failure risk
export const getEquipmentFailureRisk = async (equipmentId) => {
  const response = await API.get(`/api/analytics/equipment/${equipmentId}/failure-risk`);
  return response.data;
};

const healthScoreCache = new Map();

/**
 * Compute a 0-100 health score for an equipment asset.
 * Includes caching to ensure list pages remain fast.
 */
export const computeEquipmentHealthScore = (equipment) => {
  if (!equipment || !equipment.id) return null;

  // Cache invalidation: in a real app we might use a timestamp or hash of the object,
  // but for frontend session, we'll cache by object reference or stringified content.
  // To keep it simple and reactive to edits, we use a simple stringified subset of relevant fields.
  const cacheKey = `${equipment.id}-${equipment.status}-${equipment.warrantyDaysRemaining}-${equipment.bookValue}`;
  
  if (healthScoreCache.has(cacheKey)) {
    return healthScoreCache.get(cacheKey);
  }

  let score = 100;
  const factors = [];

  // 1. Maintenance & Status
  const status = (equipment.status || "Unknown").toUpperCase();
  if (status === "NEEDS_MAINTENANCE" || status === "UNDER_MAINTENANCE" || status === "MAINTENANCE") {
    score -= 40;
    factors.push({
      label: "Maintenance Status",
      impact: "-40",
      recommendation: "Asset requires immediate maintenance.",
    });
  } else if (status === "RETIRED" || status === "DISPOSED") {
    score = 0;
    factors.push({
      label: "Asset Retired",
      impact: "-100",
      recommendation: "Asset is no longer in active service.",
    });
  } else {
    factors.push({
      label: "Operational Status",
      impact: "0",
      recommendation: "Asset is operating normally.",
    });
  }

  // 2. Warranty / Coverage
  if (equipment.warrantyDaysRemaining !== null && equipment.warrantyDaysRemaining !== undefined) {
    if (equipment.warrantyDaysRemaining < 0) {
      score -= 20;
      factors.push({
        label: "Warranty Expired",
        impact: "-20",
        recommendation: "Renew service contract to mitigate out-of-pocket repair costs.",
      });
    } else if (equipment.warrantyDaysRemaining <= 90) {
      score -= 10;
      factors.push({
        label: "Warranty Expiring Soon",
        impact: "-10",
        recommendation: "Plan for contract renewal within the next 90 days.",
      });
    } else {
      factors.push({
        label: "Warranty Active",
        impact: "0",
        recommendation: "Asset is covered under active warranty.",
      });
    }
  } else {
    // If no warranty info, assume a slight risk or neutral. We'll be neutral.
    factors.push({
      label: "Warranty Coverage",
      impact: "0",
      recommendation: "No warranty data on file. Consider adding coverage details.",
    });
  }

  // 3. Depreciation / Age
  if (equipment.bookValue !== null && equipment.bookValue !== undefined) {
    if (Number(equipment.bookValue) === 0) {
      score -= 20;
      factors.push({
        label: "Fully Depreciated",
        impact: "-20",
        recommendation: "Asset has reached the end of its useful financial life. Consider replacement.",
      });
    } else {
      factors.push({
        label: "Depreciation Status",
        impact: "0",
        recommendation: "Asset retains financial book value.",
      });
    }
  }

  // Floor the score at 0
  score = Math.max(0, score);

  let color = "green";
  let label = "Healthy";
  if (score < 50) {
    color = "red";
    label = "Critical Risk";
  } else if (score < 80) {
    color = "amber";
    label = "At Risk";
  }

  const result = { score, color, label, factors };
  
  // Save to cache (limit size to prevent memory leaks in long sessions)
  if (healthScoreCache.size > 1000) {
    healthScoreCache.clear();
  }
  healthScoreCache.set(cacheKey, result);

  return result;
};
