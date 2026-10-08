import { NextResponse } from 'next/server';
import { exportReadingsAsCSV } from '@/lib/offline-storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  if (format !== 'csv') {
    return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 });
  }

  try {
    const csv = await exportReadingsAsCSV();

    if (!csv) {
      return NextResponse.json({ error: 'No readings to export' }, { status: 404 });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="grain-readings-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
