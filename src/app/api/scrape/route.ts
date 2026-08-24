import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const data = await scrapeUrl(url);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erro no scraping' }, { status: 500 });
  }
}
