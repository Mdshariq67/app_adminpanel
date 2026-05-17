"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import AppForm from "@/components/AppForm";
import { AppConfig, getApp } from "@/lib/storage";

export default function EditAppPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [app, setApp] = useState<AppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const foundApp = getApp(id);
        if (foundApp) {
            setApp(foundApp);
        } else {
            // App not found, redirect to dashboard
            router.push("/");
        }
        setIsLoading(false);
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-500">Loading app...</p>
                </div>
            </div>
        );
    }

    if (!app) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Edit App</h1>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AppForm app={app} isEditMode={true} />
            </div>
        </div>
    );
}
