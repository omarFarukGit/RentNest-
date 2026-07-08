import { Router } from "express";

import { auth } from "../../middleware/auth.js";
import { propertyControllers } from "./property.controller.js";
import { Roles } from "../../generated/prisma/enums.js";


const router = Router();

router.post(
  "/",
  auth(Roles.LANDLORD),
  propertyControllers.createLandlordProperties,
);
router.get(
  "/landlord",
  auth(Roles.LANDLORD),
  propertyControllers.getLandlordProperties,
);

router.get("/", propertyControllers.getAllProperties);

router.get("/:id", propertyControllers.getSingleProperty);

router.get("/my-properties", auth(), propertyControllers.getLandlordProperties);

// প্রপার্টি আপডেট
router.patch(
  "/:id",
  auth(Roles.ADMIN, Roles.LANDLORD),
  propertyControllers.updateProperty,
);

// প্রপার্টি ডিলিট
router.delete(
  "/:id",
  auth(Roles.ADMIN, Roles.LANDLORD),
  propertyControllers.deleteProperty,
);

// প্রপার্টি এভেইলেবিলিটি টগল
router.patch(
  "/:id/toggle-availability",
  auth(),
  propertyControllers.togglePropertyAvailability,
);

export const propertyRoutes = router;
