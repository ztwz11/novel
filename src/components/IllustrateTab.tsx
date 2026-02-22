'use client';

import { useState } from 'react';

interface IllustrateTabProps {
    projectId: string;
    selectedChapter: any;
    illustrations: any[];
    onIllustrationsUpdate: (illustrations: any[]) => void;
}

export default function IllustrateTab({ projectId, selectedChapter, illustrations, onIllustrationsUpdate }: IllustrateTabProps) {
    const [provider, setProvider] = useState<'gemini' | 'openai' | 'manual'>('manual');
    const [style, setStyle] = useState('anime');
    const [type, setType] = useState<'scene' | 'character' | 'background' | 'cover'>('scene');
    const [custom, setCustom] = useState('');
    const [charName, setCharName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);

    const generate = async () => {
        setIsGenerating(true); setResult(null);
        try {
            const action = provider === 'manual' ? 'prompt_only' : 'generate';
            const res = await fetch(`/api/projects/${projectId}/illustrate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action, chapterId: selectedChapter?.id, type, provider, style,
                    customPrompt: custom || undefined, characterName: charName || undefined,
                }),
            });
            setResult(await res.json());
            const gal = await fetch(`/api/projects/${projectId}/illustrate`);
            const galData = await gal.json();
            onIllustrationsUpdate(galData.illustrations || []);
        } catch (err: any) { alert('삽화 생성 실패: ' + err.message); }
        finally { setIsGenerating(false); }
    };

    const PROVIDERS = [
        { id: 'manual' as const, label: '📋 프롬프트만', desc: '직접 사용' },
        { id: 'gemini' as const, label: '✨ Gemini', desc: 'Imagen 3' },
        { id: 'openai' as const, label: '🎨 OpenAI', desc: 'DALL-E 3' },
    ];
    const TYPES = [
        { id: 'scene' as const, label: '🖼️ 장면' }, { id: 'character' as const, label: '👤 캐릭터' },
        { id: 'background' as const, label: '🏔️ 배경' }, { id: 'cover' as const, label: '📕 표지' },
    ];
    const STYLES = [
        { id: 'anime', label: '🎌 애니메이션' }, { id: 'manhwa', label: '📱 웹툰' },
        { id: 'ink_wash', label: '🖌️ 수묵화' }, { id: 'digital_art', label: '💻 디지털 아트' },
        { id: 'watercolor', label: '🎨 수채화' }, { id: 'concept_art', label: '🎬 컨셉 아트' },
        { id: 'oil_painting', label: '🖼️ 유화' }, { id: 'realistic', label: '📸 사실적' },
    ];

    return (
        <div className="fade-in" style={{ padding: 4 }}>
            <h4 style={{ fontSize: 14, marginBottom: 12, color: 'var(--accent-primary)' }}>🎨 삽화 생성</h4>

            {/* Provider */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>🤖 이미지 생성 AI</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {PROVIDERS.map(p => (
                        <button key={p.id}
                            className={`btn ${provider === p.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ flex: 1, fontSize: 10, flexDirection: 'column', display: 'flex', alignItems: 'center', gap: 2, padding: '8px 4px' }}
                            onClick={() => setProvider(p.id)}>
                            <span>{p.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.7 }}>{p.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>📷 유형</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {TYPES.map(t => (
                        <button key={t.id}
                            className={`btn ${type === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ flex: 1, fontSize: 11 }}
                            onClick={() => setType(t.id)}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* Style */}
            <div style={{ marginBottom: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8 }}>🎨 스타일</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {STYLES.map(s => (
                        <button key={s.id}
                            className={`btn ${style === s.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: 11 }}
                            onClick={() => setStyle(s.id)}>{s.label}</button>
                    ))}
                </div>
            </div>

            {type === 'character' && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11 }}>캐릭터 이름</label>
                    <input className="form-input" type="text" placeholder="Story Bible에 등록된 캐릭터 이름"
                        value={charName} onChange={e => setCharName(e.target.value)} />
                </div>
            )}

            <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11 }}>추가 지시 (선택)</label>
                <textarea className="form-textarea" rows={2} placeholder="예: 석양 배경, 주인공이 검을 들고 절벽에..."
                    value={custom} onChange={e => setCustom(e.target.value)} />
            </div>

            {selectedChapter && (
                <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginBottom: 10, padding: '6px 10px', background: 'rgba(147,130,255,0.1)', borderRadius: 'var(--radius-sm)' }}>
                    📖 선택된 챕터: {selectedChapter.chapter_number}화 &ldquo;{selectedChapter.title}&rdquo; 기반
                </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={isGenerating} onClick={generate}>
                {isGenerating ? <><span className="loading-spin">⟳</span> 생성 중...</> : provider === 'manual' ? '📋 프롬프트 생성' : '🎨 삽화 생성'}
            </button>

            {/* Result */}
            {result && (
                <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', marginBottom: 14 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 8 }}>
                        {result.imageData || result.imageUrl ? '🖼️ 생성된 삽화' : '📋 생성된 프롬프트'}
                    </h4>
                    {result.imageData && <img src={`data:image/png;base64,${result.imageData}`} alt="illustration" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 10 }} />}
                    {result.imageUrl && <img src={result.imageUrl} alt="illustration" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 10 }} />}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🇰🇷 한국어 묘사:</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>{result.prompt}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🇺🇸 English Prompt:</div>
                        <div style={{ fontSize: 11, lineHeight: 1.5, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.translatedPrompt}</div>
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 6, fontSize: 10 }}
                            onClick={() => navigator.clipboard.writeText(result.translatedPrompt)}>📋 복사</button>
                    </div>
                </div>
            )}

            {/* Gallery */}
            {illustrations.length > 0 && (
                <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 8 }}>🖼️ 갤러리 ({illustrations.length})</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {illustrations.slice(0, 6).map((ill: any) => (
                            <div key={ill.id} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                {ill.image_data ? (
                                    <img src={`data:image/png;base64,${ill.image_data}`} alt={ill.type} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                                ) : ill.image_url ? (
                                    <img src={ill.image_url} alt={ill.type} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ padding: 12, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        📋 프롬프트<br />{ill.type}
                                    </div>
                                )}
                                <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-muted)' }}>{ill.style} · {ill.provider}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
