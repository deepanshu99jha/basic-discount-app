// app/routes/app._index.jsx
import { useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getShopOwnerName } from "../models/shop.server";
import { getOffersByShop, updateOffer } from "../models/offer.server";
import EmptyState from "../components/Dashboard/EmptyState";
import OffersTable from "../components/Dashboard/OffersTable";

/**
 * LOADER - Runs on SERVER before page loads
 * Fetches shop owner name and all offers from MongoDB
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch data in parallel for better performance
  const [shopOwnerName, offers] = await Promise.all([
    getShopOwnerName(shop),
    getOffersByShop(shop),
  ]);

  return Response.json({
    shopOwnerName,
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
  const { shopOwnerName, offers } = useLoaderData();
  const navigate = useNavigate();

  // Show offers exist (for easier logic)
  const hasOffers = offers.length > 0;

  const handleCreateOffer = () => {
    navigate("/app/offers/new");
  };

  return (
    <s-page>
      <s-heading>{`Hi, ${shopOwnerName} 👋 Welcome to Discount App 🎉!`}</s-heading>
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
