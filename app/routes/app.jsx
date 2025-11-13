import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../models/shop.server";

/**
 * Parent Layout Loader
 * Authenticates ONCE and fetches shop data for all child routes
 * Child routes can access this data via useMatches() without re-authenticating
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch shop data once for all child routes
  const shopData = await getShopByDomain(shop);

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop,
    shopData: {
      shopUserName: shopData?.shopUserName || "Store Owner",
      currency: shopData?.settings?.currency || "USD",
      settings: shopData?.settings || {},
    },
  };
};

/**
 * Prevents re-running loader on every navigation
 * Only revalidate on form submissions or explicit revalidation
 */
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }) {
  // Always revalidate after form submissions
  if (defaultShouldRevalidate) {
    return true;
  }

  // Don't revalidate on same-app navigation
  return false;
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
