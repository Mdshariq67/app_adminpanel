/**
 * GitHub API integration for triggering Flutter APK builds
 */

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

const getGithubHeaders = (pat: string) => ({
    "Authorization": `Bearer ${pat}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "Accept": "application/vnd.github+json",
});

export async function triggerBuild(
    pat: string,
    config: GitHubBuildInput
): Promise<number> {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    if (!owner || !repo) {
        throw new Error("GitHub owner or repo not configured");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build-apk.yml/dispatches`;

    const response = await fetch(url, {
        method: "POST",
        headers: getGithubHeaders(pat),
        body: JSON.stringify({
            ref: "main",
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

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Failed to trigger build: ${response.status} ${error}`
        );
    }

    // Wait 3 seconds then find the latest run
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const runId = await findLatestRun(pat, config.app_slug);

    return runId;
}

export async function findLatestRun(
    pat: string,
    appSlug: string
): Promise<number> {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    if (!owner || !repo) {
        throw new Error("GitHub owner or repo not configured");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?event=workflow_dispatch&per_page=10`;

    const response = await fetch(url, {
        method: "GET",
        headers: getGithubHeaders(pat),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.status}`);
    }

    const data = await response.json();
    const runs = data.workflow_runs || [];

    // Find the most recent run created within the last 2 minutes
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    for (const run of runs) {
        const createdAt = new Date(run.created_at);
        if (createdAt >= twoMinutesAgo) {
            return run.id;
        }
    }

    throw new Error("Could not find recent workflow run");
}

export async function getBuildStatus(
    pat: string,
    runId: number
): Promise<BuildRunInfo> {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    if (!owner || !repo) {
        throw new Error("GitHub owner or repo not configured");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: getGithubHeaders(pat),
    });

    if (!response.ok) {
        throw new Error(`Failed to get build status: ${response.status}`);
    }

    const data = await response.json();

    return {
        id: data.id,
        status: data.status,
        conclusion: data.conclusion,
        html_url: data.html_url,
    };
}

export async function getReleaseUrl(
    pat: string,
    appSlug: string
): Promise<string> {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    if (!owner || !repo) {
        throw new Error("GitHub owner or repo not configured");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${appSlug}`;

    const response = await fetch(url, {
        method: "GET",
        headers: getGithubHeaders(pat),
    });

    if (!response.ok) {
        throw new Error(`Failed to get release: ${response.status}`);
    }

    const data = await response.json();
    const assets = data.assets || [];

    const apkAsset = assets.find((asset: any) => asset.name.endsWith(".apk"));
    if (!apkAsset) {
        throw new Error("No APK asset found in release");
    }

    return apkAsset.browser_download_url;
}

export async function validatePAT(pat: string): Promise<boolean> {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

    if (!owner || !repo) {
        throw new Error("GitHub owner or repo not configured");
    }

    const url = `https://api.github.com/repos/${owner}/${repo}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: getGithubHeaders(pat),
        });

        return response.ok;
    } catch {
        return false;
    }
}
