
import React from "react";
import { Toaster as SonnerToaster } from "sonner";

// Replace the shadcn toaster with sonner's toaster
export function Toaster() {
  return <SonnerToaster position="top-right" richColors closeButton />;
}
