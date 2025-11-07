import { authenticate } from "../shopify.server";
import mongoose from "mongoose";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;

  // Update scopes in shop document
  if (shop && current) {
    try {
      const ShopModel = mongoose.model("Shop");
      const newScopes = Array.isArray(current) ? current : current.toString().split(",");

      await ShopModel.findOneAndUpdate(
        { shop },
        { $set: { scopes: newScopes } }
      );
      console.log(`Updated scopes for shop ${shop}`);
    } catch (error) {
      console.error("Error updating shop scopes:", error);
    }
  }

  return new Response();
};
