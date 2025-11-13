// app/routes/app._index.jsx
import { useLoaderData, useNavigate, useMatches } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOffersByShop, updateOffer } from "../models/offer.server";
import { getShopDataFromParent } from "../utils/shopData";
import EmptyState from "../components/Dashboard/EmptyState";
import OffersTable from "../components/Dashboard/OffersTable";

/**
 * LOADER - Runs on SERVER before page loads
 * Authentication already done in parent layout (app.jsx)
 * Only fetches offers - shop data comes from parent
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Only fetch offers - shop name already in parent loader
  const offers = await getOffersByShop(shop);

  return Response.json({
    offers: offers || [],
  });
};

/**
 * ACTION - Runs on SERVER when form is submitted
 * Handles toggle switches for activating/deactivating offers
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action");

  // Handle toggle status action
  if (action === "toggleStatus") {
    const offerId = formData.get("offerId");
    const newStatus = formData.get("status");

    await updateOffer(shop, offerId, { status: newStatus });

    return Response.json({ success: true });
  }

  return Response.json({ success: false }, { status: 400 });
};

/**
 * Dashboard Component
 * Shows personalized greeting and either empty state or offers table
 */
export default function Dashboard() {
  const { offers } = useLoaderData();
  const navigate = useNavigate();

  // Get shop data from parent route (app.jsx loader) - no redundant DB calls!
  const matches = useMatches();
  const { shopUserName } = getShopDataFromParent(matches);

  // Show offers exist (for easier logic)
  const hasOffers = offers.length > 0;

  const handleCreateOffer = () => {
    navigate("/app/offers/new");
  };

  return (
    <s-page>
      <h1>{`Welcome ${shopUserName} 🎉!`}</h1>
      {/* Show "Create Offer" button in header ONLY when offers exist */}
      {hasOffers && (
        <s-button
          slot="primary-action"
          onClick={handleCreateOffer}
          variant="primary"
        >
          Create Offer
        </s-button>
      )}

      {/* Conditional rendering: Empty state OR Offers table */}
      {hasOffers ? <OffersTable offers={offers} /> : <EmptyState />}
    </s-page>
  );
}

/**
 * Headers configuration
 * Required for Shopify embedded apps
 */
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
