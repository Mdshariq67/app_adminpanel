"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { validatePAT } from "@/lib/github";

export default function PATInput() {
    const [pat, setPat] = useState<string>("");
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    useEffect(() => {
        // Check if PAT is already in sessionStorage on mount
        const storedPat = sessionStorage.getItem("github_pat");
        if (storedPat) {
            setIsConnected(true);
            setPat(storedPat);
        }
    }, []);

    const handleConnect = async () => {
        if (!pat.trim()) {
            setError("Please enter a PAT");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const isValid = await validatePAT(pat);
            if (isValid) {
                sessionStorage.setItem("github_pat", pat);
                setIsConnected(true);
                setPat("");
            } else {
                setError("Invalid token or repository not found");
            }
        } catch (err) {
            setError("Invalid token or repository not found");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        sessionStorage.removeItem("github_pat");
        setIsConnected(false);
        setPat("");
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleConnect();
        }
    };

    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        {isConnected ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-gray-700">
                                        Connected to{" "}
                                        <span className="font-semibold">
                                            {owner}/{repo}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="password"
                                    placeholder="Paste your GitHub Personal Access Token..."
                                    value={pat}
                                    onChange={(e) => {
                                        setPat(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className="max-w-sm"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleConnect}
                                    disabled={isLoading || !pat.trim()}
                                    size="sm"
                                >
                                    {isLoading ? "Connecting..." : "Connect"}
                                </Button>
                                {error && (
                                    <div className="flex items-center gap-1 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isConnected && (
                        <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </Button>
                    )}
                </div>

                <p className="text-xs text-gray-500 mt-3">
                    ℹ️ Your PAT is only stored in this browser session and sent directly
                    to GitHub. Never stored on any server.
                </p>
            </div>
        </div>
    );
}
