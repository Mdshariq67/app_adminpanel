import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const pat = req.headers.get('authorization')?.replace('Bearer ', '')
  const { searchParams } = new URL(req.url)
  const runId = searchParams.get('runId')
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO

  if (!pat) return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
  if (!owner || !repo) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
    {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json({
    id: data.id,
    status: data.status,
    conclusion: data.conclusion,
    html_url: data.html_url,
  })
}
