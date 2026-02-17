import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy PDF from a URL and return it with Content-Disposition: inline
 * so the browser displays it in an iframe instead of downloading.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'application/pdf';
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[document-preview]', e);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 502 });
  }
}
