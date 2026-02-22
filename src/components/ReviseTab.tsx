'use client';

import { useState } from 'react';

interface ReviseTabProps {
    projectId: string;
    chapters: any[];
    activeVolume: any;
    onChaptersUpdate: (chapters: any[]) => void;
}

export default function ReviseTab({ projectId, chapters, activeVolume, onChaptersUpdate }: ReviseTabProps) {
    const [chapterIds, setChapterIds] = useState<string[]>([]);
    const [focus, setFocus] = useState<string[]>(['polish']);
    const [intensity, setIntensity] = useState<'light' | 'normal' | 'heavy'>('normal');
    const [custom, setCustom] = useState('');
    const [isRevising, setIsRevising] = useState(false);
    const [result, setResult] = useState<any>(null);

    const executeRevision = async () => {
        setIsRevising(true); setResult(null);
        try {
            const res = await fetch(`/api/projects/${projectId}/revise`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterIds, options: { focus, intensity, customInstruction: custom || undefined } }),
            });
            setResult(await res.json());
        } catch (err: any) { alert('탈고 실패: ' + err.message); }
        finally { setIsRevising(false); }
    };

    const applyRevision = async () => {
        if (!result?.revisionId) return;
        await fetch(`/api/projects/${projectId}/revise`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'apply', revisionId: result.revisionId }),
        });
        if (activeVolume) {
            const res = await fetch(`/api/projects/${projectId}/chapters?volumeId=${activeVolume.id}`);
            onChaptersUpdate(await res.json());
        }
        setResult(null);
    };

    const FOCUS_OPTIONS = [
        { id: 'polish', label: '✍️ 문장 다듬기' }, { id: 'description', label: '🏞️ 묘사 강화' },
        { id: 'dialogue', label: '💬 대사 개선' }, { id: 'action', label: '⚔️ 전투/액션' },
        { id: 'pacing', label: '⏱️ 페이싱 조절' }, { id: 'emotion', label: '💗 감정선 깊이' },
        { id: 'consistency', label: '🔗 일관성 교정' }, { id: 'length', label: '📏 분량 조절' },
    ];

    return (
        <div className="fade-in" style={{ padding: 4 }}>
            <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--accent-primary)' }}>✏️ AI 탈고</h4>

            {/* Chapter Selection */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>📋 챕터 선택</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }}
                            onClick={() => setChapterIds(chapters.map(c => c.id))}>전체 선택</button>
                        <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }}
                            onClick={() => setChapterIds([])}>전체 해제</button>
                    </div>
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                    {chapters.length === 0 ? (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>챕터가 없습니다.</p>
                    ) : chapters.map(ch => (
                        <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                            <input type="checkbox" checked={chapterIds.includes(ch.id)}
                                onChange={e => setChapterIds(prev => e.target.checked ? [...prev, ch.id] : prev.filter(x => x !== ch.id))} />
                            <span style={{ color: 'var(--text-muted)', minWidth: 28 }}>{ch.chapter_number}화</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</span>
                        </label>
                    ))}
                </div>
                {chapterIds.length > 0 && <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginTop: 6 }}>{chapterIds.length}개 챕터 선택됨</div>}
            </div>

            {/* Focus */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>🎯 탈고 포커스</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {FOCUS_OPTIONS.map(f => (
                        <label key={f.id} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 11,
                            background: focus.includes(f.id) ? 'rgba(147,130,255,0.15)' : 'transparent',
                            borderRadius: 'var(--radius-sm)', border: focus.includes(f.id) ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        }}>
                            <input type="checkbox" checked={focus.includes(f.id)}
                                onChange={e => setFocus(prev => e.target.checked ? [...prev, f.id] : prev.filter(x => x !== f.id))} />
                            {f.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Intensity */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>🔥 탈고 강도</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {(['light', 'normal', 'heavy'] as const).map(level => (
                        <button key={level}
                            className={`btn ${intensity === level ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ flex: 1, fontSize: 11 }}
                            onClick={() => setIntensity(level)}>
                            {level === 'light' ? '🌱 가볍게' : level === 'normal' ? '⚡ 보통' : '🔥 대폭 수정'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom */}
            <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11 }}>추가 지시사항 (선택)</label>
                <textarea className="form-textarea" rows={2} placeholder="예: 3인칭에서 1인칭으로 변경..."
                    value={custom} onChange={e => setCustom(e.target.value)} />
            </div>

            {/* Execute */}
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}
                disabled={chapterIds.length === 0 || focus.length === 0 || isRevising}
                onClick={executeRevision}>
                {isRevising ? <><span className="loading-spin">⟳</span> 탈고 중...</> : `✏️ ${chapterIds.length}개 챕터 탈고 실행`}
            </button>

            {/* Result */}
            {result && (
                <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)' }}>
                    <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 8 }}>📝 탈고 결과</h4>
                    {result.diffSummary && (
                        <div style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.6, padding: 10, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                            <strong>변경 요약:</strong><br />{result.diffSummary}
                        </div>
                    )}
                    {result.results?.map((r: any, i: number) => (
                        <div key={i} style={{ fontSize: 11, padding: 6, borderBottom: '1px solid var(--border-color)' }}>✅ {r.diffSummary}</div>
                    ))}
                    {result.revisionId && (
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={applyRevision}>
                            ✅ 탈고 결과 적용하기
                        </button>
                    )}
                    {result.errors?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#ff6b6b' }}>⚠️ 오류: {result.errors.join(', ')}</div>
                    )}
                </div>
            )}
        </div>
    );
}
