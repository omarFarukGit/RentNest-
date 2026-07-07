import { emit } from "node:cluster";
import { prisma } from "../../lib/prisma";
import { ILogingPayload } from "./auth.interface";
import bcrypt from "bcryptjs";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { JwtPayload, SignOptions } from "jsonwebtoken";

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

  if (user.status === "BLOCKED") {
    throw new Error("your account has been bloked. please contact support");
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

  const loginUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };

  return {
    loginUser,
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Your token missing plesse login agin");
  }
  const verifiedToken = jwtUtils.verifiedToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedToken.success) {
    throw new Error(verifiedToken.error);
  }
  const { email, name, id, role } = verifiedToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id, email, name, role },
  });

  if (!user) {
    throw new Error("User not found please log in again");
  }
  if (user.status === "BLOCKED") {
    throw new Error("your account has been bloked. please contact support");
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

  return { accessToken };
};

export const authServies = {
  loginUserFromDB,
  refreshToken,
};
