import { Document } from "mongoose";

export interface IAdmin extends Document {
    userName: string;
    email: string;
    password: string;
    role: 'superAdmin' | 'admin';
    comparedPassword: (password:string) => Promise<boolean>;
}