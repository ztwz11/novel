'use client';

import { useState } from 'react';

interface StoryBibleTabProps {
    entries: any[];
    onUpdate: (entry: any, content: string) => void;
}

export default function StoryBibleTab({ entries, onUpdate }: StoryBibleTabProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    return (
        <div className="fade-in">
            {entries.map((entry: any) => (
                <div key={entry.id} style={{ marginBottom: 12 }}>
                    <div
                        style={{
                            padding: '10px 14px', background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer',
                        }}
                        onClick={() => {
                            if (editingId === entry.id) { setEditingId(null); }
                            else { setEditingId(entry.id); setEditContent(entry.content); }
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{entry.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{entry.category}</span>
                        </div>
                        {entry.content && editingId !== entry.id && (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                                {entry.content.length > 60 ? entry.content.slice(0, 60) + '...' : entry.content}
                            </p>
                        )}
                    </div>
                    {editingId === entry.id && (
                        <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', border: '1px solid var(--border-color)', borderTop: 'none' }}>
                            <textarea className="form-textarea" value={editContent} onChange={e => setEditContent(e.target.value)}
                                rows={6} placeholder="설정 내용을 입력하세요..." />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => { onUpdate(entry, editContent); setEditingId(null); }}>저장</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>취소</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
