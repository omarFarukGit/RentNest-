// rental.controller.ts
import { Request, Response } from "express";
import { rentalServices } from "./rental.service";

import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// =============================================
// 1. রেন্টাল রিকোয়েস্ট তৈরি
// =============================================
const createRentalRequest = catchAsync(async (req: Request, res: Response) => {
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

  if (!payload || Object.keys(payload).length === 0) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "Request body is required",
      data: null,
    });
  }

  const result = await rentalServices.createRentalRequest(tenantId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: result.message,
    data: result.rentalRequest,
  });
});

// =============================================
// 2. টেন্যান্টের সব রেন্টাল রিকোয়েস্ট
// =============================================
const getMyRentalRequests = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.id;
  const query = req.query;

  if (!tenantId) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "User not authenticated",
      data: null,
    });
  }

  const result = await rentalServices.getMyRentalRequests(tenantId, query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your rental requests fetched successfully",
    data: result.data,
    meta: result.pagination,
  });
});

// =============================================
// 3. ল্যান্ডলর্ডের সব রেন্টাল রিকোয়েস্ট
// =============================================
const getLandlordRentalRequests = catchAsync(
  async (req: Request, res: Response) => {
    const landlordId = req.user?.id;
    const query = req.query;

    if (!landlordId) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await rentalServices.getLandlordRentalRequests(
      landlordId,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Landlord rental requests fetched successfully",
      data: result.data,
      meta: result.pagination,
    });
  },
);

// =============================================
// 4. সিঙ্গেল রেন্টাল রিকোয়েস্ট
// =============================================
const getSingleRentalRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role as string;

    if (!userId) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "User not authenticated",
        data: null,
      });
    }

    const result = await rentalServices.getSingleRentalRequest(
      id as string,
      userId,
      userRole,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental request fetched successfully",
      data: result,
    });
  },
);

// =============================================
// 5. রেন্টাল স্ট্যাটাস আপডেট (Landlord Only)
// =============================================
const updateRentalStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const landlordId = req.user?.id;
  const payload = req.body;

  if (!landlordId) {
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
      message: "Request body is required. Please provide status.",
      data: null,
    });
  }

  const result = await rentalServices.updateRentalStatus(
    id as string,
    landlordId,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.rentalRequest,
  });
});

// =============================================
// 6. রেন্টাল রিকোয়েস্ট ক্যান্সেল (Tenant Only)
// =============================================
const cancelRentalRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.id;

  if (!tenantId) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "User not authenticated",
      data: null,
    });
  }

  const result = await rentalServices.cancelRentalRequest(
    id as string,
    tenantId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.rentalRequest,
  });
});

// =============================================
// 7. রেন্টাল স্ট্যাটিস্টিক্স
// =============================================
const getRentalStats = catchAsync(async (req: Request, res: Response) => {
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

  const result = await rentalServices.getRentalStats(
    userId,
    userRole as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental statistics fetched successfully",
    data: result,
  });
});

export const rentalControllers = {
  createRentalRequest,
  getMyRentalRequests,
  getLandlordRentalRequests,
  getSingleRentalRequest,
  updateRentalStatus,
  cancelRentalRequest,
  getRentalStats,
};
