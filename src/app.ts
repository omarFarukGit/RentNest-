import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";
import { userRoutes } from "./modules/user/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { propertyRoutes } from "./modules/property/property.routes";
import { CategoryRoutes } from "./modules/category/category.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { reviewRoutes } from "./modules/review/review.routes";
import { rentalRoutes } from "./modules/rental/rental.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// All Endpiends
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/categories", CategoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/rentals", rentalRoutes);

//Not Found route handler
app.use(notFoundHandler);

//Global error handler
app.use(globalErrorHandler);

export default app;
