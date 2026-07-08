// src/modules/payment/payment.service.ts
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../lib/stripe.js";
// =============================================
// Helper: Decimal to Number
// =============================================
const toNumber = (value) => {
    return Number(value) || 0;
};
// =============================================
// 1. পেমেন্ট তৈরি (Stripe Checkout Session)
// =============================================
const createPayment = async (tenantId, payload) => {
    if (!payload) {
        throw new Error("Request body is required");
    }
    const { rentalRequestId, amount, provider = "STRIPE" } = payload;
    if (!tenantId) {
        throw new Error("User ID is required");
    }
    if (!rentalRequestId) {
        throw new Error("Rental request ID is required");
    }
    if (!amount || amount <= 0) {
        throw new Error("Valid amount is required");
    }
    // ===== CLIENT_URL Check =====
    if (!process.env.CLIENT_URL) {
        process.env.CLIENT_URL = "http://localhost:3000";
    }
    // ===== Rental Request Check =====
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { id: rentalRequestId },
        include: {
            property: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    landlordId: true,
                    images: true,
                },
            },
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });
    if (!rentalRequest) {
        throw new Error(`Rental request not found`);
    }
    if (rentalRequest.tenantId !== tenantId) {
        throw new Error("You are not authorized to make payment for this rental");
    }
    if (rentalRequest.status !== "APPROVED") {
        throw new Error(`Payment can only be made for approved rentals`);
    }
    // ===== Check for existing payment =====
    const existingPayment = await prisma.payment.findFirst({
        where: {
            rentalRequestId,
        },
    });
    if (existingPayment) {
        if (existingPayment.status === "PAID") {
            throw new Error(`Payment already completed for this rental`);
        }
        if (existingPayment.status === "PENDING") {
            const paymentDetails = existingPayment.paymentDetails;
            return {
                message: "Payment already exists. Please complete the payment process.",
                payment: {
                    ...existingPayment,
                    amount: toNumber(existingPayment.amount),
                },
                stripe: {
                    checkoutUrl: paymentDetails?.stripeSessionUrl || null,
                    sessionId: paymentDetails?.stripeSessionId || existingPayment.transactionId,
                    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
                },
                isExisting: true,
            };
        }
    }
    // ===== Create Payment in Database (PENDING) =====
    const payment = await prisma.payment.create({
        data: {
            rentalRequestId,
            amount: parseFloat(amount),
            provider,
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            status: "PENDING",
            paymentDetails: {
                initiatedAt: new Date().toISOString(),
                tenantId,
                landlordId: rentalRequest.landlordId,
                propertyId: rentalRequest.propertyId,
                propertyTitle: rentalRequest.property?.title || "Property",
            },
        },
    });
    // ===== Create Stripe Checkout Session =====
    let stripeData = null;
    if (provider === "STRIPE") {
        try {
            const amountInNumber = toNumber(payment.amount);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `Rent Payment: ${rentalRequest.property?.title || "Property"}`,
                                description: `Payment for ${rentalRequest.property?.title || "Property"}`,
                            },
                            unit_amount: Math.round(amountInNumber * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${config.app_url}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
                metadata: {
                    paymentId: payment.id,
                    rentalRequestId: payment.rentalRequestId,
                    tenantId: tenantId,
                    propertyId: rentalRequest.propertyId,
                },
                customer_email: rentalRequest.tenant?.email || undefined,
            });
            // ✅ Update Payment with Stripe Session Info
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    transactionId: session.id,
                    paymentDetails: {
                        ...payment.paymentDetails,
                        stripeSessionId: session.id,
                        stripeSessionUrl: session.url,
                        amountInCents: Math.round(amountInNumber * 100),
                    },
                },
            });
            stripeData = {
                sessionId: session.id,
                checkoutUrl: session.url,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            };
        }
        catch (error) {
            console.error("Stripe Checkout Error:", error);
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "FAILED",
                    paymentDetails: {
                        ...payment.paymentDetails,
                        errorMessage: error.message,
                        status: "FAILED",
                    },
                },
            });
            throw new Error(`Failed to create Stripe checkout session: ${error.message}`);
        }
    }
    return {
        message: "Payment created successfully. Please complete the payment process.",
        payment: {
            ...payment,
            amount: toNumber(payment.amount),
        },
        stripe: stripeData,
        isExisting: false,
    };
};
// =============================================
// 2. ✅ Payment Success - Save Data to Database
// =============================================
const paymentSuccess = async (sessionId) => {
    if (!sessionId) {
        throw new Error("Session ID is required");
    }
    console.log("🔍 Payment Success - Session ID:", sessionId);
    // ===== 1. Get Session from Stripe =====
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
    }
    // ===== 2. Get Payment from Database =====
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
    // ===== 3. If payment not found, create new =====
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
    // ===== 4. Get Payment Intent Details =====
    let paymentIntentDetails = null;
    if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        paymentIntentDetails = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentMethod: paymentIntent.payment_method_types?.[0] || "card",
            paymentMethodId: paymentIntent.payment_method,
            customerId: paymentIntent.customer,
            receiptEmail: paymentIntent.receipt_email,
        };
    }
    // ===== 5. ✅ Save Payment Data to Database =====
    const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: "PAID",
            transactionId: sessionId,
            paymentDetails: {
                ...payment.paymentDetails,
                stripeSessionId: sessionId,
                paymentIntentId: session.payment_intent,
                sessionStatus: session.status,
                paymentStatus: session.payment_status,
                customerEmail: session.customer_email,
                customerDetails: session.customer_details,
                ...paymentIntentDetails,
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
    console.log("✅ Payment saved to database:", updatedPayment.id);
    // ===== 6. Update Rental Request Status =====
    await prisma.rentalRequest.update({
        where: { id: payment.rentalRequestId },
        data: { status: "APPROVED" },
    });
    // ===== 7. Update Property Availability =====
    await prisma.property.update({
        where: { id: payment.rental_request.propertyId },
        data: { availability: "RENTED" },
    });
    // ===== 8. Return Complete Payment Data =====
    return {
        success: true,
        message: "Payment completed successfully",
        data: {
            payment: {
                ...updatedPayment,
                amount: toNumber(updatedPayment.amount),
            },
            rentalRequest: updatedPayment.rental_request,
            property: updatedPayment.rental_request?.property,
            tenant: updatedPayment.rental_request?.tenant,
            landlord: updatedPayment.rental_request?.landlord,
            stripe: {
                sessionId: sessionId,
                paymentIntentId: session.payment_intent,
                paymentStatus: session.payment_status,
                paymentIntentDetails: paymentIntentDetails,
            },
        },
    };
};
// =============================================
// 3. Payment Cancel
// =============================================
const paymentCancel = async (sessionId) => {
    if (!sessionId) {
        throw new Error("Session ID is required");
    }
    console.log("🔍 Payment Cancel - Session ID:", sessionId);
    // ===== Get Payment =====
    const payment = await prisma.payment.findFirst({
        where: {
            transactionId: sessionId,
        },
    });
    if (payment && payment.status === "PENDING") {
        // ===== Update payment as cancelled =====
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "FAILED",
                paymentDetails: {
                    ...payment.paymentDetails,
                    cancelledAt: new Date().toISOString(),
                    status: "FAILED",
                    errorMessage: "Payment cancelled by user",
                },
            },
        });
    }
    return {
        success: false,
        message: "Payment was cancelled",
        data: {
            payment: payment
                ? {
                    ...payment,
                    amount: toNumber(payment.amount),
                }
                : null,
        },
    };
};
// =============================================
// 4. Get Payment by ID
// =============================================
const getPaymentById = async (paymentId, userId, userRole) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            rental_request: {
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            location: true,
                            price: true,
                            images: true,
                            bedrooms: true,
                            bathrooms: true,
                            size: true,
                            amenities: true,
                            availability: true,
                        },
                    },
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                        },
                    },
                    landlord: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            profileImage: true,
                        },
                    },
                },
            },
        },
    });
    if (!payment) {
        throw new Error("Payment not found");
    }
    const isAdmin = userRole === "ADMIN";
    const isTenant = payment.rental_request?.tenantId === userId;
    const isLandlord = payment.rental_request?.landlordId === userId;
    if (!isAdmin && !isTenant && !isLandlord) {
        throw new Error("You are not authorized to view this payment");
    }
    return {
        ...payment,
        amount: toNumber(payment.amount),
    };
};
// =============================================
// 5. Get All Payments (User)
// =============================================
const getMyPayments = async (userId, userRole, query) => {
    if (!userId) {
        throw new Error("User ID is required");
    }
    const { status, propertyId, startDate, endDate, sortBy = "createdAt", sortOrder = "desc", limit = 10, page = 1, } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) {
        where.status = status;
    }
    if (propertyId) {
        where.rental_request = {
            propertyId,
        };
    }
    if (startDate) {
        where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            include: {
                rental_request: {
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                location: true,
                                price: true,
                                images: true,
                            },
                        },
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        landlord: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            skip,
            take: parseInt(limit),
            orderBy: {
                [sortBy]: sortOrder,
            },
        }),
        prisma.payment.count({ where }),
    ]);
    const stats = await prisma.payment.aggregate({
        where,
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });
    const formattedPayments = payments.map((p) => ({
        ...p,
        amount: toNumber(p.amount),
    }));
    return {
        data: formattedPayments,
        stats: {
            totalPayments: stats._count.id || 0,
            totalAmount: stats._sum.amount ? toNumber(stats._sum.amount) : 0,
        },
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};
// =============================================
// 6. Payment Statistics
// =============================================
const getPaymentStats = async (userId, userRole) => {
    if (!userId) {
        throw new Error("User ID is required");
    }
    let where = {};
    if (userRole === "LANDLORD") {
        where.rental_request = {
            landlordId: userId,
        };
    }
    else if (userRole === "TENANT") {
        where.rental_request = {
            tenantId: userId,
        };
    }
    const [total, pending, paid, failed, refunded, totalAmount] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.count({ where: { ...where, status: "PENDING" } }),
        prisma.payment.count({ where: { ...where, status: "PAID" } }),
        prisma.payment.count({ where: { ...where, status: "FAILED" } }),
        prisma.payment.count({ where: { ...where, status: "REFUNDED" } }),
        prisma.payment.aggregate({
            where: { ...where, status: "PAID" },
            _sum: {
                amount: true,
            },
        }),
    ]);
    const totalAmountValue = totalAmount._sum.amount
        ? toNumber(totalAmount._sum.amount)
        : 0;
    const completionRate = total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";
    return {
        summary: {
            total,
            pending,
            paid,
            failed,
            refunded,
            totalAmount: totalAmountValue,
            completionRate: `${completionRate}%`,
        },
    };
};
export const paymentServices = {
    createPayment,
    paymentSuccess,
    paymentCancel,
    getPaymentById,
    getMyPayments,
    getPaymentStats,
};
//# sourceMappingURL=payment.service.js.map