// app/components/Dashboard/OffersTable.jsx
import { useFetcher } from "react-router";
import {
  formatDiscountValue,
  getStatusBadgeTone,
  formatTargetType,
} from "../../utils/offer";

/**
 * Offers Table Component
 * Displays all offers with toggle switches
 * Uses useFetcher for optimistic UI updates
 */
export default function OffersTable({ offers }) {
  return (
    <s-card>
      <s-data-table
        columnContentTypes={["text", "text", "text", "text", "text"]}
        headings={["Status", "Title", "Discount", "Target", "Active"]}
        rows={offers.map((offer) => [
          <StatusBadge key={offer._id} status={offer.status} />,
          <OfferTitle key={offer._id} offer={offer} />,
          formatDiscountValue(offer.discount),
          formatTargetType(offer.target),
          <ToggleSwitch key={offer._id} offer={offer} />,
        ])}
      />
    </s-card>
  );
}

/**
 * Status Badge Component
 * Shows offer status with appropriate color
 */
function StatusBadge({ status }) {
  return (
    <s-badge tone={getStatusBadgeTone(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </s-badge>
  );
}

/**
 * Offer Title Component
 * Clickable title that navigates to edit page
 */
function OfferTitle({ offer }) {
  return (
    <s-link url={`/app/offers/${offer._id}`} removeUnderline>
      <s-text variant="bodyMd" fontWeight="semibold">
        {offer.title}
      </s-text>
    </s-link>
  );
}

/**
 * Toggle Switch Component
 * Handles offer activation/deactivation
 * Uses useFetcher for instant UI feedback without page reload
 */
function ToggleSwitch({ offer }) {
  const fetcher = useFetcher();

  // Check if this specific offer is being toggled
  const isToggling =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("offerId") === offer._id;

  // Optimistic status (show new status immediately)
  const displayStatus = isToggling
    ? fetcher.formData.get("status")
    : offer.status;

  const handleToggle = () => {
    const newStatus = offer.status === "active" ? "paused" : "active";

    // Submit form data to action
    fetcher.submit(
      {
        offerId: offer._id,
        status: newStatus,
        action: "toggleStatus",
      },
      { method: "post" },
    );
  };

  return (
    <s-checkbox
      checked={displayStatus === "active"}
      onChange={handleToggle}
      disabled={isToggling}
    />
  );
}
