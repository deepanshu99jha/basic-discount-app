export default function EmptyState() {
  return (
    <>
      <s-section accessibilityLabel="Empty state section">
        <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
          <s-box maxInlineSize="200px" maxBlockSize="200px">
            {/* aspectRatio should match the actual image dimensions (width/height) */}
            <s-image
              aspectRatio="1/0.5"
              src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
              alt="A stylized graphic of four characters, each holding a puzzle piece"
            />
          </s-box>

          <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
            <s-stack alignItems="center" gap="base">
              <s-heading>Create your first discount offer</s-heading>
              <div style={{ textAlign: "center" }}>
                Start by creating a discount offer for your products,
                collections, or all products. You can customize the discount
                type, value, and display settings to engage your customers.
              </div>
            </s-stack>
            <s-stack
              gap="small-200"
              justifyContent="center"
              padding="base"
              paddingBlockEnd="none"
              direction="inline"
            >
              <s-button href="/app/offers/new" variant="primary">
                Create Offer
              </s-button>
            </s-stack>
          </s-grid>
        </s-grid>
      </s-section>
    </>
  );
}
