import dotenv from "dotenv";
import app from "./app";
import { validateAuthenticationEnvironment } from "./config/firebaseAdmin";
import connetDB from "./config/mongodb";

dotenv.config();

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  validateAuthenticationEnvironment();
}

void connetDB();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
