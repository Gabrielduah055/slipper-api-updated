import { Document } from "mongoose";

export type ProductCategory = "Half Shoe" | "Sandal" | "Slippers" | "Shoe" | "Sneaker" | "Others";

export interface IProduct extends Document {
    category: ProductCategory;
    productName: string;
    productPrice: number;
    productImage: string;
    productThumbnailImages: string[];
    productStock: number;
    productDescription: string;
    productSize:number,
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}