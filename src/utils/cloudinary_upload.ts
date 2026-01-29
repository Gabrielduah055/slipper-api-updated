
import cloudinary from "../config/cloudinary";
import streamifier from 'streamifier';

export const uploadBufferToCloudinary = (
    buffer: Buffer,
    folder = "products"
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if(error) return reject(error);
                if (!result?.secure_url) return reject(new Error("No secure_url returned from Cloudinary"));
                resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    })
}