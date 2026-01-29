import { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/AdminSchema';
import { IAdmin } from '../interface/adminInterface';

export interface AuthRequest extends Request {
    admin?: IAdmin;
}

export const loginAdmin: RequestHandler = async (req: AuthRequest, res: Response):Promise<void> => {

    try {
        const { userName, password } = req.body;
        const admin = await Admin.findOne({ userName }) as IAdmin || null;
        
        //check if admin exists
        if (!admin) {
            res.status(404).json({ message: "Admin not found" });
            return;
        }

        //compare password
        const isPasswordCorrect = await admin.comparedPassword(password);
        if (!isPasswordCorrect) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        //create token
        const token = jwt.sign({
            id: admin._id,
            userName: admin.userName,
            role: admin.role,
        }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        
        res.status(200).json({
            message: "Login successful",
            token: `Bearer ${token}`,
            admin: {
                id: admin._id,
                userName: admin.userName,
                email: admin.email,
                role: admin.role
            }
         });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}