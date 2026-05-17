"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import PATInput from "@/components/PATInput";
import AppCard from "@/components/AppCard";
import { AppConfig, getAllApps } from "@/lib/storage";

export default function Dashboard() {
  const router = useRouter();
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load apps on mount
    setApps(getAllApps());
    setIsLoading(false);

    // Listen for storage changes (multi-tab sync)
    const handleStorageChange = () => {
      setApps(getAllApps());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleAppDeleted = () => {
    setApps(getAllApps());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PAT Input Bar */}
      <PATInput />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Apps</h1>
            <Badge variant="secondary" className="mt-2">
              {apps.length} {apps.length === 1 ? "app" : "apps"}
            </Badge>
          </div>
          <Button
            onClick={() => router.push("/apps/new")}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            New App
          </Button>
        </div>

        {/* Apps Grid or Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mx-auto mb-4" />
              <p className="text-gray-500">Loading apps...</p>
            </div>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m0 0h6M6 12h6m0 0H6"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No apps yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first branded app to get started
              </p>
              <Button onClick={() => router.push("/apps/new")}>
                Create App
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} onDelete={handleAppDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
