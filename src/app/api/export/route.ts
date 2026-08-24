import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany();
    return new NextResponse(JSON.stringify(items, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="coisas_casa_export.json"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 });
  }
}
