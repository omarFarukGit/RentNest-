// rental.routes.ts
import express from "express";
import { rentalControllers } from "./rental.controller.js";
import { auth } from "../../middleware/auth.js";
import { Roles } from "../../generated/prisma/enums.js";


const router = express.Router();

// =============================================
// Protected Routes (শুধু অথেন্টিকেটেড ইউজার)
// =============================================

// 1. রেন্টাল রিকোয়েস্ট তৈরি (Tenant Only)
router.post("/", auth(Roles.TENANT), rentalControllers.createRentalRequest);

// 2. টেন্যান্টের সব রেন্টাল রিকোয়েস্ট
router.get(
  "/my-requests",
  auth(Roles.TENANT),
  rentalControllers.getMyRentalRequests,
);

// 3. ল্যান্ডলর্ডের সব রেন্টাল রিকোয়েস্ট
router.get(
  "/landlord",
  auth(Roles.LANDLORD),
  rentalControllers.getLandlordRentalRequests,
);

// 4. সিঙ্গেল রেন্টাল রিকোয়েস্ট
router.get(
  "/:id",
  auth(Roles.TENANT, Roles.LANDLORD, Roles.ADMIN),
  rentalControllers.getSingleRentalRequest,
);

// 5. রেন্টাল স্ট্যাটাস আপডেট (Landlord Only)
router.patch(
  "/:id/status",
  auth(Roles.LANDLORD),
  rentalControllers.updateRentalStatus,
);

// 6. রেন্টাল রিকোয়েস্ট ক্যান্সেল (Tenant Only)
router.patch(
  "/:id/cancel",
  auth(Roles.TENANT),
  rentalControllers.cancelRentalRequest,
);

// 7. রেন্টাল স্ট্যাটিস্টিক্স
router.get(
  "/stats/all",
  auth(Roles.TENANT, Roles.LANDLORD, Roles.ADMIN),
  rentalControllers.getRentalStats,
);

export const rentalRoutes = router;
