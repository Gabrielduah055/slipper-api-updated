import "dotenv/config";
import { createApp } from "./app";
import { validateAuthenticationEnvironment } from "./config/firebaseAdmin";
import connetDB from "./config/mongodb";

const port = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  validateAuthenticationEnvironment();
  await connetDB();

  createApp().listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

void startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Server startup failed";
  console.error(message);
  process.exitCode = 1;
});
