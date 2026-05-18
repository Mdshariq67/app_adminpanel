"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Download,
    Edit3,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { AppConfig, BuildStatus, saveApp, deleteApp } from "@/lib/storage";
import { getBuildStatus, getReleaseUrl } from "@/lib/github";
import { toast } from "sonner";

interface AppCardProps {
    app: AppConfig;
    onDelete?: () => void;
}

const STATUS_CONFIG: Record<BuildStatus, { color: string; textColor: string; label: string; icon?: any }> = {
    idle: { color: "bg-gray-100", textColor: "text-gray-700", label: "Not built" },
    queued: {
        color: "bg-yellow-100",
        textColor: "text-yellow-700",
        label: "Queued",
    },
    in_progress: {
        color: "bg-blue-100",
        textColor: "text-blue-700",
        label: "Building...",
        icon: Loader2,
    },
    success: {
        color: "bg-green-100",
        textColor: "text-green-700",
        label: "Ready",
    },
    failure: {
        color: "bg-red-100",
        textColor: "text-red-700",
        label: "Failed",
    },
};

export default function AppCard({ app, onDelete }: AppCardProps) {
    const router = useRouter();
    const [appState, setAppState] = useState<AppConfig>(app);
    const [isDeleting, setIsDeleting] = useState(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Poll build status
    useEffect(() => {
        const shouldPoll =
            appState.lastBuildStatus === "queued" ||
            appState.lastBuildStatus === "in_progress";

        if (!shouldPoll) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            return;
        }

        const pat = sessionStorage.getItem("github_pat");
        if (!pat || !appState.lastRunId) return;

        const runId = parseInt(appState.lastRunId);
        const slug = appState.slug;

        const checkStatus = async () => {
            try {
                const status = await getBuildStatus(pat, runId);

                const newBuildStatus: BuildStatus =
                    status.status === "completed"
                        ? status.conclusion === "success"
                            ? "success"
                            : "failure"
                        : (status.status as BuildStatus);

                setAppState((prev) => {
                    if (prev.lastBuildStatus === newBuildStatus) return prev;
                    const updated = {
                        ...prev,
                        lastBuildStatus: newBuildStatus,
                        lastBuiltAt:
                            newBuildStatus === "success"
                                ? new Date().toISOString()
                                : prev.lastBuiltAt,
                    };
                    saveApp(updated);
                    return updated;
                });

                if (newBuildStatus === "success") {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    try {
                        const apkUrl = await getReleaseUrl(pat, slug);
                        setAppState((prev) => {
                            const updated = { ...prev, lastApkUrl: apkUrl };
                            saveApp(updated);
                            return updated;
                        });
                    } catch (err) {
                        console.error("Failed to get release URL:", err);
                    }
                } else if (newBuildStatus === "failure") {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                }
            } catch (err) {
                console.error("Failed to check build status:", err);
            }
        };

        checkStatus();
        pollIntervalRef.current = setInterval(checkStatus, 8000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appState.lastBuildStatus, appState.lastRunId]);

    const handleDelete = useCallback(async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${appState.name}"? This cannot be undone.`
            )
        ) {
            return;
        }

        setIsDeleting(true);
        try {
            deleteApp(appState.id);
            toast.success(`${appState.name} deleted`);
            onDelete?.();
        } catch (err) {
            toast.error("Failed to delete app");
        } finally {
            setIsDeleting(false);
        }
    }, [appState, onDelete]);

    const handleDownload = () => {
        if (appState.lastApkUrl) {
            window.open(appState.lastApkUrl, "_blank");
        }
    };

    const handleEdit = () => {
        router.push(`/apps/${appState.id}/edit`);
    };

    const statusConfig = STATUS_CONFIG[appState.lastBuildStatus];
    const StatusIcon = statusConfig.icon;

    // Get initials for logo fallback
    const initials = appState.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
                {/* Logo + Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                            {appState.logoUrl ? (
                                <img
                                    src={appState.logoUrl}
                                    alt={appState.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                                {appState.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">{appState.slug}</p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-1">
                    {appState.description || "No description"}
                </p>

                {/* Colors + Font */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="flex gap-2">
                        <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: appState.primaryColor }}
                            title="Primary"
                        />
                        <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: appState.secondaryColor }}
                            title="Secondary"
                        />
                        <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: appState.accentColor }}
                            title="Accent"
                        />
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                        {appState.fontFamily}
                    </Badge>
                </div>

                {/* Status */}
                <div className="mb-4">
                    <div
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusConfig.color} ${statusConfig.textColor}`}
                    >
                        {StatusIcon && (
                            <StatusIcon
                                className={`w-4 h-4 ${appState.lastBuildStatus === "in_progress"
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />
                        )}
                        {appState.lastBuildStatus === "failure" && !StatusIcon && (
                            <AlertCircle className="w-4 h-4" />
                        )}
                        {appState.lastBuildStatus === "success" && !StatusIcon && (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        {statusConfig.label}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {appState.lastBuildStatus === "success" && appState.lastApkUrl && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleDownload}
                            className="flex-1 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download APK
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant={
                            appState.lastBuildStatus === "success" ? "outline" : "default"
                        }
                        onClick={handleEdit}
                        className="flex-1 gap-2"
                    >
                        <Edit3 className="w-4 h-4" />
                        {appState.lastBuildStatus === "success" ? "Rebuild" : "Edit"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
