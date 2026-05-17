"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AppForm from "@/components/AppForm";
import { createNewApp } from "@/lib/storage";

export default function NewAppPage() {
    const router = useRouter();
    const newApp = createNewApp();

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
                        <h1 className="text-2xl font-bold text-gray-900">Create App</h1>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AppForm app={newApp} isEditMode={false} />
            </div>
        </div>
    );
}
