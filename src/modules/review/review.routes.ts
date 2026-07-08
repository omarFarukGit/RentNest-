// review.routes.ts
import express from "express";
import { reviewControllers } from "./review.controller.js";


import { auth } from "../../middleware/auth.js";
import { Roles } from "../../generated/prisma/enums.js";


const router = express.Router();

// =============================================
// Public Routes (সবাই দেখতে পারে)
// =============================================

// প্রপার্টির সব রিভিউ
router.get("/property/:propertyId", reviewControllers.getPropertyReviews);

// =============================================
// Protected Routes (শুধু অথেন্টিকেটেড ইউজার)
// =============================================

// রিভিউ তৈরি (শুধু Tenant)
router.post("/", auth(Roles.TENANT), reviewControllers.createReview);

// ইউজারের নিজের রিভিউ
router.get("/my-reviews", auth(Roles.TENANT), reviewControllers.getUserReviews);

// রিভিউ আপডেট (শুধু রিভিউর মালিক)
router.put("/:id", auth(Roles.TENANT), reviewControllers.updateReview);

// রিভিউ ডিলিট (মালিক + Admin)
router.delete(
  "/:id",
  auth(Roles.TENANT, Roles.ADMIN),
  reviewControllers.deleteReview,
);

export const reviewRoutes = router;
