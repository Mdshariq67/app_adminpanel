export interface GitHubBuildInput {
    app_name: string;
    app_slug: string;
    description: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    logo_url: string;
    version_name: string;
    version_code: number;
}

export interface BuildRunInfo {
    id: number;
    status: "queued" | "in_progress" | "completed";
    conclusion: "success" | "failure" | "cancelled" | null;
    html_url: string;
}

const authHeader = (pat: string) => ({ Authorization: `Bearer ${pat}` });

export async function validatePAT(pat: string): Promise<boolean> {
    try {
        const res = await fetch('/api/github/validate', {
            headers: authHeader(pat),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function triggerBuild(
    pat: string,
    config: GitHubBuildInput
): Promise<number> {
    const res = await fetch('/api/github/trigger', {
        method: 'POST',
        headers: {
            ...authHeader(pat),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: {
                app_name: config.app_name,
                app_slug: config.app_slug,
                description: config.description,
                primary_color: config.primary_color,
                secondary_color: config.secondary_color,
                accent_color: config.accent_color,
                font_family: config.font_family,
                logo_url: config.logo_url,
                version_name: config.version_name,
                version_code: String(config.version_code),
            },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to trigger build: ${res.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    return findLatestRun(pat, config.app_slug);
}

export async function findLatestRun(
    pat: string,
    _appSlug: string
): Promise<number> {
    const res = await fetch('/api/github/runs', {
        headers: authHeader(pat),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch runs: ${res.status}`);
    }

    const data = await res.json();
    const runs: Array<{ id: number; created_at: string }> = data.runs || [];

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    for (const run of runs) {
        if (new Date(run.created_at) >= twoMinutesAgo) {
            return run.id;
        }
    }

    throw new Error('Could not find recent workflow run');
}

export async function getBuildStatus(
    pat: string,
    runId: number
): Promise<BuildRunInfo> {
    const res = await fetch(`/api/github/status?runId=${runId}`, {
        headers: authHeader(pat),
    });

    if (!res.ok) {
        throw new Error(`Failed to get build status: ${res.status}`);
    }

    return res.json();
}

export async function getReleaseUrl(
    pat: string,
    appSlug: string
): Promise<string> {
    const res = await fetch(`/api/github/release?slug=${appSlug}`, {
        headers: authHeader(pat),
    });

    if (!res.ok) {
        throw new Error(`Failed to get release: ${res.status}`);
    }

    const data = await res.json();
    if (!data.url) throw new Error('No APK asset found in release');
    return data.url;
}
