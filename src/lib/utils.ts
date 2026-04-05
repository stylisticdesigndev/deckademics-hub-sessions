import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateUS = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy");
};

export const formatDateTimeUS = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MM/dd/yyyy h:mm a");
};
