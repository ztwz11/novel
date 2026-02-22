/**
 * 소설 내보내기 모듈
 * TXT, EPUB(간이), HTML 형식 지원
 */

import { getDb } from '@/lib/db';

interface ExportChapter {
    chapter_number: number;
    title: string;
    content: string;
    volume_number: number;
    volume_title: string;
}

interface ExportData {
    project: { title: string; description: string; genre: string };
    chapters: ExportChapter[];
    totalWords: number;
}

function getExportData(projectId: string): ExportData {
    const db = getDb();

    const project = db.prepare('SELECT title, description, genre FROM projects WHERE id = ?')
        .get(projectId) as { title: string; description: string; genre: string } | undefined;

    if (!project) throw new Error('Project not found');

    const chapters = db.prepare(
        `SELECT c.chapter_number, c.title, c.content, c.word_count,
            v.volume_number, v.title as volume_title
     FROM chapters c
     JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ?
     ORDER BY v.volume_number, c.chapter_number`
    ).all(projectId) as (ExportChapter & { word_count: number })[];

    return {
        project,
        chapters,
        totalWords: chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0),
    };
}

/**
 * TXT 형식으로 내보내기
 */
export function exportToTxt(projectId: string): string {
    const data = getExportData(projectId);
    const lines: string[] = [];

    lines.push('═'.repeat(50));
    lines.push(`  ${data.project.title}`);
    lines.push('═'.repeat(50));
    if (data.project.description) {
        lines.push('');
        lines.push(data.project.description);
    }
    lines.push('');
    lines.push(`총 ${data.chapters.length}화 | ${data.totalWords.toLocaleString()}자`);
    lines.push('═'.repeat(50));
    lines.push('');

    let currentVolume = 0;
    for (const ch of data.chapters) {
        if (ch.volume_number !== currentVolume) {
            currentVolume = ch.volume_number;
            lines.push('');
            lines.push('─'.repeat(40));
            lines.push(`  ${ch.volume_number}권: ${ch.volume_title}`);
            lines.push('─'.repeat(40));
            lines.push('');
        }

        lines.push(`${ch.chapter_number}화. ${ch.title}`);
        lines.push('');
        lines.push(ch.content);
        lines.push('');
        lines.push('');
    }

    lines.push('═'.repeat(50));
    lines.push('  - NovelForge AI로 생성됨 -');
    lines.push('═'.repeat(50));

    return lines.join('\n');
}

/**
 * HTML 형식으로 내보내기 (EPUB 기반으로 사용)
 */
export function exportToHtml(projectId: string): string {
    const data = getExportData(projectId);

    let html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(data.project.title)}</title>
<style>
  body { font-family: 'Noto Sans KR', sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #222; background: #fafafa; }
  h1 { text-align: center; font-size: 28px; margin-bottom: 8px; }
  .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 40px; }
  .volume-header { background: #f0f0f0; padding: 12px 20px; border-radius: 8px; margin: 40px 0 20px; }
  .volume-header h2 { font-size: 18px; margin: 0; }
  .chapter { margin-bottom: 48px; page-break-after: always; }
  .chapter h3 { font-size: 20px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 16px; }
  .chapter-content { text-indent: 1em; white-space: pre-line; }
  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
</style>
</head>
<body>
<h1>${escapeHtml(data.project.title)}</h1>
<div class="subtitle">${data.chapters.length}화 | ${data.totalWords.toLocaleString()}자</div>
`;

    let currentVolume = 0;
    for (const ch of data.chapters) {
        if (ch.volume_number !== currentVolume) {
            currentVolume = ch.volume_number;
            html += `\n<div class="volume-header"><h2>${ch.volume_number}권: ${escapeHtml(ch.volume_title)}</h2></div>\n`;
        }

        html += `<div class="chapter">
<h3>${ch.chapter_number}화. ${escapeHtml(ch.title)}</h3>
<div class="chapter-content">${escapeHtml(ch.content)}</div>
</div>\n`;
    }

    html += `<div class="footer">NovelForge AI로 생성됨</div>
</body>
</html>`;

    return html;
}

/**
 * EPUB 3.0 형식으로 내보내기
 */
export async function exportToEpub(projectId: string): Promise<Buffer> {
    const JSZip = (await import('jszip')).default;
    const data = getExportData(projectId);
    const zip = new JSZip();

    // 1. mimetype (must be first, uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // 3. Style
    zip.file('OEBPS/style.css', `
body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.9; color: #222; padding: 1em; }
h1 { text-align: center; font-size: 1.8em; margin-bottom: 0.3em; }
h2 { font-size: 1.4em; border-bottom: 1px solid #ccc; padding-bottom: 0.3em; margin-top: 2em; }
h3 { font-size: 1.2em; color: #555; margin-top: 1.5em; }
p { text-indent: 1em; margin: 0.3em 0; }
.subtitle { text-align: center; color: #888; font-size: 0.85em; margin-bottom: 2em; }
.footer { text-align: center; color: #aaa; font-size: 0.75em; margin-top: 3em; }
`);

    // 4. Chapter XHTML files
    const chapterFiles: { id: string; href: string; title: string }[] = [];
    let currentVolume = 0;

    // Title page
    zip.file('OEBPS/title.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head><title>${escapeHtml(data.project.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
<h1>${escapeHtml(data.project.title)}</h1>
<p class="subtitle">${data.chapters.length}화 | ${data.totalWords.toLocaleString()}자</p>
</body></html>`);
    chapterFiles.push({ id: 'title', href: 'title.xhtml', title: data.project.title });

    for (const ch of data.chapters) {
        const chId = `ch${ch.volume_number}_${ch.chapter_number}`;
        const fname = `${chId}.xhtml`;

        let volumeHeader = '';
        if (ch.volume_number !== currentVolume) {
            currentVolume = ch.volume_number;
            volumeHeader = `<h2>${ch.volume_number}권: ${escapeHtml(ch.volume_title)}</h2>\n`;
        }

        // Convert content to paragraphs
        const paragraphs = ch.content.split('\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('\n');

        zip.file(`OEBPS/${fname}`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head><title>${ch.chapter_number}화. ${escapeHtml(ch.title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
${volumeHeader}<h3>${ch.chapter_number}화. ${escapeHtml(ch.title)}</h3>
${paragraphs}
</body></html>`);

        chapterFiles.push({ id: chId, href: fname, title: `${ch.chapter_number}화. ${ch.title}` });
    }

    // 5. content.opf
    const manifestItems = chapterFiles.map(f => `    <item id="${f.id}" href="${f.href}" media-type="application/xhtml+xml"/>`).join('\n');
    const spineItems = chapterFiles.map(f => `    <itemref idref="${f.id}"/>`).join('\n');

    zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:${projectId}</dc:identifier>
    <dc:title>${escapeHtml(data.project.title)}</dc:title>
    <dc:language>ko</dc:language>
    <dc:creator>NovelForge AI</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`);

    // 6. toc.xhtml (navigation)
    const tocItems = chapterFiles.map(f => `      <li><a href="${f.href}">${escapeHtml(f.title)}</a></li>`).join('\n');
    zip.file('OEBPS/toc.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko">
<head><title>목차</title><link rel="stylesheet" href="style.css"/></head>
<body>
  <nav epub:type="toc">
    <h1>목차</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body></html>`);

    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return buf;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

