import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { webhookRoutes } from "./lib/webhook.js";
import { userRoutes } from "./modules/user/user.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { propertyRoutes } from "./modules/property/property.routes.js";
import { CategoryRoutes } from "./modules/category/category.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { reviewRoutes } from "./modules/review/review.routes.js";
import { rentalRoutes } from "./modules/rental/rental.routes.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { globalErrorHandler } from "./middleware/global-error.js";


const app = express();
app.use("/api/webhooks", webhookRoutes);
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
app.use("/api/payments", paymentRoutes);

//Not Found route handler
app.use(notFoundHandler);

//Global error handler
app.use(globalErrorHandler);

export default app;
