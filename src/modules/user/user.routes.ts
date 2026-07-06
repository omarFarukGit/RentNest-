import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middleware/auth";
import { Roles } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", userController.register);
router.get(
  "/my-profile",
  auth(Roles.ADMIN, Roles.LANDLORD, Roles.TENANT),
  userController.getMyProfile,
);

export const userRoutes = router;
