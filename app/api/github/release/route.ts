import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const pat = req.headers.get('authorization')?.replace('Bearer ', '')
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO

  if (!pat) return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  if (!owner || !repo) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${slug}`,
    {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!response.ok) {
    return NextResponse.json({ error: 'Release not found' }, { status: response.status })
  }

  const data = await response.json()
  const apkAsset = data.assets?.find((a: { name: string }) => a.name.endsWith('.apk'))
  return NextResponse.json({ url: apkAsset?.browser_download_url || null })
}
