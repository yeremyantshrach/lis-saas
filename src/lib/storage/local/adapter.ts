import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageAdapter, StorageSavedObject, StorageUploadOptions } from "@/lib/storage/types";

function bufferFrom(data: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (data instanceof Buffer) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  return Buffer.from(data);
}

export class LocalStorageAdapter implements StorageAdapter {
  public readonly name = "local";
  private readonly rootDir: string;
  private readonly publicPrefix: string;

  constructor(options?: { root?: string; publicPrefix?: string }) {
    this.rootDir = options?.root ?? path.join(process.cwd(), "public", "uploads");
    this.publicPrefix = options?.publicPrefix ?? "/uploads";
  }

  private resolvePath(relativePath: string) {
    const sanitized = relativePath.replace(/^\//, "");
    return {
      relative: sanitized,
      absolute: path.join(this.rootDir, sanitized),
    };
  }

  async save(
    data: Buffer | Uint8Array | ArrayBuffer,
    options: StorageUploadOptions,
  ): Promise<StorageSavedObject> {
    const buffer = bufferFrom(data);
    const filename = options.path && options.path.length > 0 ? options.path : randomUUID();
    const target = this.resolvePath(filename);
    await fs.mkdir(path.dirname(target.absolute), { recursive: true });
    await fs.writeFile(target.absolute, buffer);

    const normalizedUrl = path.posix.join(this.publicPrefix, target.relative).replace(/\\/g, "/");

    return {
      key: target.relative,
      url: normalizedUrl,
      driver: this.name,
      metadata: options.metadata,
    };
  }

  async delete(key: string): Promise<void> {
    const target = this.resolvePath(key);
    await fs.rm(target.absolute, { force: true });
  }

  async getUrl(key: string): Promise<string | null> {
    return path.posix.join(this.publicPrefix, key).replace(/\\/g, "/");
  }
}
