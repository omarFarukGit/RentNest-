import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { properityServices } from "./property.service";

const getLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {},
);
const getLandlordPropertiesById = catchAsync(
  async (req: Request, res: Response) => {},
);
const createLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {
    const landlordId = req.user?.id as string;
    const payload = req.body;

    const result = await properityServices.createLandlordProperties(
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
const updateLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {},
);
const deleteLandlordProperties = catchAsync(
  async (req: Request, res: Response) => {},
);

export const properityController = {
  getLandlordProperties,
  getLandlordPropertiesById,
  createLandlordProperties,
  updateLandlordProperties,
  deleteLandlordProperties,
};
