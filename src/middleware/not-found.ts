import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: `Not Found - Cannot ${req.method} ${req.originalUrl}`,
  });
};