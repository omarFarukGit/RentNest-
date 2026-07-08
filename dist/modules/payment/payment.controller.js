import { paymentServices } from "./payment.service.js";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import config from "../../config/index.js";
// =============================================
// 1. Create Payment
// =============================================
const createPayment = catchAsync(async (req, res) => {
    const tenantId = req.user?.id;
    const payload = req.body;
    if (!tenantId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    const result = await paymentServices.createPayment(tenantId, payload);
    sendResponse(res, {
        success: true,
        statusCode: result.isExisting ? httpStatus.OK : httpStatus.CREATED,
        message: result.message,
        data: {
            checkoutUrl: result.stripe?.checkoutUrl,
        },
    });
});
// =============================================
// 2. ✅ Payment Success - Save Data
// =============================================
const paymentSuccess = catchAsync(async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.BAD_REQUEST,
            message: "Session ID is required",
            data: null,
        });
    }
    // ===== Process Payment Success =====
    const result = await paymentServices.paymentSuccess(session_id);
    // ===== Check if redirect =====
    if (req.query.redirect === "true") {
        return res.redirect(`${process.env.CLIENT_URL}/payment/success?payment_id=${result.data.payment.id}`);
    }
    // ===== Return JSON Response =====
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: result.message,
        data: result.data,
    });
});
// =============================================
// 3. Payment Cancel
// =============================================
const paymentCancel = catchAsync(async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.BAD_REQUEST,
            message: "Session ID is required",
            data: null,
        });
    }
    const result = await paymentServices.paymentCancel(session_id);
    if (req.query.redirect === "true") {
        return res.redirect(`${config.client_url}/payment/cancel`);
    }
    sendResponse(res, {
        success: false,
        statusCode: httpStatus.OK,
        message: result.message,
        data: result.data,
    });
});
// =============================================
// 4. Get Payment by ID
// =============================================
const getPaymentById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    const result = await paymentServices.getPaymentById(id, userId, userRole);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment fetched successfully",
        data: result,
    });
});
// =============================================
// 5. Get My Payments
// =============================================
const getMyPayments = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const query = req.query;
    if (!userId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    const result = await paymentServices.getMyPayments(userId, userRole, query);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payments fetched successfully",
        data: result.data,
        meta: result.pagination,
    });
});
// =============================================
// 6. Payment Statistics
// =============================================
const getPaymentStats = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    const result = await paymentServices.getPaymentStats(userId, userRole);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment statistics fetched successfully",
        data: result,
    });
});
export const paymentControllers = {
    createPayment,
    paymentSuccess,
    paymentCancel,
    getPaymentById,
    getMyPayments,
    getPaymentStats,
};
//# sourceMappingURL=payment.controller.js.map