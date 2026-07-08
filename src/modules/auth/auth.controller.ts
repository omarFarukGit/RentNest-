import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import httpStatus from "http-status";
import { authServies } from "./auth.services.js";

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    const { loginUser, accessToken, refreshToken } =
      await authServies.loginUserFromDB(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, //24 hour one day
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "user login successfully",
      data: {
        user:loginUser,
        accessToken,
        refreshToken,
      },
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.refreshToken as string;
    console.log(token);

    const { accessToken } = await authServies.refreshToken(token);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, //24 hour one day
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "generated refreshToken to accessToken successfully",
      data: {
        accessToken,
      },
    });
  },
);

export const authController = {
  login,
  refreshToken,
};
