'use client';

interface Chapter {
    id: string;
    volume_id: string;
    chapter_number: number;
    title: string;
    content: string;
    summary: string;
    word_count: number;
    status: string;
}

interface ChapterSidebarProps {
    projectTitle: string;
    genre: { name: string; emoji: string } | undefined;
    genreKey: string;
    chapters: Chapter[];
    selectedChapter: Chapter | null;
    volumes: any[];
    activeVolumeIdx: number;
    onSelectChapter: (ch: Chapter) => void;
    onDeleteChapter: (id: string) => void;
    onVolumeChange: (idx: number) => void;
    onAddVolume: () => void;
}

export default function ChapterSidebar({
    projectTitle, genre, genreKey, chapters, selectedChapter,
    volumes, activeVolumeIdx, onSelectChapter, onDeleteChapter, onVolumeChange, onAddVolume,
}: ChapterSidebarProps) {
    const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

    return (
        <div className="sidebar">
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {genre && <span>{genre.emoji}</span>}
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{projectTitle}</h3>
                </div>
                {genre && <span className={`genre-tag ${genreKey}`} style={{ fontSize: 11 }}>{genre.name}</span>}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>{chapters.length}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>챕터</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>{(totalWords / 10000).toFixed(1)}만</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>글자</div>
                </div>
            </div>

            {/* Volume Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <select
                    style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', color: 'var(--text-primary)', fontSize: 12 }}
                    value={activeVolumeIdx}
                    onChange={e => onVolumeChange(Number(e.target.value))}
                >
                    {volumes.map((v: any, i: number) => (
                        <option key={v.id} value={i}>📖 {v.title || `${v.volume_number}권`}</option>
                    ))}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={onAddVolume} title="새 권 추가">+</button>
            </div>

            {chapters.length === 0 && (
                <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    아직 챕터가 없습니다.<br />우측에서 첫 챕터를 생성하세요.
                </div>
            )}

            {chapters.map(ch => (
                <div
                    key={ch.id}
                    className={`sidebar-item ${selectedChapter?.id === ch.id ? 'active' : ''}`}
                    onClick={() => onSelectChapter(ch)}
                >
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 24 }}>{ch.chapter_number}화</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ch.title || `${ch.chapter_number}화`}
                    </span>
                    <button
                        onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, fontSize: 11, opacity: 0.5 }}
                        title="삭제"
                    >✕</button>
                </div>
            ))}
        </div>
    );
}
