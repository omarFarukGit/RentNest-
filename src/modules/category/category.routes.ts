import { Router } from "express";
import { categoryController } from "./category.controller";

const router = Router();

router.post("/", categoryController.createCategory);

// POST   /categories
// PUT    /categories/:id
// DELETE /categories/:id

export const categoryRoutes = router;
