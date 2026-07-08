import { Router } from "express";
import { userController } from "./user.controller.js";
import { auth } from "../../middleware/auth.js";
import { Roles } from "../../generated/prisma/enums.js";


const router = Router();

router.post("/register", userController.register);
router.get(
  "/me",
  auth(Roles.ADMIN, Roles.LANDLORD, Roles.TENANT),
  userController.getMyProfile,
);

export const userRoutes = router;
