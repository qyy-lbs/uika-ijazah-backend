import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const authHeader =
      req.headers.authorization;

    // cek header authorization
    if (!authHeader) {

      return res.status(401).json({
        success: false,
        message: "Token required",
      });

    }

    // format:
    // Bearer eyJhbGci...

    const token =
      authHeader.split(" ")[1];

    if (!token) {

      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });

    }

    // verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    // simpan user ke request
    (req as any).user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });

  }

};