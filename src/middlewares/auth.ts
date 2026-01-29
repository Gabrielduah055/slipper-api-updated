import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IAdmin } from "../interface/adminInterface";
import Admin from "../models/AdminSchema";
import { loginAdmin } from "../controllers/loginAdmin";

export interface AuthRequest extends Request {
    admin?: IAdmin;
}

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Authorization header missing or malformed" });
            return;
        }

        const token = authHeader.split(" ")[1];

        jwt.verify(token as string, JWT_SECRET, (err:any, decoded:any) => {
            if (err) {
                return res.status(401).json({
                    message: err.name ==="TokenExpiredError" ? "Invalid token" : "Token verification failed"
                });
            }

            req.admin = decoded as IAdmin;
            next();
        })
        
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}