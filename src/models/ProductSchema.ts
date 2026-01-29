import mongoose from "mongoose";

import { IProduct } from "../interface/productInterface";

const PRODUCT_CATEGORIES = ["Half Shoe", "Sandal", "Slippers", "Shoe", "Sneaker", "Others"] as const;

const productSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: PRODUCT_CATEGORIES,
        required: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productPrice: {
        type: Number,
        required: true,
        trim: true
    },
    productImage: {
        type: String,
        required: true,
        trim: true
    },
    productThumbnailImages: {
        type: [String],
        required: true,
        trim: true,
        min:1
    },
    productStock: {
        type: Number,
        required: true,
        trim: true
    },
    productDescription: {
        type: String,
        required: true,
        trim: true
    },
    productSize: {
        type: Number,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model<IProduct>("Product", productSchema);