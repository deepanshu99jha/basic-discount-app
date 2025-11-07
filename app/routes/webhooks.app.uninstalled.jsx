import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../models/shop.server";
import mongoose from "mongoose";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Mark shop as uninstalled in MongoDB
  if (shop) {
    try {
      const ShopModel = mongoose.model("Shop");
      await ShopModel.findOneAndUpdate(
        { shop },
        {
          $set: {
            installedStatus: "uninstalled",
            status: "paused"
          }
        }
      );
      console.log(`Marked shop ${shop} as uninstalled`);
    } catch (error) {
      console.error("Error updating shop status:", error);
    }
  }

  return new Response();
};
