// stripe.service.ts
import Stripe from "stripe";
import { prisma } from "./prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// =============================================
// 1. পেমেন্ট ইনটেন্ট তৈরি
// =============================================
const createPaymentIntent = async (paymentId: string) => {
  // ===== পেমেন্ট ডেটা আনা =====
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      rental_request: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // ===== Stripe Payment Intent তৈরি =====
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(payment.amount) * 100), // সেন্টে কনভার্ট
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      paymentId: payment.id,
      rentalRequestId: payment.rentalRequestId,
      propertyTitle: payment.rental_request?.property?.title || "Property",
    },
    description: `Rent payment for ${payment.rental_request?.property?.title || "Property"}`,
    receipt_email: payment.rental_request?.tenant?.email || undefined,
  });

  // ===== পেমেন্ট আপডেট (Stripe ID সংরক্ষণ) =====
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      transactionId: paymentIntent.id,
      paymentDetails: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    payment: updatedPayment,
  };
};

// =============================================
// 2. পেমেন্ট সফল (Webhook থেকে)
// =============================================
const handlePaymentSuccess = async (paymentIntentId: string) => {
  // ===== পেমেন্ট খুঁজুন =====
  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: paymentIntentId,
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
    throw new Error("Payment not found");
  }

  // ===== পেমেন্ট স্ট্যাটাস আপডেট =====
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      paymentDetails: {
        ...(payment.paymentDetails as any),
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

  // ===== রেন্টাল রিকোয়েস্ট স্ট্যাটাস আপডেট =====
  await prisma.rentalRequest.update({
    where: { id: payment.rentalRequestId },
    data: {
      status: "APPROVED",
    },
  });

  // ===== প্রপার্টি এভেইলেবিলিটি আপডেট =====
  await prisma.property.update({
    where: { id: updatedPayment.rental_request.propertyId },
    data: {
      availability: "RENTED",
    },
  });

  return updatedPayment;
};

// =============================================
// 3. পেমেন্ট ফেল (Webhook থেকে)
// =============================================
const handlePaymentFailure = async (
  paymentIntentId: string,
  errorMessage?: string,
) => {
  // ===== পেমেন্ট খুঁজুন =====
  const payment = await prisma.payment.findFirst({
    where: {
      transactionId: paymentIntentId,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // ===== পেমেন্ট স্ট্যাটাস আপডেট =====
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      paymentDetails: {
        ...(payment.paymentDetails as any),
        failedAt: new Date().toISOString(),
        errorMessage: errorMessage || "Payment failed",
        status: "FAILED",
      },
    },
  });

  return updatedPayment;
};

// =============================================
// 4. রিফান্ড তৈরি
// =============================================
const createRefund = async (paymentId: string, amount?: number) => {
  // ===== পেমেন্ট ডেটা আনা =====
  const payment = await prisma.payment.findUnique({
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

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "PAID") {
    throw new Error("Only paid payments can be refunded");
  }

  // ===== Stripe রিফান্ড তৈরি =====
  const refund = await stripe.refunds.create({
    payment_intent: payment.transactionId,
    amount: amount ? Math.round(amount * 100) : undefined,
    metadata: {
      paymentId: payment.id,
      rentalRequestId: payment.rentalRequestId,
    },
  });

  // ===== পেমেন্ট আপডেট =====
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REFUNDED",
      paymentDetails: {
        ...(payment.paymentDetails as any),
        refundId: refund.id,
        refundAmount: amount || payment.amount,
        refundedAt: new Date().toISOString(),
        status: "REFUNDED",
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

  // ===== প্রপার্টি এভেইলেবিলিটি আপডেট =====
  await prisma.property.update({
    where: { id: payment.rental_request.propertyId },
    data: {
      availability: "AVAILABLE",
    },
  });

  return {
    message: "Refund processed successfully",
    refund,
    payment: updatedPayment,
  };
};

// =============================================
// 5. ওয়েবহুক ইভেন্ট হ্যান্ডেল
// =============================================
const handleWebhookEvent = async (event: Stripe.Event) => {
  console.log("🔔 Stripe Webhook Event:", event.type);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent.id);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const errorMessage = paymentIntent.last_payment_error?.message;
      await handlePaymentFailure(paymentIntent.id, errorMessage);
      break;
    }

    case "payment_intent.canceled": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent.id, "Payment cancelled by user");
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      console.log("Refund processed:", charge.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

export const stripeServices = {
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
  createRefund,
  handleWebhookEvent,
};
