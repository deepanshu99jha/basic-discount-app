// app/utils/offer.js

/**
 * Generate unique offer ID
 * Format: off_timestamp_randomstring
 * Example: off_1762451234567_k3j4h5g6
 */
export function generateOfferId() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `off_${timestamp}_${randomStr}`;
}

/**
 * Format discount value for display
 * @param {Object} discount - { discountType, value, currency }
 * @returns {string} - "10%" or "$5"
 */
export function formatDiscountValue(discount) {
  if (discount.discountType === "percentage") {
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
 * @param {Object} target - { targetType, productIds, collectionIds }
 * @returns {string} - "All Products", "5 Products", "2 Collections"
 */
export function formatTargetType(target) {
  if (target.appliesToAllProducts || target.targetType === "all") {
    return "All Products";
  }
  if (target.targetType === "product") {
    const count = target.productIds?.length || 0;
    return `${count} Product${count !== 1 ? "s" : ""}`;
  }
  if (target.targetType === "collection") {
    const count = target.collectionIds?.length || 0;
    return `${count} Collection${count !== 1 ? "s" : ""}`;
  }
  return "Unknown";
}
