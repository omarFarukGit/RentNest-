import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Roles } from "../generated/prisma/enums.js";
import { jwtUtils } from "../utils/jwt.js";
import config from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        id: string;
        role: Roles;
      };
    }
  }
}

export const auth = (...requiredRoles: Roles[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new Error("You are not logged in please log in to access resource");
    }
    const verifiedToken = jwtUtils.verifiedToken(
      token,
      config.jwt_access_secret,
    );

    if (!verifiedToken.success) {
      throw new Error(verifiedToken.error);
    }
    const { email, name, id, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new Error("forbiden access");
    }

    const user = await prisma.user.findUnique({
      where: { id, email, name, role },
    });

    if (!user) {
      throw new Error("User not found please log is again");
    }
    if (user.status === "BLOCKED") {
      throw new Error("your account has been bloked. please contact support");
    }

    req.user = {
      email,
      name,
      id,
      role,
    };
    next();
  });
};
