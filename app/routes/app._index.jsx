// app/routes/app._index.jsx
import { useLoaderData, useNavigate, useMatches } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getOffersByShop,
  updateOffer,
  deleteOffer,
} from "../models/offer.server";
import { getShopDataFromParent } from "../utils/shopData";
import EmptyState from "../components/Dashboard/EmptyState";
import OffersTable from "../components/Dashboard/OffersTable";
import Analytics from "../components/Dashboard/Analytics";

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

    // Update the offer in the database
    const updatedOffer = await updateOffer(shop, offerId, {
      status: newStatus,
    });

    // Return the updated offer so useFetcher can access it
    return Response.json({
      success: true,
      offer: updatedOffer,
    });
  }
  // Handle delete action of Offer from the table
  if (action === "deleteOffer") {
    try {
      const offerId = formData.get("offerId");
      // Validate we have an offer ID
      if (!offerId) {
        return Response.json(
          { success: false, error: "Offer ID is required" },
          { status: 400 },
        );
      }
      // Delete the offer from database
      const deletedOffer = await deleteOffer(shop, offerId);

      // Check if deletion was successful
      if (!deletedOffer) {
        return Response.json(
          { success: false, error: "Offer not found" },
          { status: 404 },
        );
      }
      // Return success response
      return Response.json({
        success: true,
        message: "Deal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting offer:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }
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
    <s-page gap="base">
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
      <h1>{`Welcome ${shopUserName} 🎉!`}</h1>
      <Analytics />
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
