export interface StorageUploadOptions {
  path: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageUrlOptions {
  expiresInSeconds?: number;
}

export interface StorageSavedObject {
  key: string;
  url?: string | null;
  driver: string;
  metadata?: Record<string, string>;
}

export interface StorageAdapter {
  readonly name: string;
  save(
    data: Buffer | Uint8Array | ArrayBuffer,
    options: StorageUploadOptions,
  ): Promise<StorageSavedObject>;
  delete(key: string): Promise<void>;
  getUrl(key: string, options?: StorageUrlOptions): Promise<string | null>;
}
