import path from "node:path";
import type { StorageAdapter } from "@/lib/storage/types";
import { LocalStorageAdapter } from "@/lib/storage/local/adapter";

function createStorageAdapter(): StorageAdapter {
  const driver = process.env.FILE_STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    const root = process.env.FILE_STORAGE_ROOT ?? path.join(process.cwd(), "public", "uploads");
    const publicPrefix = process.env.FILE_STORAGE_PUBLIC_PREFIX ?? "/uploads";
    return new LocalStorageAdapter({ root, publicPrefix });
  }

  throw new Error(`Unsupported storage driver: ${driver}`);
}

export const storage = createStorageAdapter();
export type { StorageAdapter } from "@/lib/storage/types";
