import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { name, email, password } = payload;
    if (!name || !email || !password) {
      throw new Error("Plese fill all fileds");
    }
    const result = await userServices.registerIntroDB(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registaion successfully",
      data: result,
    });
  },
);
const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.user;
    const result = await userServices.getMyProfile(payload as JwtPayload);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "get my profile successfully",
      data: result,
    });
  },
);

export const userController = {
  register,
  getMyProfile,
};
