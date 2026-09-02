import dotenv from "dotenv";
import mongoose from "mongoose";
import connetDB from "../config/mongodb";
import Admin from "../models/AdminSchema";

const CONFIRMATION = "REMOVE_LEGACY_ADMIN_PASSWORDS";

export const legacyPasswordFilter = (): Record<string, unknown> => ({
  password: { $exists: true },
});

export const legacyPasswordUpdate = (): Record<string, unknown> => ({
  $unset: { password: "" },
});

type MigrationMode = "dry-run" | "apply";

export const parseMigrationMode = (args: string[]): MigrationMode => {
  const isDryRun = args.includes("--dry-run");
  const isApply = args.includes("--apply");

  if (isDryRun === isApply) {
    throw new Error("Specify exactly one migration mode: --dry-run or --apply");
  }

  if (isDryRun) {
    return "dry-run";
  }

  if (isApply) {
    const confirmation = args.find((arg) => arg.startsWith("--confirm="));
    if (confirmation !== `--confirm=${CONFIRMATION}`) {
      throw new Error(
        `Apply mode requires --confirm=${CONFIRMATION}`
      );
    }
    return "apply";
  }

  throw new Error("Invalid migration mode");
};

export const runMigration = async (args: string[]): Promise<void> => {
  const mode = parseMigrationMode(args);

  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  await connetDB();

  const filter = legacyPasswordFilter();
  const matchingDocuments = await Admin.collection.countDocuments(filter);

  if (mode === "dry-run") {
    console.log(
      `Dry run: ${matchingDocuments} administrator document(s) contain the legacy password field.`
    );
    return;
  }

  const result = await Admin.collection.updateMany(
    filter,
    legacyPasswordUpdate()
  );
  console.log(
    `Migration complete: matched ${result.matchedCount} document(s); removed the legacy password field from ${result.modifiedCount} document(s).`
  );
};

const main = async (): Promise<void> => {
  dotenv.config();

  try {
    await runMigration(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    console.error(message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  void main();
}
