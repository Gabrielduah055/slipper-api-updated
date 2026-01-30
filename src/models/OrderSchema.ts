import mongoose from "mongoose";
import { IOrder } from "../interface/orderInterface";

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        priceAtPurchase: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentInfo: {
        method: {
            type: String,
            default: 'mock'
        },
        status: {
            type: String,
            default: 'pending'
        },
        transactionId: String
    }
}, { timestamps: true });

export default mongoose.model<IOrder>("Order", orderSchema);
