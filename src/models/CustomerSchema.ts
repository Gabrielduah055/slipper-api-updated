import mongoose from "mongoose";
import { ICustomer } from "../interface/customerInterface";

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    }
}, { timestamps: true });

export default mongoose.model<ICustomer>("Customer", customerSchema);
