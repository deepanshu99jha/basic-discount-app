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
    },

    extension: {
      activated: { type: Boolean, default: false },
    },

    offers: [{ type: String }], // list of offer IDs like "off_abc123"

    offerStats: {
      totalOffers: { type: Number, default: 0 },
      activeOffers: { type: Number, default: 0 },
    },

    // Extra info you asked for
    shopUserName: { type: String },      // e.g. “John Doe”
    supportEmail: { type: String },   // support/primary email
  },
  { timestamps: true }
);

let ShopModel;
try {
  ShopModel = mongoose.model("Shop");
} catch {
  ShopModel = mongoose.model("Shop", ShopSchema);
}

export async function upsertShopFromSessionAndInfo({
  shop,
  accessToken,
  scopes,
  shopUserName,
  supportEmail,
}) {
  await connectMongo();

  const update = {
    accessToken,
    scopes,
    installedStatus: "installed",
    status: "active",
  };

  if (shopUserName !== undefined) update.shopUserName = shopUserName;
  if (supportEmail !== undefined) update.supportEmail = supportEmail;

  return ShopModel.findOneAndUpdate(
    { shop },
    { $set: update, $setOnInsert: { offers: [], offerStats: { totalOffers: 0, activeOffers: 0 } } },
    { upsert: true, new: true }
  );
}

export async function getShopByDomain(shop) {
  await connectMongo();
  return ShopModel.findOne({ shop }).lean();
}
