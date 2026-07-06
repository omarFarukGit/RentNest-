import config from "../../config";
import { prisma } from "../../lib/prisma";
import { ICreateUserInput } from "./user.interface";
import bcrypt from "bcryptjs";

const registerIntroDB = async (payload: ICreateUserInput) => {
  const { name, email, password, phone, address, role } = payload;

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt),
  );

  const createUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      email: createUser.email,
    },
    omit: {
      password: true,
    },
  });
  return user;
};

export const userServices = {
  registerIntroDB,
};
