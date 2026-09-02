import { Document } from "mongoose";

export interface IAdmin extends Document {
    userName: string;
    email: string;
    role: 'superAdmin' | 'admin';
}
