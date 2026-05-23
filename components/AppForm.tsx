"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { AppConfig, generateSlug, saveApp, FontFamily } from "@/lib/storage";
import { triggerBuild } from "@/lib/github";
import { toast } from "sonner";
import PhoneShell from "@/components/preview/PhoneShell";

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
        async (e: React.FormEvent<HTMLFormElement>) => {
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
                let configToSubmit = { ...formData };
                if (isEditMode) {
                    configToSubmit = {
                        ...configToSubmit,
                        versionCode: formData.versionCode + 1,
                    };
                }

                const appToSave = {
                    ...configToSubmit,
                    lastBuildStatus: "queued" as const,
                };
                saveApp(appToSave);

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

    // Rebuild preview URL whenever branding fields change.
    // key={previewUrl} on the iframe causes React to remount it on every change.
    const previewUrl = useMemo(() => {
        const params = new URLSearchParams({
            primary: formData.primaryColor.replace("#", ""),
            secondary: formData.secondaryColor.replace("#", ""),
            accent: formData.accentColor.replace("#", ""),
            appName: formData.name || "My App",
            description: formData.description || "",
            fontFamily: formData.fontFamily || "Poppins",
            screen: "home",
            mode: "preview",
        });
        return `/preview?${params.toString()}`;
    }, [
        formData.primaryColor,
        formData.secondaryColor,
        formData.accentColor,
        formData.name,
        formData.description,
        formData.fontFamily,
    ]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel — Form */}
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

                    {/* Submit */}
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

            {/* Right Panel — Live Preview (sticky) */}
            <div className="hidden lg:block">
                <div style={{
                    position: "sticky",
                    top: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                }}>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0, fontWeight: 500 }}>
                        Live Preview
                    </p>

                    <PhoneShell width={280} height={560}>
                        <iframe
                            key={previewUrl}
                            src={previewUrl}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            title="App Preview"
                        />
                    </PhoneShell>

                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, textAlign: "center" }}>
                        Preview updates as you change settings
                    </p>
                </div>
            </div>
        </div>
    );
}
