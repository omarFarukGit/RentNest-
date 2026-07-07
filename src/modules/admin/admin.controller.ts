// admin.controller.ts
import { Request, Response } from "express";
import { adminServices } from "./admin.service";

import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// =============================================
// 1. সব ইউজার দেখা
// =============================================
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await adminServices.getAllUsers(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.pagination,
  });
});

// =============================================
// 2. সিঙ্গেল ইউজার দেখা
// =============================================
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await adminServices.getSingleUser(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully",
    data: result,
  });
});

// =============================================
// 3. ইউজার আপডেট
// =============================================
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await adminServices.updateUser(id as string, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.user,
  });
});

// =============================================
// 4. সব প্রপার্টি দেখা
// =============================================
const adminGetAllProperties = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query;

    const result = await adminServices.adminGetAllProperties(query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All properties fetched successfully (Admin)",
      data: result.data,
      meta: result.pagination,
    });
  },
);

// =============================================
// 5. প্রপার্টি আপডেট
// =============================================
const adminUpdateProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await adminServices.adminUpdateProperty(id as string, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.property,
  });
});

// =============================================
// 6. প্রপার্টি ডিলিট
// =============================================
const adminDeleteProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await adminServices.adminDeleteProperty(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.deletedProperty,
  });
});

export const adminControllers = {
  getAllUsers,
  getSingleUser,
  updateUser,
  adminGetAllProperties,
  adminUpdateProperty,
  adminDeleteProperty,
};
