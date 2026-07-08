import { reviewServices } from "./review.service.js";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
// =============================================
// 1. রিভিউ তৈরি
// =============================================
const createReview = catchAsync(async (req, res) => {
    const tenantId = req.user?.id;
    const payload = req.body;
    // ===== ভ্যালিডেশন =====
    if (!tenantId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    if (!payload || Object.keys(payload).length === 0) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.BAD_REQUEST,
            message: "Request body is empty. Please provide propertyId and rating.",
            data: null,
        });
    }
    const result = await reviewServices.createReview(tenantId, payload);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: result.message,
        data: result.review,
    });
});
// =============================================
// 2. প্রপার্টির সব রিভিউ
// =============================================
const getPropertyReviews = catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const query = req.query;
    const result = await reviewServices.getPropertyReviews(propertyId, query);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property reviews fetched successfully",
        data: {
            property: result.property,
            stats: result.stats,
            reviews: result.reviews,
        },
        meta: result.pagination,
    });
});
// =============================================
// 3. ইউজারের সব রিভিউ
// =============================================
const getUserReviews = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const query = req.query;
    if (!userId) {
        return sendResponse(res, {
            success: false,
            statusCode: httpStatus.UNAUTHORIZED,
            message: "User not authenticated",
            data: null,
        });
    }
    const result = await reviewServices.getUserReviews(userId, query);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your reviews fetched successfully",
        data: result.data,
        meta: result.pagination,
    });
});
// =============================================
// 4. রিভিউ আপডেট
// =============================================
const updateReview = catchAsync(async (req, res) => {
    const { id } = req.params;
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
    const result = await reviewServices.updateReview(id, tenantId, payload);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: result.message,
        data: result.review,
    });
});
// =============================================
// 5. রিভিউ ডিলিট
// =============================================
const deleteReview = catchAsync(async (req, res) => {
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
    const result = await reviewServices.deleteReview(id, userId, userRole);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: result.message,
        data: result.deletedReview,
    });
});
// =============================================
// 6. প্রপার্টির রেটিং স্ট্যাটস
// =============================================
const getPropertyRatingStats = catchAsync(async (req, res) => {
    const { propertyId } = req.params;
    const result = await reviewServices.getPropertyRatingStats(propertyId);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property rating stats fetched successfully",
        data: result,
    });
});
export const reviewControllers = {
    createReview,
    getPropertyReviews,
    getUserReviews,
    updateReview,
    deleteReview,
    getPropertyRatingStats,
};
//# sourceMappingURL=review.controller.js.map