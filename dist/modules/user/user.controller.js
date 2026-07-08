import { catchAsync } from "../../utils/catchAsync.js";
import { userServices } from "./user.services.js";
import { sendResponse } from "../../utils/sendResponse.js";
import httpStatus from "http-status";
const register = catchAsync(async (req, res, next) => {
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
});
const getMyProfile = catchAsync(async (req, res, next) => {
    const payload = req.user;
    const result = await userServices.getMyProfile(payload);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "get my profile successfully",
        data: result,
    });
});
export const userController = {
    register,
    getMyProfile,
};
//# sourceMappingURL=user.controller.js.map