// app/models/offer.server.js
import mongoose, { Schema } from "mongoose";
import { connectMongo } from "../db/mongo.server";

/**
 * Generates a unique offer ID with timestamp and random string
 * Format: off_1734567890123_a8f3kl
 * @returns {string} Unique offer ID
 */
export function generateOfferId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `off_${timestamp}_${random}`;
}

const OfferSchema = new Schema(
  {
    _id: { type: String, required: true }, // "off_1234567890"
    shop: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
      index: true,
    },

    // === TARGET (What products/collections get the discount) ===
    target: {
      targetType: {
        type: String,
        enum: ["all", "product", "collection"],
        required: true,
      },

      // FOR SPECIFIC PRODUCTS - Array of product objects with full details
      products: [
        {
          productId: { type: String }, // "gid://shopify/Product/123"
          title: { type: String }, // "Cool T-Shirt"
          handle: { type: String }, // "cool-t-shirt"
          image: { type: String }, // "https://cdn.shopify.com/..."
          variantId: { type: String }, // "gid://shopify/ProductVariant/456"
        },
      ],

      // FOR COLLECTIONS (future use)
      collections: [
        {
          collectionId: { type: String }, // "gid://shopify/Collection/789"
          title: { type: String }, // "Summer Collection"
          handle: { type: String }, // "summer-collection"
        },
      ],
    },

    // === DISCOUNT ===
    discount: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
      },
      value: { type: Number, required: true, min: 0 },
    },

    // === SHOPIFY INTEGRATION (for metafields) ===
    shopify: {
      metafieldNamespace: { type: String, default: "discount_app" },
      metafieldKey: { type: String, default: "offer" },
      metafieldsApplied: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

let OfferModel;
try {
  OfferModel = mongoose.model("Offer");
} catch {
  OfferModel = mongoose.model("Offer", OfferSchema);
}

export async function createOffer(doc) {
  await connectMongo();
  return OfferModel.create(doc);
}

export async function getOffersByShop(shop) {
  await connectMongo();
  return OfferModel.find({ shop }).lean();
}

export async function getOfferById(shop, id) {
  await connectMongo();
  return OfferModel.findOne({ shop, _id: id }).lean();
}

export async function updateOffer(shop, id, data) {
  await connectMongo();
  return OfferModel.findOneAndUpdate(
    { shop, _id: id },
    { $set: data },
    { new: true }
  );
}

export async function deleteOffer(shop, id) {
  await connectMongo();
  return OfferModel.findOneAndDelete({ shop, _id: id });
}
