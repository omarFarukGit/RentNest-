// src/lib/stripe.ts
import Stripe from "stripe";
import { prisma } from "./prisma";
import config from "../config";

// =============================================
// ✅ Stripe Instance
// =============================================
export const stripe = new Stripe(config.stripe_secret_key!);

// =============================================
// ✅ Helper Functions
// =============================================
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const fromCents = (amount: number): number => {
  return amount / 100;
};

export const formatCurrency = (
  amount: number,
  currency: string = "usd",
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const getClientUrl = (): string => {
  return config.client_url || "http://localhost:3000";
};

// =============================================
// ✅ Stripe Services
// =============================================
export const stripeServices = {
  // =============================================
  // 1. Create Checkout Session
  // =============================================
  createCheckoutSession: async (
    paymentId: string,
    amount: number,
    metadata: {
      rentalRequestId: string;
      tenantId: string;
      propertyId: string;
      propertyTitle: string;
      description?: string;
      customerEmail?: string;
    },
  ) => {
    const {
      rentalRequestId,
      tenantId,
      propertyId,
      propertyTitle,
      description,
      customerEmail,
    } = metadata;

    const clientUrl = getClientUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: propertyTitle || "Rent Payment",
              description:
                description ||
                `Rent payment for ${propertyTitle || "Property"}`,
            },
            unit_amount: toCents(amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        paymentId,
        rentalRequestId,
        tenantId,
        propertyId,
        propertyTitle: propertyTitle || "Property",
      },
      customer_email: customerEmail || undefined,
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "BD", "IN", "SG", "AE"],
      },
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      publishableKey: config.stripe_publishable_key,
      session,
    };
  },

  // =============================================
  // 2. Retrieve Session
  // =============================================
  retrieveSession: async (sessionId: string) => {
    return await stripe.checkout.sessions.retrieve(sessionId);
  },

  // =============================================
  // 3. Retrieve Payment Intent
  // =============================================
  retrievePaymentIntent: async (paymentIntentId: string) => {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  },

  // =============================================
  // 4. Create Refund
  // =============================================
  createRefund: async (
    paymentIntentId: string,
    amount?: number,
    reason?: "duplicate" | "fraudulent" | "requested_by_customer",
  ) => {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? toCents(amount) : undefined,
      reason: reason || "requested_by_customer",
    });
  },

  // =============================================
  // 5. ✅ Construct Webhook Event (FIXED)
  // =============================================
  constructWebhookEvent: (payload: Buffer, signature: string) => {
    const webhookSecret = config.stripe_webhook_secret;

    // ✅ Check if webhook secret exists
    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET is not set!");
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is not configured. Please add it to .env file.",
      );
    }

    console.log("🔍 Constructing Webhook Event");
    console.log("  Payload Length:", payload.length);
    console.log("  Signature:", signature.substring(0, 50) + "...");
    console.log("  Webhook Secret:", webhookSecret.substring(0, 10) + "...");

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      console.log("✅ Webhook constructed successfully:", event.type);
      return event;
    } catch (error: any) {
      console.error("❌ Webhook construction failed:", error.message);
      throw error;
    }
  },

  // =============================================
  // 6. Handle Webhook Event
  // =============================================
  handleWebhookEvent: async (event: Stripe.Event) => {
    console.log("🔔 Handling Webhook Event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return await handleCheckoutSessionCompleted(session);
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        return await handleCheckoutSessionExpired(session);
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return await handlePaymentIntentSucceeded(paymentIntent);
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return await handlePaymentIntentFailed(paymentIntent);
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return { received: true };
    }
  },

  // =============================================
  // 7. Payment Success Handler
  // =============================================
  handlePaymentSuccess: async (sessionId: string) => {
    console.log("✅ Processing Payment Success:", sessionId);

    // ===== Get Session from Stripe =====
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // ===== Get Payment from Database =====
    let payment = await prisma.payment.findFirst({
      where: {
        transactionId: sessionId,
      },
      include: {
        rental_request: {
          include: {
            property: true,
            tenant: true,
            landlord: true,
          },
        },
      },
    });

    if (!payment) {
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: {
            rental_request: {
              include: {
                property: true,
                tenant: true,
                landlord: true,
              },
            },
          },
        });
      }
    }

    if (!payment) {
      throw new Error("Payment not found in database");
    }

    // ===== Update Payment =====
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        transactionId: sessionId,
        paymentDetails: {
          ...(payment.paymentDetails as any),
          stripeSessionId: sessionId,
          paymentIntentId: session.payment_intent,
          sessionStatus: session.status,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
          customerDetails: session.customer_details,
          paidAt: new Date().toISOString(),
          status: "PAID",
        },
      },
      include: {
        rental_request: {
          include: {
            property: true,
            tenant: true,
            landlord: true,
          },
        },
      },
    });

    console.log("✅ Payment updated in database:", updatedPayment.id);

    // ===== Update Rental Request =====
    await prisma.rentalRequest.update({
      where: { id: payment.rentalRequestId },
      data: { status: "APPROVED" },
    });

    // ===== Update Property Availability =====
    await prisma.property.update({
      where: { id: payment.rental_request.propertyId },
      data: { availability: "RENTED" },
    });

    return {
      success: true,
      message: "Payment completed successfully",
      payment: updatedPayment,
    };
  },
};

// =============================================
// Webhook Handlers
// =============================================

const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  console.log("✅ Checkout Session Completed:", session.id);
  return await stripeServices.handlePaymentSuccess(session.id);
};

const handleCheckoutSessionExpired = async (
  session: Stripe.Checkout.Session,
) => {
  console.log("⏰ Checkout Session Expired:", session.id);

  const paymentId = session.metadata?.paymentId;
  if (!paymentId) {
    throw new Error("Payment ID not found");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "FAILED",
      paymentDetails: {
        stripeSessionId: session.id,
        expiredAt: new Date().toISOString(),
        status: "FAILED",
        errorMessage: "Checkout session expired",
      },
    },
  });

  return {
    success: false,
    message: "Payment session expired",
    payment: updatedPayment,
  };
};

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  console.log("✅ Payment Intent Succeeded:", paymentIntent.id);
  return { received: true };
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  console.log("❌ Payment Intent Failed:", paymentIntent.id);
  console.log("  Error:", paymentIntent.last_payment_error?.message);
  return { received: true };
};

// =============================================
// ✅ Export Default
// =============================================
export default {
  stripe,
  stripeServices,
  toCents,
  fromCents,
  formatCurrency,
  getClientUrl,
};
