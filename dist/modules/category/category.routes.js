import { auth } from "../../middleware/auth.js";
import { Router } from "express";
import { CategoryController } from "./category.controller.js";
const router = Router();
router.post("/", auth("ADMIN"), CategoryController.createCategory);
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getSingleCategory);
router.put("/:id", auth("ADMIN"), CategoryController.updateCategory);
router.delete("/:id", auth("ADMIN"), CategoryController.deleteCategory);
export const CategoryRoutes = router;
//# sourceMappingURL=category.routes.js.map