import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  redirectUrl?: string;
  errors?: Record<string, string[]>;
};

export function createSuccessResult<T>(
  data?: T,
  message?: string,
  redirectUrl?: string,
): ActionResult<T> {
  return {
    success: true,
    ...(data && { data }),
    ...(message && { message }),
    ...(redirectUrl && { redirectUrl }),
  };
}

export function createErrorResult(error: string, errors?: Record<string, string[]>): ActionResult {
  return {
    success: false,
    error,
    ...(errors && { errors }),
  };
}

export function revalidateOrgPaths(orgSlug?: string) {
  if (orgSlug) {
    revalidatePath(`/${orgSlug}/dashboard`, "page");
    revalidatePath(`/${orgSlug}/labs`, "page");
  } else {
    revalidatePath("/[orgSlug]/dashboard", "page");
    revalidatePath("/[orgSlug]/labs", "page");
  }
}

export function handleActionError(error: unknown): ActionResult {
  if (error instanceof Error) {
    return createErrorResult(error.message);
  }
  return createErrorResult("An unexpected error occurred");
}
