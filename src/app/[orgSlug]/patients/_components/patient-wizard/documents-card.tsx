import Image from "next/image";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from "@/components/ui/file-upload";
import { Switch } from "@/components/ui/switch";
import type { PatientDocumentRecord, PatientProfileRecord } from "@/lib/helpers/patient-helpers";

import { IconInfoCircle } from "@tabler/icons-react";

import { DOCUMENT_SECTIONS, type DocumentSectionType } from "./document-sections";

interface PatientDocumentsCardProps {
  documentFiles: Record<DocumentSectionType, File[]>;
  deferredUploads: Record<DocumentSectionType, boolean>;
  documentsByType: Record<DocumentSectionType, PatientDocumentRecord[]>;
  canDeleteDocuments: boolean;
  existingPatient?: PatientProfileRecord;
  documentRemovingId: string | null;
  onDeferredToggle: (type: DocumentSectionType, checked: boolean) => void;
  onFileChange: (type: DocumentSectionType, files: File[]) => void;
  onRequestRemove: (document: PatientDocumentRecord) => void;
}

export function PatientDocumentsCard({
  documentFiles,
  deferredUploads,
  documentsByType,
  canDeleteDocuments,
  existingPatient,
  documentRemovingId,
  onDeferredToggle,
  onFileChange,
  onRequestRemove,
}: PatientDocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Store ID and insurance cards securely. Files stay in LIS storage today and we can swap to
          S3 later without UI changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <IconInfoCircle className="mt-0.5 h-4 w-4" />
          <p>
            Documents are encrypted at rest and stored in the local adapter today. When we switch to
            S3, this UI stays the same and previously uploaded files stay accessible.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {DOCUMENT_SECTIONS.map((section) => {
            const Icon = section.icon;
            const files = documentFiles[section.type] ?? [];
            const deferred = deferredUploads[section.type];
            const existingDocs = documentsByType[section.type] ?? [];
            const hasExistingDocs = existingDocs.length > 0;

            return (
              <div key={section.type} className="rounded-lg border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <Icon className="h-4 w-4" /> {section.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Upload later</span>
                    <Switch
                      checked={deferred}
                      onCheckedChange={(checked) => onDeferredToggle(section.type, checked)}
                    />
                  </div>
                </div>

                {hasExistingDocs && (
                  <div className="mb-4 space-y-3">
                    {existingDocs.map((document) => {
                      const documentUrl = getDocumentPreviewUrl(document);
                      const isImageDocument =
                        Boolean(documentUrl) && isImageContentType(document.contentType);
                      return (
                        <div
                          key={document.id}
                          className="flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:flex-row sm:items-center"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            {isImageDocument && documentUrl ? (
                              <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                <Image
                                  src={documentUrl}
                                  alt={`${section.title} preview`}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xs font-semibold uppercase">
                                {getDocumentExtension(document.fileName)}
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{document.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {format(document.uploadedAt, "PPpp")} •{" "}
                                {formatFileSize(document.fileSize)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={getDocumentStatusVariant(document.status)}>
                                  {getDocumentStatusLabel(document.status)}
                                </Badge>
                                {document.uploadDeferred && (
                                  <Badge variant="outline">Deferred</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {documentUrl && (
                              <Button asChild size="sm" variant="outline">
                                <a href={documentUrl} target="_blank" rel="noreferrer">
                                  Preview
                                </a>
                              </Button>
                            )}
                            {canDeleteDocuments && existingPatient && (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => onRequestRemove(document)}
                                disabled={documentRemovingId === document.id}
                              >
                                {documentRemovingId === document.id ? "Removing..." : "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <FileUpload
                  accept="image/*,.pdf"
                  value={files}
                  maxFiles={1}
                  onValueChange={(nextFiles) => onFileChange(section.type, nextFiles)}
                  disabled={deferred}
                >
                  <FileUploadDropzone className="border-dashed">
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <p className="text-sm font-medium">Drop a file or click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or PDF up to 10MB. Only the latest upload is kept.
                      </p>
                    </div>
                  </FileUploadDropzone>

                  {files.length > 0 && (
                    <FileUploadList className="mt-4 space-y-2">
                      {files.map((file) => (
                        <FileUploadItem
                          key={`${section.type}-${file.name}-${file.lastModified}`}
                          value={file}
                          className="flex items-center gap-3 rounded-md border p-2"
                        >
                          <FileUploadItemPreview className="h-10 w-10 rounded bg-muted" />
                          <div className="flex-1">
                            <FileUploadItemMetadata>
                              <p className="truncate text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </FileUploadItemMetadata>
                          </div>
                          <FileUploadItemDelete aria-label="Remove file" />
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                  )}
                </FileUpload>

                {hasExistingDocs && !deferred && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Uploading a new file will replace the stored {section.title.toLowerCase()} after
                    you submit.
                  </p>
                )}

                {deferred && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    We&apos;ll create a pending placeholder after you submit this wizard.
                    {hasExistingDocs
                      ? " The current file will be removed when the placeholder is recorded."
                      : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytesInput: number | string) {
  const numericBytes =
    typeof bytesInput === "string" ? Number(bytesInput) : Number(bytesInput ?? 0);
  if (!numericBytes || Number.isNaN(numericBytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(numericBytes) / Math.log(1024)), units.length - 1);
  const value = numericBytes / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
}

function getDocumentPreviewUrl(document: PatientDocumentRecord) {
  const metadataUrl = (document.metadata as { url?: unknown } | null)?.url;
  if (typeof metadataUrl === "string" && metadataUrl.length > 0) {
    return metadataUrl;
  }

  if (document.storageDriver === "local" && document.storageKey) {
    return `/uploads/${document.storageKey}`.replace(/\\/g, "/");
  }

  return null;
}

function getDocumentStatusLabel(status: PatientDocumentRecord["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "uploaded":
      return "Uploaded";
    default:
      return status;
  }
}

function getDocumentStatusVariant(
  status: PatientDocumentRecord["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "uploaded":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getDocumentExtension(fileName: string) {
  const parts = fileName.split(".");
  if (parts.length <= 1) return "FILE";
  return parts.pop()?.slice(0, 4).toUpperCase() ?? "FILE";
}

function isImageContentType(contentType: string) {
  return contentType.toLowerCase().startsWith("image/");
}
