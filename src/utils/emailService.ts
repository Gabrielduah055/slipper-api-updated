import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Admin from '../models/AdminSchema';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendOrderNotificationEmail = async (order: any, customer: any) => {
    try {
        // 1. Try to find an admin in the database
        // We'll look for a superAdmin first, or just the first admin found
        const admin = await Admin.findOne().sort({ createdAt: 1 });
        
        // 2. Determine the recipient email
        // Priority: Admin from DB -> Env ADMIN_EMAIL -> Env EMAIL_USER (sender)
        let recipientEmail = admin?.email || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        if (!recipientEmail) {
            console.warn('No admin email found in DB or .env. Skipping email notification.');
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `New Order Received: #${order._id}`,
            html: `
                <h1>New Order Alert</h1>
                <p>You have received a new order!</p>
                
                <h2>Customer Details</h2>
                <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Phone:</strong> ${customer.phoneNumber}</p>
                
                <h2>Order Details</h2>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                
                <h3>Items:</h3>
                <ul>
                    ${order.items.map((item: any) => `
                        <li>Product ID: ${item.product} - Quantity: ${item.quantity}</li>
                    `).join('')}
                </ul>
                
                <p>Please log in to the admin dashboard to process this order.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Order notification email sent to ${recipientEmail}:`, info.messageId);
    } catch (error) {
        console.error('Error sending order notification email:', error);
    }
};
