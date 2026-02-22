'use client';

import { useState } from 'react';

interface Chapter {
    id: string;
    chapter_number: number;
    title: string;
    content: string;
    summary: string;
    word_count: number;
    status: string;
}

interface ChapterViewerProps {
    chapter: Chapter;
    onSaveChapter: (chapterId: string, title: string, content: string) => Promise<void>;
}

export default function ChapterViewer({ chapter, onSaveChapter }: ChapterViewerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const startEditing = () => {
        setEditTitle(chapter.title);
        setEditContent(chapter.content);
        setIsEditing(true);
    };

    const handleSave = async () => {
        await onSaveChapter(chapter.id, editTitle, editContent);
        setIsEditing(false);
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span className={`status-badge ${chapter.status}`}>{chapter.status}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {chapter.word_count.toLocaleString()}자
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {isEditing ? (
                            <>
                                <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 저장</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>취소</button>
                            </>
                        ) : (
                            <button className="btn btn-secondary btn-sm" onClick={startEditing}>✏️ 편집</button>
                        )}
                    </div>
                </div>
                {isEditing ? (
                    <input
                        className="form-input"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
                    />
                ) : (
                    <h2 style={{ fontSize: 24, fontWeight: 700 }}>
                        {chapter.chapter_number}화. {chapter.title}
                    </h2>
                )}
            </div>

            {isEditing ? (
                <textarea
                    className="form-textarea"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{ minHeight: 500, fontSize: 14, lineHeight: 1.9, fontFamily: 'inherit' }}
                />
            ) : (
                <div className="chapter-content">{chapter.content}</div>
            )}

            {chapter.summary && (
                <div style={{ marginTop: 32, padding: 20, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 8 }}>📝 챕터 요약</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{chapter.summary}</p>
                </div>
            )}
        </div>
    );
}
