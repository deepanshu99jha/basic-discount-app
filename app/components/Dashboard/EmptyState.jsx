// app/components/Dashboard/EmptyState.jsx
import { useNavigate } from "react-router";

/**
 * Empty State Component
 * Shown when merchant has no offers yet
 * Follows Shopify BFS guidelines for empty states
 */
export default function EmptyState() {
  const navigate = useNavigate();

  const handleCreateOffer = () => {
    navigate("/app/offers/new");
  };

  return (
    <s-card>
      <s-box padding="large">
        <s-block-stack gap="400" inlineAlign="center">
          <s-box
            padding="400"
            background="surface-secondary"
            borderRadius="full"
          >
            <s-icon source="discount" size="large" tone="base" />
          </s-box>

          {/* Heading */}
          <s-text variant="headingLg" as="h1" type="strong">
            Create your first discount offer
          </s-text>

          {/* Description */}
          <s-box maxInlineSize="480px" padding="large">
            <s-text variant="bodyMd" as="p" alignment="center" tone="subdued">
              Start by creating a discount offer for your products, collections,
              or all products. You can customize the discount type, value, and
              display settings to engage your customers.
            </s-text>
          </s-box>
          <s-button onClick={handleCreateOffer} variant="primary">
            Create Offer
          </s-button>

          {/* Action button with icon */}
        </s-block-stack>
      </s-box>
    </s-card>
  );
}
