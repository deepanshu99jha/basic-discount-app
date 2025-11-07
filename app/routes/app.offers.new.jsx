// app/routes/app.offers.new.jsx
import { authenticate } from "../shopify.server";

/**
 * LOADER - Authentication check
 */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return Response.json({});
};

/**
 * Create New Offer Page (Placeholder for Phase 3)
 */
export default function NewOffer() {
  return (
    <s-page title="Create New Offer" backAction={{ url: "/app" }}>
      <s-card>
        <s-box padding="large">
          <s-text variant="headingLg" as="h2">
            Coming Soon! 🚀
          </s-text>
          <s-box padding="base" />
          <s-text variant="bodyMd" as="p" tone="subdued">
            We'll build the "Create Offer" form in Phase 3. You'll learn:
          </s-text>
          <s-box padding="base" />
          <ul>
            <s-list-item>Product & Collection pickers</s-list-item>
            <s-list-item>Form validation with React Router</s-list-item>
            <s-list-item>Saving data to MongoDB</s-list-item>
            <s-list-item>Working with Shopify Admin GraphQL</s-list-item>
          </ul>
        </s-box>
      </s-card>
    </s-page>
  );
}
