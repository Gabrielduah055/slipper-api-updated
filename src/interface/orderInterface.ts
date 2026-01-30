import { Document } from "mongoose";

export interface IOrderItem {
    product: string; // Product ID
    quantity: number;
    priceAtPurchase: number;
}

export interface IOrder extends Document {
    customer: string; // Customer ID
    items: IOrderItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentInfo: {
        method: string;
        status: string;
        transactionId?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
