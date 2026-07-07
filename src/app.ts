import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";
import { userRoutes } from "./modules/user/user.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { properityRoutes } from "./modules/property/property.routes";
import { categoryRoutes } from "./modules/category/category.routes";

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
app.use("/api/properties", properityRoutes);
app.use("/api/categories", categoryRoutes);

//Not Found route handler
app.use(notFoundHandler);

//Global error handler
app.use(globalErrorHandler);

export default app;
