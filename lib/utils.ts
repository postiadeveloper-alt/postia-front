import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getImageUrl(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Remove /api from base URL to get root
    const baseUrl = API_BASE_URL.replace('/api', '');

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
