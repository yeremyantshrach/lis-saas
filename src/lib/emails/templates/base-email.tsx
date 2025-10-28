import { Body, Container, Head, Html, Preview, Tailwind } from "@react-email/components";
import type { PropsWithChildren } from "react";

interface BaseEmailProps {
  previewText?: string;
}

export default function BaseEmail({ previewText, children }: PropsWithChildren<BaseEmailProps>) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#0F172A",
                accent: "#2563EB",
              },
            },
          },
        }}
      >
        <Body className="bg-slate-50 font-sans text-slate-800">
          <Container className="mx-auto my-8 w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
