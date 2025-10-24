import type { ReactElement } from "react";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.resend.apiKey);

interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail({ from = env.resend.fromEmail, ...options }: SendEmailOptions) {
  console.log("Sending email with options:", { from, ...options });
  if (!from) {
    throw new Error("No from email configured for Resend");
  }

  const { error } = await resend.emails.send({
    ...options,
    from,
  });

  if (error) {
    throw error;
  }
}
