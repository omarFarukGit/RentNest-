// src/modules/admin/admin.routes.ts
import express from "express";
import { adminControllers } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { Roles } from "../../../generated/prisma/enums";

const router = express.Router();

// =============================================
// 1. User Routes
// =============================================
router.get("/users", auth(Roles.ADMIN), adminControllers.getAllUsers);
router.get("/users/:id", auth(Roles.ADMIN), adminControllers.getSingleUser);
router.patch("/users/:id", auth(Roles.ADMIN), adminControllers.updateUser);

// =============================================
// 2. Property Routes
// =============================================
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

// =============================================
// ✅ 3. Rental Routes (New)
// =============================================
router.get(
  "/rentals",
  auth(Roles.ADMIN),
  adminControllers.adminGetAllRentals,
);
router.get(
  "/rentals/:id",
  auth(Roles.ADMIN),
  adminControllers.adminGetSingleRental,
);
router.patch(
  "/rentals/:id/status",
  auth(Roles.ADMIN),
  adminControllers.adminUpdateRentalStatus,
);
router.delete(
  "/rentals/:id",
  auth(Roles.ADMIN),
  adminControllers.adminDeleteRental,
);

export const adminRoutes = router;