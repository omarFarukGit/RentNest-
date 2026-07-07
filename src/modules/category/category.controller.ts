import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { categoryServices } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await categoryServices.createCategory(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registaion successfully",
    data: result,
  });
});

export const categoryController = {
  createCategory,
};
