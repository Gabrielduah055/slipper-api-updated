import mongoose from "mongoose";
import {IAdmin} from "../interface/adminInterface"

const adminSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["superAdmin", "admin"],
        default: "admin"
    }
});

export default mongoose.model<IAdmin>("Admin", adminSchema);
