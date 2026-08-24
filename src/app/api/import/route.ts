import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const items = await req.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }
    
    await prisma.item.deleteMany();
    
    const mapped = items.map((item: any) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      imageUrl: item.imageUrl,
      store: item.store,
      room: item.room || 'Geral',
      cashPrice: item.cashPrice,
      installmentPrice: item.installmentPrice,
      createdAt: new Date(item.createdAt || new Date()),
      updatedAt: new Date(item.updatedAt || new Date()),
    }));

    await prisma.item.createMany({
      data: mapped
    });

    return NextResponse.json({ success: true, count: mapped.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao importar' }, { status: 500 });
  }
}
