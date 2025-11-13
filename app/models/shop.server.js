// app/models/shop.server.js
import mongoose, { Schema } from "mongoose";
import { connectMongo } from "../db/mongo.server";

const ShopSchema = new Schema(
  {
    shop: { type: String, required: true, unique: true }, // "cool-store.myshopify.com"
    accessToken: { type: String }, // online/offline token (usually offline for public apps)
    scopes: [{ type: String }],

    installedStatus: {
      type: String,
      enum: ["installed", "uninstalled"],
      default: "installed",
    },

    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },

    // Basic billing info – we can expand later
    plan: {
      name: { type: String, default: "free" },
      billingStatus: { type: String, default: "not_billed" },
      trialEndsAt: { type: Date },
    },

    settings: {
      defaultDiscountType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      defaultWidgetEnabled: { type: Boolean, default: true },
      currency: { type: String, default: "USD" },
    },

    extension_activated: { type: Boolean, default: false },

    offers: [{ type: String }], // list of offer IDs like "off_abc123"

    offerStats: {
      totalOffers: { type: Number, default: 0 },
      activeOffers: { type: Number, default: 0 },
    },

    // Extra info you asked for
    shopUserName: { type: String }, // e.g. “John Doe”
    supportEmail: { type: String }, // support/primary email
  },
  { timestamps: true },
);

let ShopModel;
try {
  ShopModel = mongoose.model("Shop");
} catch {
  ShopModel = mongoose.model("Shop", ShopSchema);
}

export async function upsertShopFromOAuth({
  shop,
  accessToken,
  scopes,
  shopInfo,
}) {
  await connectMongo();

  const update = {
    accessToken,
    scopes,
    installedStatus: "installed",
    status: "active",
  };

  // Extract data from shopInfo if provided
  if (shopInfo) {
    if (shopInfo.name) update.shopUserName = shopInfo.name;
    if (shopInfo.email || shopInfo.supportEmail || shopInfo.contactEmail) {
      update.supportEmail =
        shopInfo.supportEmail || shopInfo.contactEmail || shopInfo.email;
    }
    if (shopInfo.currencyCode) {
      update["settings.currency"] = shopInfo.currencyCode;
    }
  }

  const result = await ShopModel.findOneAndUpdate(
    { shop },
    {
      $set: update,
      $setOnInsert: {
        offers: [],
        offerStats: { totalOffers: 0, activeOffers: 0 },
      },
    },
    { upsert: true, new: true },
  );

  return result;
}

export async function getShopByDomain(shop) {
  await connectMongo();
  return ShopModel.findOne({ shop }).lean();
}

/**
 * Get shop owner name for greeting
 * @param {string} shop - Shop domain (e.g., "store.myshopify.com")
 * @returns {Promise<string>} Shop owner name or default
 */
export async function getShopOwnerName(shop) {
  await connectMongo();
  const shopData = await ShopModel.findOne({ shop }, "shopUserName").lean();
  return shopData?.shopUserName || "Store Owner";
}

/**
 * Add offer ID to shop's offers array and update stats
 * @param {string} shop - Shop domain
 * @param {string} offerId - Offer ID to add
 * @param {string} status - Offer status (active/paused)
 */
export async function addOfferToShop(shop, offerId, status = "active") {
  await connectMongo();

  const update = {
    $addToSet: { offers: offerId }, // Add to array if not exists
    $inc: {
      "offerStats.totalOffers": 1,
      ...(status === "active" && { "offerStats.activeOffers": 1 }),
    },
  };

  return ShopModel.findOneAndUpdate({ shop }, update, { new: true });
}
