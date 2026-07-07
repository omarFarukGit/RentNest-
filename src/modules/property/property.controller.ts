import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { propertyServices } from "./property.service";

const createLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {
    const landlordId = req.user?.id as string;
    const payload = req.body;

    const result = await propertyServices.createLandlordProperties(
      landlordId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registaion successfully",
      data: result,
    });
  },
);
const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await propertyServices.getAllProperties(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: result.data,
    meta: result.pagination,
  });
});

// =============================================
// 2. সিঙ্গেল প্রপার্টি
// =============================================
const getSingleProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await propertyServices.getSingleProperty(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property fetched successfully",
    data: result,
  });
});

// =============================================
// 3. প্রপার্টি আপডেট
// =============================================
const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const userRole = req.user?.role as string;
  const payload = req.body;

  const result = await propertyServices.updateProperty(
    id as string,
    userId,
    userRole,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.property,
  });
});

// =============================================
// 4. প্রপার্টি ডিলিট admin ownwer
// =============================================
const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const userRole = req.user?.role as string;

  const result = await propertyServices.deleteProperty(
    id as string,
    userId,
    userRole,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.deletedProperty,
  });
});

// =============================================
// 5. ল্যান্ডলর্ডের সব প্রপার্টি
// =============================================
const getLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {
    const landlordId = req.user?.id; // অথেন্টিকেশন থেকে
    const query = req.query;

    const result = await propertyServices.getLandlordProperties(
      landlordId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your properties fetched successfully",
      data: result.data,
      meta: result.pagination,
    });
  },
);

// =============================================
// 6. প্রপার্টি এভেইলেবিলিটি টগল
// =============================================
const togglePropertyAvailability = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const landlordId = req.user?.id; // অথেন্টিকেশন থেকে

    const result = await propertyServices.togglePropertyAvailability(
      id as string,
      landlordId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: result.property,
    });
  },
);

export const propertyControllers = {
  getAllProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  togglePropertyAvailability,
  createLandlordProperties,
};
