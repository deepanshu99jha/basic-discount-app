// app/models/offer.server.js
import mongoose, { Schema } from "mongoose";
import { connectMongo } from "../db/mongo.server";

const OfferSchema = new Schema(
  {
    _id: { type: String, required: true }, // "off_abc123"
    shop: { type: String, required: true, index: true },

    title: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
      index: true,
    },

    target: {
      targetType: {
        type: String,
        enum: ["product", "collection", "all"],
        required: true,
      },
      productIds: [{ type: String }],
      collectionIds: [{ type: String }],
      appliesToAllProducts: { type: Boolean, default: false },
    },

    discount: {
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      value: { type: Number, required: true },
      currency: { type: String }, // needed if fixed
    },

    shopify: {
      discountId: { type: String },
      metafieldNamespace: { type: String, default: "discount_app" },
      metafieldKey: { type: String, default: "offer" },
    },

    widget: {
      showOnProductPage: { type: Boolean, default: true },
      position: { type: String, default: "above_add_to_cart" },
      customText: { type: String },
    },

    schedule: {
      hasSchedule: { type: Boolean, default: false },
      startsAt: { type: Date },
      endsAt: { type: Date },
    },

    analytics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
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
  return OfferModel.deleteOne({ shop, _id: id });
}
