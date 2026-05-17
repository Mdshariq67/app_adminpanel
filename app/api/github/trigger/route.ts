import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const pat = req.headers.get('authorization')?.replace('Bearer ', '')
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO

  if (!pat) return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  if (!owner || !repo) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const body = await req.json()

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build-apk.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json({ error }, { status: response.status })
  }

  return NextResponse.json({ success: true })
}
