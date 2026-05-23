import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    collection,
    getDocs,
    orderBy,
    query,
    limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UiConfig } from "@/lib/types/ui-config.types";

export async function saveUiConfig(appSlug: string, config: UiConfig): Promise<void> {
    const now = new Date().toISOString();
    const configWithTimestamp = { ...config, updatedAt: now };

    await setDoc(doc(db, "ui_configs", appSlug), configWithTimestamp);

    // Save version snapshot
    await setDoc(
        doc(db, "ui_configs", appSlug, "versions", String(Date.now())),
        configWithTimestamp
    );
}

export async function getUiConfig(appSlug: string): Promise<UiConfig | null> {
    const snap = await getDoc(doc(db, "ui_configs", appSlug));
    if (!snap.exists()) return null;
    return snap.data() as UiConfig;
}

export function subscribeToUiConfig(
    appSlug: string,
    callback: (config: UiConfig | null) => void
): () => void {
    return onSnapshot(doc(db, "ui_configs", appSlug), (snap) => {
        callback(snap.exists() ? (snap.data() as UiConfig) : null);
    });
}

export interface VersionEntry {
    timestamp: string;
    config: UiConfig;
}

export async function getVersionHistory(appSlug: string): Promise<VersionEntry[]> {
    const q = query(
        collection(db, "ui_configs", appSlug, "versions"),
        orderBy("updatedAt", "desc"),
        limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
        timestamp: d.id,
        config: d.data() as UiConfig,
    }));
}
