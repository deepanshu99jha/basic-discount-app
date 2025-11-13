// app/components/OfferForm/DiscountFields.jsx
import { useState } from "react";

/**
 * Discount Fields Component
 * Input fields for discount type and value
 */
export default function DiscountFields({
  shopCurrency = "USD",
  errors = {},
}) {
  const [discountType, setDiscountType] = useState("percentage");

  return (
    <s-card>
      <s-box padding="400">
        <s-block-stack gap="400">
          <s-text variant="headingMd" as="h2">
            Discount Configuration
          </s-text>

          {/* Discount Type Radio Buttons */}
          <s-block-stack gap="200">
            <s-text variant="bodyMd" fontWeight="semibold">
              Discount Type
            </s-text>

            <input type="hidden" name="discountType" value={discountType} />

            <s-radio-button
              label="Percentage Off"
              helpText="e.g., 10% off"
              id="discount-percentage"
              name="discount-type-radio"
              checked={discountType === "percentage"}
              onChange={() => setDiscountType("percentage")}
            />

            <s-radio-button
              label="Fixed Amount Off"
              helpText={`e.g., ${shopCurrency} 5 off`}
              id="discount-fixed"
              name="discount-type-radio"
              checked={discountType === "fixed"}
              onChange={() => setDiscountType("fixed")}
            />
          </s-block-stack>

          {/* Discount Value Input */}
          <s-block-stack gap="200">
            <s-text-field
              label="Discount Value"
              type="number"
              name="discountValue"
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              step={discountType === "percentage" ? "1" : "0.01"}
              placeholder={
                discountType === "percentage" ? "10" : "5.00"
              }
              suffix={discountType === "percentage" ? "%" : shopCurrency}
              required
              error={errors.discountValue}
            />
            {discountType === "percentage" && (
              <s-text variant="bodySm" tone="subdued">
                Enter a value between 0 and 100
              </s-text>
            )}
          </s-block-stack>

          {/* Hidden input for currency */}
          <input type="hidden" name="currency" value={shopCurrency} />
        </s-block-stack>
      </s-box>
    </s-card>
  );
}
