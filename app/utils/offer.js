// app/utils/offer.js

/**
 * Format discount value for display
 * @param {Object} discount - { type, value, currency }
 * @returns {string} - "10%" or "$5"
 */
export function formatDiscountValue(discount) {
  if (discount.type === "percentage") {
    return `${discount.value}%`;
  }
  return `${discount.currency || "$"}${discount.value}`;
}

/**
 * Get badge tone based on status
 * @param {string} status - 'active', 'paused', 'expired'
 * @returns {string} - Polaris badge tone
 */
export function getStatusBadgeTone(status) {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "default";
    case "expired":
      return "critical";
    default:
      return "default";
  }
}

/**
 * Format target type for display
 * @param {Object} target - { targetType, products, collections }
 * @returns {string} - "All Products", "5 Products", "2 Collections"
 */
export function formatTargetType(target) {
  if (target.targetType === "all") {
    return "All Products";
  }
  if (target.targetType === "product") {
    const count = target.products?.length || 0;
    return `${count} Product${count !== 1 ? "s" : ""}`;
  }
  if (target.targetType === "collection") {
    const count = target.collections?.length || 0;
    return `${count} Collection${count !== 1 ? "s" : ""}`;
  }
  return "Unknown";
}
