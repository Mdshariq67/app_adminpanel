# White-Label Flutter App Builder Panel

A Next.js 14 admin panel for triggering branded Flutter APK builds directly from the browser. No backend required — all configuration lives in localStorage and GitHub PAT is stored securely in sessionStorage.

## What This Is

This panel lets you:
- **Create branded app configs** — name, logo, colors, fonts, description
- **Trigger builds** — GitHub Actions workflow dispatches on command
- **Track build status** — real-time polling of workflow run status
- **Download APKs** — direct links once builds succeed

Perfect for multi-tenant scenarios like:
- City Library
- BookNest
- ReadMore

Each is a separate branded APK from the same Flutter codebase.

## Setup: Flutter Repository Requirements

Your Flutter repo should have a GitHub Actions workflow at `.github/workflows/build-apk.yml` that:

1. Accepts workflow dispatch inputs:
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         app_name:
           description: 'App name'
           required: true
         app_slug:
           description: 'App slug (used as release tag)'
           required: true
         description:
           description: 'App description'
           required: true
         primary_color:
           description: 'Primary color hex (e.g., #2563eb)'
           required: true
         secondary_color:
           description: 'Secondary color hex'
           required: true
         accent_color:
           description: 'Accent color hex'
           required: true
         font_family:
           description: 'Font family (Poppins, Roboto, Lato, Montserrat, Nunito)'
           required: true
         logo_url:
           description: 'Public URL to app logo'
           required: true
         version_name:
           description: 'Version name (e.g., 1.0.0)'
           required: true
         version_code:
           description: 'Version code (integer)'
           required: true
   ```

2. Build the APK with the provided config (branding-only changes)

3. Create/update a GitHub Release with:
   - Tag: `{app_slug}`
   - Upload the APK as an asset
   - Delete old releases with the same tag before creating new one

Example workflow structure:
```yaml
- name: Build APK
  run: |
    # Apply branding (name, colors, fonts, logo)
    # Build APK with flutter build apk

- name: Upload Release
  uses: actions/create-release@v1
  with:
    tag_name: ${{ github.event.inputs.app_slug }}
    # Attach APK as asset
```

## Setup: GitHub Secrets Required

Add these secrets to your Flutter repo for the workflow to access resources:

- `KEYSTORE_BASE64` — base64-encoded Android keystore for signing APKs
- `KEYSTORE_PASSWORD` — keystore password
- `KEY_ALIAS` — key alias in keystore
- `KEY_PASSWORD` — key password

These are used by the workflow to sign APKs during the build.

## Setup: Admin Panel Local Development

1. Clone this repo:
   ```bash
   git clone <this-repo>
   cd whitelabel-admin
   npm install
   ```

2. Copy and configure `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```
   NEXT_PUBLIC_GITHUB_OWNER=your_github_username
   NEXT_PUBLIC_GITHUB_REPO=your_flutter_repo_name
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Setup: Deploy to Vercel

1. Push this repo to GitHub

2. Import project to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Connect your GitHub repo
   - Click Import

3. Add environment variables in Vercel project settings:
   ```
   NEXT_PUBLIC_GITHUB_OWNER=your_github_username
   NEXT_PUBLIC_GITHUB_REPO=your_flutter_repo_name
   ```

4. Deploy — Vercel will auto-deploy on push to main

## How to Use

### 1. Create a New App

1. Click **New App** button
2. Enter app name (e.g., "City Library")
3. Configure:
   - **Logo URL** — public image URL
   - **Colors** — primary, secondary, accent
   - **Font** — Poppins, Roboto, Lato, Montserrat, or Nunito
   - **Description** — max 80 chars
   - **Version** — name and code
4. Live preview updates as you type
5. Click **Create APK** to trigger build

### 2. Connect GitHub PAT

First time only:

1. Generate a **Personal Access Token** on GitHub:
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it `repo` scope (full repo access)
   - Copy the token

2. In the admin panel:
   - Paste the token in the top input
   - Click **Connect**
   - Token is stored only in this browser session (sessionStorage)

### 3. Track Build Status

Once a build is triggered:
- Panel polls GitHub Actions every 8 seconds
- Status updates: Queued → Building → Ready or Failed
- Automatically fetches APK download link on success

### 4. Download APK

When build status is **Ready**:
- Click **Download APK** button
- APK opens in a new tab

### 5. Rebuild an App

To create a new version:
1. Click **Edit & Rebuild** on an app card
2. Bump the version code (auto-increments by default)
3. Click **Rebuild APK**
4. Workflow will replace the old release tag with new APK

## Architecture

### Frontend (This Repo)

- **lib/github.ts** — GitHub API calls (dispatch, status, release)
- **lib/storage.ts** — localStorage for app configs
- **components/AppForm.tsx** — shared form for new/edit with live preview
- **app/page.tsx** — dashboard listing all apps

### Storage

- **localStorage** — persistent app configs
- **sessionStorage** — GitHub PAT (cleared on browser close)

### No Backend Required

- All GitHub API calls made directly from browser
- CORS headers configured in next.config.ts
- PAT never leaves user's session

## Security Notes

- **PAT handling**: Token is entered by user, stored only in sessionStorage, never sent to any server
- **CORS**: Panel can directly call GitHub API (authenticated calls allowed)
- **CSP headers**: Content Security Policy allows GitHub API + Google Fonts + image URLs
- **No server validation**: Each user provides their own PAT

## Troubleshooting

### "Invalid token or repository not found"

- Verify GitHub username and repo name in `.env.local`
- Ensure PAT has `repo` scope
- Check that repo is public or you have access

### Build triggered but status stuck on "Queued"

- GitHub Actions queue might be long
- Verify workflow file exists at `.github/workflows/build-apk.yml`
- Check GitHub Actions tab in your repo for errors

### Can't download APK after build succeeds

- Verify release was created with tag matching `app_slug`
- Ensure APK asset is named `*.apk`
- Check GitHub releases tab manually

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GITHUB_OWNER` | Yes | GitHub username or org |
| `NEXT_PUBLIC_GITHUB_REPO` | Yes | Flutter repo name |

These are public (prefixed with `NEXT_PUBLIC_`) — they're visible in frontend code.

## Stack

- **Next.js 14** — React framework with App Router
- **TypeScript** — type safety
- **Tailwind CSS** — styling
- **shadcn/ui** — pre-built components (Button, Input, Card, Select, Badge)
- **sonner** — toast notifications
- **lucide-react** — icons
- **uuid** — unique app IDs
- **Fetch API** — GitHub API calls

## License

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
