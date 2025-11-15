import { useState, useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useNavigation,
  useNavigate,
  useParams,
} from "react-router";
import { authenticate } from "../shopify.server";
// import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  getOfferById,
  deleteOffer,
  createOffer,
  updateOffer,
  generateOfferId,
} from "../models/offer.server";

export async function loader({ request, params }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Return default values for new offer
  if (params.id === "new") {
    return {
      title: "",
      targetType: "all products",
      discountType: "percentage",
      discountValue: "",
    };
  }

  // Load existing offer and transform from nested schema to flat form structure
  const offer = await getOfferById(shop, params.id);

  if (!offer) {
    throw new Response("Offer not found", { status: 404 });
  }

  // Transform nested MongoDB structure to flat form structure
  const formData = {
    _id: offer._id,
    title: offer.title,
    status: offer.status,
    targetType:
      offer.target.targetType === "all"
        ? "all products"
        : offer.target.targetType === "product"
          ? "specific product"
          : "collection",
    discountType: offer.discount.type,
    discountValue: offer.discount.value.toString(),
  };

  // Add product info if specific product selected
  if (
    offer.target.targetType === "product" &&
    offer.target.products?.length > 0
  ) {
    const product = offer.target.products[0];
    formData.productId = product.productId;
    formData.productTitle = product.title;
    formData.productHandle = product.handle;
    formData.productImage = product.image;
    formData.productVariantId = product.variantId;
  }

  return formData;
}

/**
 * Transforms flat form data into nested MongoDB schema structure
 */
function transformFormDataToOffer(formData, shop, offerId) {
  // Determine target type based on targetType field
  const targetType =
    formData.targetType === "all products"
      ? "all"
      : formData.targetType === "specific product"
        ? "product"
        : "collection";

  // Build products array for specific product selection
  const products = [];
  if (targetType === "product" && formData.productId) {
    products.push({
      productId: formData.productId,
      title: formData.productTitle || "",
      handle: formData.productHandle || "",
      image: formData.productImage || "",
      variantId: formData.productVariantId || "",
    });
  }

  // Build the offer document
  return {
    // Generate unique ID for new offers, keep existing ID for updates
    _id: offerId !== "new" ? offerId : generateOfferId(),
    shop: shop,
    title: formData.title || "Untitled Offer",
    status: formData.status || "active",

    target: {
      targetType: targetType,
      products: products,
      collections: [], // Empty for now, will be used in future
    },

    discount: {
      type: formData.discountType || "percentage",
      value: parseFloat(formData.discountValue) || 0,
    },

    shopify: {
      metafieldNamespace: "discount_app",
      metafieldKey: "offer",
      metafieldsApplied: false,
    },
  };
}

export async function action({ request, params }) {
  const { session, redirect } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Handle delete action
  if (rawData.action === "delete") {
    await deleteOffer(shop, params.id);
    return redirect("/app");
  }

  // Transform flat form data to nested schema structure
  const transformedData = transformFormDataToOffer(rawData, shop, params.id);

  // Create or update offer
  if (params.id === "new") {
    const newOffer = await createOffer(transformedData);
    // Redirect to the newly created offer's edit page
    return redirect(`/app/offers/${newOffer._id}`);
  } else {
    await updateOffer(shop, params.id, transformedData);
    // Return success response - page will reload with updated data
    return Response.json({ success: true, offerId: params.id });
  }
}

export default function DiscountForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const offer = useLoaderData();
  const actionData = useActionData();
  const [initialFormState, setInitialFormState] = useState(offer);
  const [formState, setFormState] = useState(offer);
  const [previousFormState, setPreviousFormState] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const errors = actionData?.errors || {};
  const isSaving = useNavigation().state === "submitting";
  const isDirty =
    JSON.stringify(formState) !== JSON.stringify(initialFormState);

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
      // multiple: true,  // ← This allows selecting multiple at once
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productPrice: variants[0].price,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  function removeProduct() {
    setFormState({
      title: formState.title,
      targetType: formState.targetType,
      discountType: formState.discountType,
      discountValue: formState.discountValue,
    });
  }

  const productUrl = formState.productId
    ? `shopify://admin/products/${formState.productId.split("/").at(-1)}`
    : "";

  const submit = useSubmit();

  /**
   * Validates form data before submission
   * @returns {Object} Object with isValid boolean and errors object
   */
  function validateForm() {
    const errors = {};

    // Validate title
    if (!formState.title?.trim()) {
      errors.title = "Title is required";
    }

    // Validate product selection for specific products
    if (formState.targetType === "specific product" && !formState.productId) {
      errors.product = "Please select a product";
    }

    // Validate discount value
    if (!formState.discountValue || parseFloat(formState.discountValue) <= 0) {
      errors.discountValue = "Please enter a valid discount value";
    }

    // Validate percentage doesn't exceed 100%
    if (
      formState.discountType === "percentage" &&
      parseFloat(formState.discountValue) > 100
    ) {
      errors.discountValue = "Percentage cannot exceed 100%";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  function handleSave() {
    // Validate form
    const validation = validateForm();

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setHasValidationErrors(true);
      return;
    }

    // Clear any previous errors
    setValidationErrors({});
    setHasValidationErrors(false);

    // Save current state for potential rollback on error
    setPreviousFormState(initialFormState);

    // Optimistically update the initial state to remove dirty flag
    // This gives instant visual feedback that the save is in progress
    setInitialFormState(formState);

    // Submit entire formState
    submit(formState, { method: "post" });
  }

  function handleDelete() {
    submit({ action: "delete" }, { method: "post" });
  }

  function handleReset() {
    setFormState(initialFormState);
    window.shopify.saveBar.hide("discount-form");
  }

  useEffect(() => {
    // Don't show/hide save bar if there are validation errors
    if (hasValidationErrors) {
      return;
    }

    if (isDirty) {
      window.shopify.saveBar.show("discount-form");
    } else {
      window.shopify.saveBar.hide("discount-form");
    }
    return () => {
      window.shopify.saveBar.hide("discount-form");
    };
  }, [isDirty, hasValidationErrors]);

  useEffect(() => {
    setInitialFormState(offer);
    setFormState(offer);
  }, [id, offer]);

  // Handle success/error feedback after action completes
  useEffect(() => {
    if (actionData?.success) {
      // Show success toast for updates
      window.shopify.toast.show("Offer saved", { duration: 3000 });
      // Clear the rollback state
      setPreviousFormState(null);
    } else if (actionData?.success === false) {
      // Show error toast
      window.shopify.toast.show("Failed to save offer. Please try again.", {
        duration: 5000,
        isError: true,
      });

      // Rollback optimistic update on error
      if (previousFormState) {
        setInitialFormState(previousFormState);
        setPreviousFormState(null);
        // Show save bar again since changes weren't saved
        window.shopify.saveBar.show("discount-form");
      }
    }
  }, [actionData, previousFormState]);

  // Show success toast when new offer is created (after redirect)
  useEffect(() => {
    // Check if this is a newly created offer (URL changed from /new to /:id)
    if (id !== "new" && !initialFormState._id && offer._id) {
      window.shopify.toast.show("Offer created", { duration: 3000 });
    }
  }, [id, offer._id, initialFormState._id]);

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  return (
    <>
      <form
        data-save-bar
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onReset={handleReset}
      >
        <s-page heading={initialFormState.title || "Create Deal"}>
          <s-link
            href="/app"
            slot="breadcrumb-actions"
            onClick={(e) => (isDirty ? e.preventDefault() : navigate("/app/"))}
          >
            Dashboard
          </s-link>
          {initialFormState._id && (
            <s-button
              slot="secondary-actions"
              onClick={handleDelete}
              disabled={isSaving}
            >
              Delete
            </s-button>
          )}
          <s-section heading="Deal information">
            <s-stack gap="base">
              <s-text-field
                label="Title"
                error={validationErrors.title || errors.title}
                autoComplete="off"
                name="title"
                placeholder="Name your deal"
                value={formState.title}
                disabled={isSaving}
                onInput={(e) =>
                  setFormState({ ...formState, title: e.target.value })
                }
              ></s-text-field>
              <s-stack gap="500" align="space-between" blockAlign="start">
                <s-select
                  name="Apply offer on"
                  label="Apply offer on"
                  value={formState.targetType}
                  disabled={isSaving}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      targetType: e.target.value,
                    })
                  }
                >
                  <s-option
                    value="all products"
                    selected={formState.targetType === "all products"}
                  >
                    All Products
                  </s-option>
                  <s-option
                    value="specific product"
                    selected={formState.targetType === "specific product"}
                  >
                    Specific Product
                  </s-option>
                </s-select>
              </s-stack>

              {/* Product selection section */}

              {formState.targetType === "specific product" && (
                <s-stack gap="small-400">
                  <s-stack
                    direction="inline"
                    gap="small-100"
                    justifyContent="space-between"
                  >
                    <s-text color="subdued">Select Product</s-text>
                    {validationErrors.product && (
                      <s-text tone="critical">
                        {validationErrors.product}
                      </s-text>
                    )}
                    {formState.productId ? (
                      <s-link
                        onClick={removeProduct}
                        accessibilityLabel="Remove the product"
                        variant="tertiary"
                        tone="neutral"
                      >
                        Clear
                      </s-link>
                    ) : null}
                  </s-stack>
                  {formState.productId ? (
                    <s-stack
                      direction="inline"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <s-stack
                        direction="inline"
                        gap="small-100"
                        alignItems="center"
                      >
                        <s-clickable
                          href={productUrl}
                          target="_blank"
                          accessibilityLabel={`Go to the product page for ${formState.productTitle}`}
                          borderRadius="base"
                        >
                          <s-box
                            padding="small-200"
                            border="base"
                            borderRadius="base"
                            background="subdued"
                            inlineSize="38px"
                            blockSize="38px"
                          >
                            {formState.productImage ? (
                              <s-image src={formState.productImage}></s-image>
                            ) : (
                              <s-icon size="large" type="product" />
                            )}
                          </s-box>
                        </s-clickable>
                        <s-link href={productUrl} target="_blank">
                          {formState.productTitle}
                        </s-link>
                      </s-stack>
                      <s-stack direction="inline" gap="small">
                        <s-button
                          onClick={selectProduct}
                          accessibilityLabel="Change the product"
                          disabled={isSaving}
                        >
                          Change
                        </s-button>
                      </s-stack>
                    </s-stack>
                  ) : (
                    <s-button
                      onClick={selectProduct}
                      accessibilityLabel="Select the product"
                      disabled={isSaving}
                    >
                      Select product
                    </s-button>
                  )}
                </s-stack>
              )}

              {/* discount configuration section */}
              <s-grid gap="base">
                <s-select
                  name="discountType"
                  label="Select discount type"
                  value={formState.discountType}
                  disabled={isSaving}
                  onChange={(e) =>
                    setFormState({ ...formState, discountType: e.target.value })
                  }
                >
                  <s-option
                    value="percentage"
                    selected={formState.discountType === "percentage"}
                  >
                    Percentage
                  </s-option>

                  <s-option
                    value="fixed"
                    selected={formState.discountType === "fixed"}
                  >
                    Fixed Amount
                  </s-option>
                </s-select>

                <s-text-field
                  label={
                    formState.discountType === "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount"
                  }
                  name="discountValue"
                  type="number"
                  min="0"
                  max={
                    formState.discountType === "percentage" ? "100" : undefined
                  }
                  step={formState.discountType === "percentage" ? "1" : "0.01"}
                  placeholder={
                    formState.discountType === "percentage"
                      ? "Enter value (1-100)"
                      : "Enter discount amount"
                  }
                  suffix={
                    formState.discountType === "percentage" ? "%" : undefined
                  }
                  error={validationErrors.discountValue}
                  value={formState.discountValue}
                  disabled={isSaving}
                  onInput={(e) => {
                    const newValue = e.target.value;
                    setFormState({
                      ...formState,
                      discountValue: newValue,
                    });

                    // Skip validation if empty (user is still typing)
                    if (newValue === "") {
                      // eslint-disable-next-line no-unused-vars
                      const { discountValue, ...otherErrors } =
                        validationErrors;
                      setValidationErrors(otherErrors);
                      return;
                    }

                    // Check if input contains non-numeric characters (except decimal point)
                    const hasLetters = /[a-zA-Z]/.test(newValue);
                    const isValidNumber = /^\d+(\.\d*)?$/.test(newValue);

                    if (hasLetters) {
                      setValidationErrors({
                        ...validationErrors,
                        discountValue: "Please enter numbers only",
                      });
                      return;
                    }

                    if (!isValidNumber) {
                      setValidationErrors({
                        ...validationErrors,
                        discountValue: "Please enter a valid number",
                      });
                      return;
                    }

                    // Validate based on discount type
                    const numValue = parseFloat(newValue);

                    if (numValue <= 0) {
                      setValidationErrors({
                        ...validationErrors,
                        discountValue: "Value must be greater than 0",
                      });
                      return;
                    }

                    // Percentage-specific validation
                    if (formState.discountType === "percentage" && numValue > 100) {
                      setValidationErrors({
                        ...validationErrors,
                        discountValue: "Percentage cannot exceed 100%",
                      });
                      return;
                    }

                    // Clear error if all validations pass
                    // eslint-disable-next-line no-unused-vars
                    const { discountValue, ...otherErrors } = validationErrors;
                    setValidationErrors(otherErrors);
                  }}
                ></s-text-field>
              </s-grid>
            </s-stack>
          </s-section>

          {/* Preview sections code */}
          <s-box slot="aside">
            <s-section heading="Preview">
              <s-stack gap="base">
                <s-box
                  padding="base"
                  border="none"
                  borderRadius="base"
                  background="subdued"
                >
                  {initialFormState.image ? (
                    <s-image
                      aspectRatio="1/0.8"
                      src={initialFormState.image}
                      alt="The QR Code for the current form"
                    />
                  ) : (
                    <s-stack
                      direction="inline"
                      alignItems="center"
                      justifyContent="center"
                      blockSize="198px"
                    >
                      <s-text color="subdued">
                        See a preview once you save
                      </s-text>
                    </s-stack>
                  )}
                </s-box>
                <s-stack
                  gap="small"
                  direction="inline"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <s-button
                    disabled={!initialFormState.id}
                    href={`/qrcodes/${initialFormState.id}`}
                    target="_blank"
                  >
                    Go to public URL
                  </s-button>
                  <s-button
                    disabled={!initialFormState?.image}
                    href={initialFormState?.image}
                    download
                    variant="primary"
                  >
                    Download
                  </s-button>
                </s-stack>
              </s-stack>
            </s-section>
          </s-box>
        </s-page>
      </form>
    </>
  );
}

// export const headers = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };
