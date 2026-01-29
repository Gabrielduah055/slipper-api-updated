import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["superAdmin", "admin"],
        default: "admin"
    }
});

//add password comparison method
adminSchema.methods.comparedPassword = async function (password: string) {
    return await bcrypt.compare(password, this.password);
}

//hashing the password
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10);
    next();
})


export default mongoose.model<IAdmin>("Admin", adminSchema);