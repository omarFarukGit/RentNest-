// src/modules/payment/payment.routes.ts
import express from "express";
import { auth } from "../../middleware/auth.js";
import { paymentControllers } from "./payment.controller.js";
import { Roles } from "../../generated/prisma/enums.js";
const router = express.Router();
// =============================================
// Public Routes (Payment Success/Cancel)
// =============================================
router.get("/success", paymentControllers.paymentSuccess);
router.get("/cancel", paymentControllers.paymentCancel);
// =============================================
// Protected Routes
// =============================================
// 1. Create Payment (Tenant Only)
router.post("/create", auth(Roles.TENANT), paymentControllers.createPayment);
// 2. Get Single Payment
router.get("/:id", auth(Roles.TENANT, Roles.ADMIN, Roles.LANDLORD), paymentControllers.getPaymentById);
// 3. Get My Payments
router.get("/", auth(Roles.TENANT, Roles.ADMIN, Roles.LANDLORD), paymentControllers.getMyPayments);
// 4. Payment Statistics
router.get("/stats/all", auth(Roles.TENANT, Roles.ADMIN, Roles.LANDLORD), paymentControllers.getPaymentStats);
export const paymentRoutes = router;
//# sourceMappingURL=payment.routes.js.map