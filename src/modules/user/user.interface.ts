
import { Roles, UserStatus } from "../../generated/prisma/enums.js";



export interface ICreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;      // optional
  avatar?: string;     // optional
  address?: string;    // optional
  role?: Roles;        // optional (default: TENANT)
  status?: UserStatus; // optional (default: ACTIVE)
}