import { Router } from "express";
import { properityController } from "./property.controller";
import { auth } from "../../middleware/auth";
import { Roles } from "../../../generated/prisma/enums";

const router = Router();
router.get(
  "/",
  auth(Roles.LANDLORD),
  properityController.getLandlordProperties,
);
router.get(
  "/:id",
  auth(Roles.LANDLORD),
  properityController.getLandlordPropertiesById,
);
router.post(
  "/",
  auth(Roles.LANDLORD),
  properityController.createLandlordProperties,
);
router.patch(
  "/:id",
  auth(Roles.LANDLORD),
  properityController.updateLandlordProperties,
);
router.delete(
  "/:id",
  auth(Roles.LANDLORD),
  properityController.deleteLandlordProperties,
);

export const properityRoutes = router;
