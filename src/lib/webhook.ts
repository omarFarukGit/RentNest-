// src/modules/webhook/webhook.routes.ts
import express from "express";
import { stripe, stripeServices } from "./stripe.js";
import config from "../config/index.js";


const router = express.Router();

// =============================================
// ✅ Stripe Webhook (Raw Body Required)
// =============================================
router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = config.stripe_webhook_secret!;

    console.log("🔔 Webhook Received");
    console.log("📝 Signature:", sig);
    console.log("📦 Body Length:", req.body.length);

    try {
      // ===== Verify Webhook =====
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret,
      );

      console.log("✅ Webhook verified:", event.type);
      console.log("📦 Event ID:", event.id);

      // ===== Handle Event =====
      const result = await stripeServices.handleWebhookEvent(event);

      res.status(200).json({
        received: true,
        eventType: event.type,
        result,
      });
    } catch (error: any) {
      console.error("❌ Webhook Error:", error.message);
      res.status(400).json({
        error: error.message,
        received: false,
      });
    }
  },
);

export const webhookRoutes = router;
