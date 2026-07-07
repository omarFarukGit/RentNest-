// admin.routes.ts
import express from "express";
import { adminControllers } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { Roles } from "../../../generated/prisma/enums";

const router = express.Router();

// =============================================
// সব রাউট শুধু Admin-এর জন্য
// =============================================

// 1. ইউজার রাউট
router.get("/users", auth(Roles.ADMIN), adminControllers.getAllUsers);
router.get("/users/:id", auth(Roles.ADMIN), adminControllers.getSingleUser);
router.patch("/users/:id", auth(Roles.ADMIN), adminControllers.updateUser);

// 2. প্রপার্টি রাউট
router.get(
  "/properties",
  auth(Roles.ADMIN),
  adminControllers.adminGetAllProperties,
);
router.patch(
  "/properties/:id",
  auth(Roles.ADMIN),
  adminControllers.adminUpdateProperty,
);
router.delete(
  "/properties/:id",
  auth(Roles.ADMIN),
  adminControllers.adminDeleteProperty,
);

export const adminRoutes = router;
