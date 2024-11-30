import { NextFunction, Request, Response } from "express";

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "BACKEND ERROR";
  const details = err.details || undefined;

  if (!details) {
    res.status(statusCode).json({
      message: message,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: message,
      details: details,
    });
  }
};

export default errorMiddleware;