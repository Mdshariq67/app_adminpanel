"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { AppConfig, generateSlug, saveApp, FontFamily } from "@/lib/storage";
import { triggerBuild } from "@/lib/github";
import { toast } from "sonner";

interface AppFormProps {
    app?: AppConfig;
    isEditMode?: boolean;
}

const FONT_FAMILIES: FontFamily[] = [
    "Poppins",
    "Roboto",
    "Lato",
    "Montserrat",
    "Nunito",
];

export default function AppForm({ app, isEditMode = false }: AppFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<AppConfig>(
        app || {
            id: "",
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    );

    const [isLoading, setIsLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [hasPAT, setHasPAT] = useState(false);

    // Check if PAT is available on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasPAT(!!sessionStorage.getItem("github_pat"));
        }
    }, []);
    useEffect(() => {
        if (!isEditMode && formData.name) {
            const newSlug = generateSlug(formData.name);
            setFormData((prev) => ({ ...prev, slug: newSlug }));
        }
    }, [formData.name, isEditMode]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, name: e.target.value }));
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, slug: e.target.value }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value.slice(0, 80);
        setFormData((prev) => ({ ...prev, description: value }));
    };

    const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLogoError(false);
        setFormData((prev) => ({ ...prev, logoUrl: e.target.value }));
    };

    const handleColorChange = (
        field: "primaryColor" | "secondaryColor" | "accentColor",
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFontChange = (value: FontFamily) => {
        setFormData((prev) => ({ ...prev, fontFamily: value }));
    };

    const handleVersionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, versionName: e.target.value }));
    };

    const handleVersionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10) || 1;
        setFormData((prev) => ({ ...prev, versionCode: Math.max(1, value) }));
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!formData.name.trim()) {
                toast.error("App name is required");
                return;
            }

            if (typeof window === "undefined") {
                toast.error("This action requires a browser environment");
                return;
            }

            const pat = sessionStorage.getItem("github_pat");
            if (!pat) {
                toast.error("Connect your GitHub PAT above to build");
                return;
            }

            setIsLoading(true);

            try {
                // Update version code if in edit mode
                let configToSubmit = { ...formData };
                if (isEditMode) {
                    configToSubmit = {
                        ...configToSubmit,
                        versionCode: formData.versionCode + 1,
                    };
                }

                // Save app to localStorage with queued status
                const appToSave = {
                    ...configToSubmit,
                    lastBuildStatus: "queued" as const,
                };
                saveApp(appToSave);

                // Trigger build
                const runId = await triggerBuild(pat, {
                    app_name: configToSubmit.name,
                    app_slug: configToSubmit.slug,
                    description: configToSubmit.description,
                    primary_color: configToSubmit.primaryColor,
                    secondary_color: configToSubmit.secondaryColor,
                    accent_color: configToSubmit.accentColor,
                    font_family: configToSubmit.fontFamily,
                    logo_url: configToSubmit.logoUrl,
                    version_name: configToSubmit.versionName,
                    version_code: isEditMode
                        ? formData.versionCode + 1
                        : configToSubmit.versionCode,
                });

                // Save run ID
                const finalApp = {
                    ...appToSave,
                    lastRunId: runId.toString(),
                };
                saveApp(finalApp);

                toast.success(`Build triggered for ${configToSubmit.name}`);
                router.push("/");
            } catch (err) {
                const errorMsg =
                    err instanceof Error ? err.message : "Failed to trigger build";
                toast.error(errorMsg);
            } finally {
                setIsLoading(false);
            }
        },
        [formData, isEditMode, router]
    );

    // Generate dynamic font import URL
    const fontImportUrl = `https://fonts.googleapis.com/css2?family=${formData.fontFamily.replace(
        / /g,
        "+"
    )}:wght@400;600&display=swap`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel - Form */}
            <div className="lg:col-span-2 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* App Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            App Name *
                        </label>
                        <Input
                            type="text"
                            placeholder="City Library"
                            value={formData.name}
                            onChange={handleNameChange}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* App Slug */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            App Slug
                        </label>
                        <Input
                            type="text"
                            placeholder="city-library"
                            value={formData.slug}
                            onChange={handleSlugChange}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Release tag on GitHub
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <span className="text-xs text-gray-500">
                                {formData.description.length}/80
                            </span>
                        </div>
                        <textarea
                            placeholder="Your app's tagline"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none h-20"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Shown as subtitle on the app's home screen
                        </p>
                    </div>

                    {/* Logo URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Logo URL
                        </label>
                        <Input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={formData.logoUrl}
                            onChange={handleLogoUrlChange}
                            disabled={isLoading}
                        />
                        {formData.logoUrl && (
                            <div className="mt-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={formData.logoUrl}
                                        alt="Logo preview"
                                        className="w-full h-full object-cover"
                                        onError={() => setLogoError(true)}
                                        onLoad={() => setLogoError(false)}
                                    />
                                    {logoError && (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <AlertCircle className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-3 gap-4">
                        {(["primaryColor", "secondaryColor", "accentColor"] as const).map(
                            (field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {field === "primaryColor"
                                            ? "Primary Color"
                                            : field === "secondaryColor"
                                                ? "Secondary Color"
                                                : "Accent Color"}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData[field]}
                                            onChange={(e) =>
                                                handleColorChange(field, e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={formData[field]}
                                            onChange={(e) =>
                                                handleColorChange(field, e.target.value)
                                            }
                                            disabled={isLoading}
                                            className="flex-1 font-mono text-sm"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Font Family */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Font Family
                        </label>
                        <Select
                            value={formData.fontFamily}
                            onValueChange={handleFontChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FONT_FAMILIES.map((font) => (
                                    <SelectItem key={font} value={font}>
                                        {font}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm font-medium">
                            <span style={{ fontFamily: formData.fontFamily }}>
                                {formData.fontFamily}
                            </span>
                        </div>
                    </div>

                    {/* Version Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Version Name
                        </label>
                        <Input
                            type="text"
                            value={formData.versionName}
                            onChange={handleVersionNameChange}
                            disabled={isLoading}
                            placeholder="1.0.0"
                        />
                    </div>

                    {/* Version Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Version Code
                        </label>
                        <Input
                            type="number"
                            value={formData.versionCode}
                            onChange={handleVersionCodeChange}
                            disabled={isLoading}
                            min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Increment this for each new build
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={isLoading || !hasPAT}
                            className="w-full gap-2"
                            size="lg"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading
                                ? "Triggering build..."
                                : isEditMode
                                    ? "Rebuild APK"
                                    : "Create APK"}
                        </Button>
                        {!hasPAT && (
                            <p className="text-sm text-gray-600 mt-3 text-center">
                                Connect your GitHub PAT above to build
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto">
                <div className="bg-gray-100 p-4 rounded-lg h-full">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>

                    {/* Phone Frame */}
                    <style>{`@import url('${fontImportUrl}');`}</style>

                    <div className="mx-auto max-w-xs">
                        {/* Status Bar */}
                        <div
                            className="h-6 flex items-center px-4 text-white text-xs font-semibold rounded-t-3xl"
                            style={{ backgroundColor: formData.primaryColor }}
                        >
                            9:41
                        </div>

                        {/* Phone Body */}
                        <div className="bg-white border-8 border-gray-800 rounded-3xl shadow-lg overflow-hidden">
                            {/* Header */}
                            <div
                                className="px-4 py-3 flex items-center gap-3"
                                style={{ backgroundColor: formData.primaryColor }}
                            >
                                {formData.logoUrl && (
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <img
                                            src={formData.logoUrl}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                            onError={() => { }}
                                        />
                                    </div>
                                )}
                                <h1 className="text-white font-bold text-lg flex-1 truncate">
                                    {formData.name || "App Name"}
                                </h1>
                            </div>

                            {/* Description */}
                            <div
                                className="px-4 py-2 text-sm"
                                style={{ color: formData.secondaryColor }}
                            >
                                {formData.description || "App description"}
                            </div>

                            {/* Content Items */}
                            <div className="px-4 py-4 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="p-3 bg-gray-50 rounded border-l-4"
                                        style={{
                                            borderColor: formData.primaryColor,
                                            fontFamily: formData.fontFamily,
                                        }}
                                    >
                                        <div className="text-sm font-semibold text-gray-900">
                                            Item {i}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Tap to view details
                                        </div>
                                        <button
                                            className="text-xs font-semibold mt-2 px-2 py-1 rounded"
                                            style={{
                                                color: formData.accentColor,
                                                backgroundColor: `${formData.accentColor}15`,
                                            }}
                                        >
                                            View →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
