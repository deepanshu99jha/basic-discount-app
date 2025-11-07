// app/shopify.server.js
import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { upsertShopFromOAuth } from "./models/shop.server";

const mongoUrl = process.env.MONGO_URI;
const mongoDbName = process.env.MONGO_DB_NAME || "discount_app";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  appUrl: process.env.SHOPIFY_APP_URL || "", // or leave blank, CLI can handle dev
  scopes: process.env.SCOPES?.split(","),
  authPathPrefix: "/auth",
  embedded: true,
  distribution: AppDistribution.AppStore,

  // ✅ Shopify sessions in Mongo
  sessionStorage: new MongoDBSessionStorage(mongoUrl, mongoDbName),

  // ✅ This runs AFTER OAuth completion (install / re-auth)
  hooks: {
    afterAuth: async ({ session, admin }) => {
      const shop = session.shop; // e.g. "cool-store.myshopify.com"
      const accessToken = session.accessToken; // offline token
      const scopes = session.scope?.split(",") ?? [];

      console.log("[afterAuth] OAuth completed for", shop);

      // 1) Fetch extra shop info from Shopify
      let shopInfo = null;
      try {
        const response = await admin.graphql(`
          #graphql
          query ShopInfo {
            shop {
              id
              name
              myshopifyDomain
              primaryDomain { url }
              contactEmail
              email
              currencyCode
              plan { displayName partnerDevelopment shopifyPlus }
            }
          }
        `);

        const result = await response.json();
        shopInfo = result?.data?.shop || null;
      } catch (error) {
        console.error(
          "❌ [SHOP ERROR] Failed to fetch shop info:",
          error.message,
        );
      }

      // 2) Upsert in Mongo
      try {
        await upsertShopFromOAuth({
          shop,
          accessToken,
          scopes,
          shopInfo,
        });
        console.log("✅ [SHOP SAVED] Shop saved to MongoDB:", shop);
      } catch (error) {
        console.error("❌ [SHOP ERROR] Failed to save shop:", error.message);
      }

      // 3) (Optional) Register webhooks, billing, etc. here later
      // await shopify.registerWebhooks({ session });
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const registerWebhooks = shopify.registerWebhooks;
