import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const item = await prisma.item.create({
      data: {
        url: data.url,
        title: data.title,
        imageUrl: data.imageUrl,
        store: data.store,
        room: data.room || 'Geral',
        cashPrice: data.cashPrice,
        installmentPrice: data.installmentPrice,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar item' }, { status: 500 });
  }
}
