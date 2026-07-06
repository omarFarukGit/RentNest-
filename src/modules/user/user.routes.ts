import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

router.post("/register", userController.register);
router.get("/my-profile", userController.getMyProfile);

export const userRoutes = router;
