import { emit } from "node:cluster";
import { prisma } from "../../lib/prisma";
import { ILogingPayload } from "./auth.interface";
import bcrypt from "bcryptjs";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { SignOptions } from "jsonwebtoken";

const loginUserFromDB = async (payload: ILogingPayload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new Error("Provied email and password");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatchPassword = await bcrypt.compare(password, user.password);

  if (!isMatchPassword) {
    throw new Error("Invaild creadintials");
  }

  const JwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    JwtPayload,
    config.jwt_access_secret,
    config.jwt_access_exprire_in as SignOptions,
  );
  const refreshToken = jwtUtils.createToken(
    JwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_exprire_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const authServies = {
  loginUserFromDB,
};
