// app/utils/shopData.js

/**
 * Helper hook to access shop data from parent route
 * Prevents redundant database calls by reusing parent loader data
 *
 * @param {Array} matches - Route matches from useMatches()
 * @returns {Object} Shop data from parent route
 */
export function getShopDataFromParent(matches) {
  const appRoute = matches.find((match) => match.id === "routes/app");
  return {
    shop: appRoute?.data?.shop || "",
    shopUserName: appRoute?.data?.shopData?.shopUserName || "Store Owner",
    currency: appRoute?.data?.shopData?.currency || "USD",
    settings: appRoute?.data?.shopData?.settings || {},
  };
}
