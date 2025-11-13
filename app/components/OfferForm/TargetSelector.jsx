// app/components/OfferForm/TargetSelector.jsx
import { useState } from "react";

/**
 * Target Selector Component
 * Radio buttons for selecting offer target (Product/Collection/All)
 */
export default function TargetSelector({ defaultValue = "all" }) {
  const [selectedTarget, setSelectedTarget] = useState(defaultValue);

  return (
    <s-card>
      <s-box padding="400">
        <s-block-stack gap="400">
          <s-text variant="headingMd" as="h2">
            Select Target
          </s-text>
          <s-text variant="bodyMd" tone="subdued">
            Choose which products this discount applies to
          </s-text>

          {/* Hidden inputs for form submission */}
          <input type="hidden" name="targetType" value={selectedTarget} />
          <input type="hidden" name="productIds" value="[]" />
          <input type="hidden" name="collectionIds" value="[]" />

          {/* Radio button group using Polaris radio buttons */}
          <s-block-stack gap="300">
            <s-radio-button
              label="All Products"
              helpText="Apply discount to all products in your store"
              id="target-all"
              name="target-display"
              checked={selectedTarget === "all"}
              onChange={() => setSelectedTarget("all")}
            />

            <s-radio-button
              label="Specific Products"
              helpText="Coming in Phase 4 - Product picker"
              id="target-product"
              name="target-display"
              checked={selectedTarget === "product"}
              onChange={() => setSelectedTarget("product")}
              disabled
            />

            <s-radio-button
              label="Specific Collections"
              helpText="Coming in Phase 4 - Collection picker"
              id="target-collection"
              name="target-display"
              checked={selectedTarget === "collection"}
              onChange={() => setSelectedTarget("collection")}
              disabled
            />
          </s-block-stack>
        </s-block-stack>
      </s-box>
    </s-card>
  );
}
