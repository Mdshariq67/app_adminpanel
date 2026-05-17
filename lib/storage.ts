/**
 * localStorage management for app configurations
 */

import { v4 as uuidv4 } from "uuid";

export type BuildStatus = "idle" | "queued" | "in_progress" | "success" | "failure";
export type FontFamily = "Poppins" | "Roboto" | "Lato" | "Montserrat" | "Nunito";

export interface AppConfig {
    id: string;
    name: string;
    slug: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: FontFamily;
    logoUrl: string;
    versionName: string;
    versionCode: number;
    lastRunId: string | null;
    lastBuildStatus: BuildStatus;
    lastApkUrl: string | null;
    lastBuiltAt: string | null;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = "whitelabel_apps";

export function getAllApps(): AppConfig[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function getApp(id: string): AppConfig | null {
    const apps = getAllApps();
    return apps.find((app) => app.id === id) || null;
}

export function saveApp(app: AppConfig): void {
    if (typeof window === "undefined") return;

    const apps = getAllApps();
    const existingIndex = apps.findIndex((a) => a.id === app.id);

    const now = new Date().toISOString();
    const appToSave = {
        ...app,
        updatedAt: now,
    };

    if (existingIndex >= 0) {
        apps[existingIndex] = appToSave;
    } else {
        appToSave.createdAt = now;
        apps.push(appToSave);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function deleteApp(id: string): void {
    if (typeof window === "undefined") return;

    const apps = getAllApps();
    const filtered = apps.filter((app) => app.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const apps = getAllApps();
    const existingSlugs = new Set(apps.map((app) => app.slug));

    if (!existingSlugs.has(baseSlug)) {
        return baseSlug;
    }

    let counter = 2;
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
        counter++;
    }

    return `${baseSlug}-${counter}`;
}

export function createNewApp(overrides: Partial<AppConfig> = {}): AppConfig {
    const now = new Date().toISOString();

    return {
        id: uuidv4(),
        name: "",
        slug: "",
        description: "",
        primaryColor: "#2563eb",
        secondaryColor: "#64748b",
        accentColor: "#ec4899",
        fontFamily: "Poppins",
        logoUrl: "",
        versionName: "1.0.0",
        versionCode: 1,
        lastRunId: null,
        lastBuildStatus: "idle",
        lastApkUrl: null,
        lastBuiltAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}
