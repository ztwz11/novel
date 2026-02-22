import { NextRequest, NextResponse } from 'next/server';
import { exportToTxt, exportToHtml, exportToEpub } from '@/lib/export/exporter';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const format = req.nextUrl.searchParams.get('format') || 'txt';

    try {
        if (format === 'txt') {
            const txt = exportToTxt(projectId);
            return new NextResponse(txt, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': `attachment; filename="novel.txt"`,
                },
            });
        }

        if (format === 'html') {
            const html = exportToHtml(projectId);
            return new NextResponse(html, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Disposition': `attachment; filename="novel.html"`,
                },
            });
        }

        if (format === 'epub') {
            const epubBuffer = await exportToEpub(projectId);
            return new NextResponse(new Uint8Array(epubBuffer), {
                headers: {
                    'Content-Type': 'application/epub+zip',
                    'Content-Disposition': `attachment; filename="novel.epub"`,
                },
            });
        }

        return NextResponse.json({ error: 'Unsupported format. Use txt, html, or epub.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
    }
}
