import { Document } from "mongoose";

export interface ICustomer extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}
