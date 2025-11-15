import "./TableRow.css";
import { useNavigate, useFetcher, useRevalidator } from "react-router";
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

// Toggle Switch Component | * Handles offer activation/deactivation | * Uses useFetcher to update DB without page reload | * Shows loader during processing, updates UI only after successful DB update
function ToggleSwitch({ offer }) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  // Check if this specific offer is being toggled
  const isToggling =
    fetcher.state !== "idle" && fetcher.formData?.get("offerId") === offer._id;

  // Use actual offer status from DB (no optimistic UI)
  // The page will re-render with new data after fetcher completes
  const displayStatus = offer.status;

  const handleToggle = () => {
    const newStatus = offer.status === "active" ? "draft" : "active";

    // Submit form data to action - DB will be updated
    fetcher.submit(
      {
        offerId: offer._id,
        status: newStatus,
        action: "toggleStatus",
      },
      { method: "post" },
    );
  };

  // When fetcher completes successfully, revalidate to fetch fresh data from DB
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <s-stack direction="inline" gap="small-200" align="center">
      <s-switch
        checked={displayStatus === "active"}
        onChange={handleToggle}
        disabled={isToggling}
        accessibilityLabel="deal switch for on/off"
      />
      {isToggling && <s-spinner size="small" />}
    </s-stack>
  );
}
export function TableRow({ offer, onDelete, isFading }) {
  const navigate = useNavigate();
  return (
    <>
      <s-table-row className={isFading ? "fade-out-row" : ""}>
        <s-table-cell>
          <s-stack direction="inline" gap="small-200" align="center">
            <ToggleSwitch offer={offer} />
            <s-link href={`/app/offers/${offer._id}`}>
              {truncate(offer.title)}
            </s-link>
          </s-stack>
        </s-table-cell>
        <s-table-cell>
          <s-badge tone={offer.status === "active" ? "success" : "warning"}>
            {offer.status}
          </s-badge>
        </s-table-cell>
        <s-table-cell>{offer.discount.type}</s-table-cell>
        <s-table-cell icon="delete">
          <div className="actions-column">
            <s-button
              onClick={() => navigate(`/app/offers/${offer._id}`)}
              slot="secondary-actions"
              icon="edit"
              tone="neutral"
              accessibilityLabel="editing deal"
            ></s-button>
            <s-button
              onClick={() => onDelete(offer)}
              commandFor="deleteConfirmationModal"
              slot="secondary-actions"
              icon="delete"
              tone="critical"
              accessibilityLabel="deleting deal"
            ></s-button>
          </div>
        </s-table-cell>
      </s-table-row>
    </>
  );
}

export default function OffersTable({ offers }) {
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [fadingIds, setFadingIds] = useState([]);
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const modalRef = useRef(null); // 👈 yeh add karo

  // Handler when user clicks delete icon
  const handleDeleteClick = (offer) => {
    setOfferToDelete(offer);
  };

  // Handler when user clicks Cancel or X
  const handleCancelDelete = () => {
    setOfferToDelete(null);
  };

  // Handler when user clicks "Delete deal"
  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    // Row pe fade-out class lagane ke liye
    setFadingIds((prev) =>
      prev.includes(offerToDelete._id) ? prev : [...prev, offerToDelete._id],
    );
    fetcher.submit(
      {
        offerId: offerToDelete._id,
        action: "deleteOffer",
      },
      { method: "post" },
    );
  };

  // Button ke spinner ke liye:
  const isDeleting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("action") === "deleteOffer";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      // Modal close
      if (modalRef.current) {
        modalRef.current.hideOverlay();
      }

      const deletingId = offerToDelete?._id;

      if (fetcher.data.success) {
        // Fade list se bhi remove
        if (deletingId) {
          setFadingIds((prev) => prev.filter((id) => id !== deletingId));
        }

        setOfferToDelete(null);

        shopify.toast.show(
          fetcher.data.message || "Deal deleted successfully",
          { duration: 3000 },
        );

        revalidator.revalidate();
      } else if (fetcher.data.error) {
        if (deletingId) {
          setFadingIds((prev) => prev.filter((id) => id !== deletingId));
        }
        setOfferToDelete(null);

        shopify.toast.show(fetcher.data.error, {
          duration: 3000,
          isError: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <>
      {/* Table Starts from here*/}
      <s-section padding="none">
        <s-table>
          <s-table-header-row listSlot="primary">
            <s-table-header>Offer Title</s-table-header>
            <s-table-header>Status</s-table-header>
            <s-table-header>Discount Type</s-table-header>
            <s-table-header>Actions</s-table-header>
          </s-table-header-row>
          <s-table-body gap="base">
            {offers.map((offer) => {
              const isFading = fadingIds.includes(offer._id); // ✅ yaha define karo

              return (
                <TableRow
                  key={offer._id}
                  offer={offer}
                  onDelete={handleDeleteClick}
                  isFading={isFading}
                />
              );
            })}
          </s-table-body>
        </s-table>
      </s-section>
      {/* Confirmation Modal for Delete */}
      <s-modal
        id="deleteConfirmationModal"
        ref={modalRef}
        heading={`Delete ${offerToDelete?.title}?`}
      >
        <s-paragraph>
          {`Are you sure you want to delete ${offerToDelete?.title} deal? This can't be undone.`}
        </s-paragraph>

        <s-button
          onClick={handleCancelDelete}
          slot="secondary-actions"
          commandFor="deleteConfirmationModal"
          command="--hide"
        >
          Cancel
        </s-button>

        <s-button
          onClick={handleConfirmDelete}
          slot="primary-action"
          tone="critical"
          variant="primary"
        >
          {isDeleting ? (
            <s-stack direction="inline" gap="small-200" align="center">
              <s-spinner accessibilityLabel="Deleting" size="small" />
              <span>Deleting...</span>
            </s-stack>
          ) : (
            <span>Delete Deal</span>
          )}
        </s-button>
      </s-modal>
    </>
  );
}

OffersTable.propTypes = {
  offers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

TableRow.propTypes = {
  offer: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  isFading: PropTypes.bool, // 👈 new
};

ToggleSwitch.propTypes = {
  offer: PropTypes.object.isRequired,
};
