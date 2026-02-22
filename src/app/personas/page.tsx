'use client';

import { useState, useEffect } from 'react';

interface Persona {
    id: string;
    name: string;
    description: string;
    genre: string;
    system_prompt: string;
    writing_style_json: string;
    rules_json: string;
    constraints_json: string;
    created_at: string;
}

interface GenrePreset {
    id: string;
    name: string;
    emoji: string;
    systemPromptTemplate: string;
    defaultStyle: { tone: string; perspective: string; sentenceStyle: string; vocabularyLevel: string };
    defaultRules: string[];
}

export default function PersonasPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [genres, setGenres] = useState<GenrePreset[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [rules, setRules] = useState<string[]>([]);
    const [newRule, setNewRule] = useState('');

    // Knowledge files state
    const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
    const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
    const [newFileName, setNewFileName] = useState('');
    const [newFileContent, setNewFileContent] = useState('');
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editFileContent, setEditFileContent] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    useEffect(() => {
        fetch('/api/personas').then(r => r.json()).then(setPersonas);
        fetch('/api/genres').then(r => r.json()).then(setGenres);
    }, []);

    const applyPreset = (genreId: string) => {
        setGenre(genreId);
        const preset = genres.find(g => g.id === genreId);
        if (preset) {
            setSystemPrompt(preset.systemPromptTemplate);
            setRules(preset.defaultRules);
        }
    };

    const addRule = () => {
        if (newRule.trim()) {
            setRules(prev => [...prev, newRule.trim()]);
            setNewRule('');
        }
    };

    const removeRule = (index: number) => {
        setRules(prev => prev.filter((_, i) => i !== index));
    };

    const createPersona = async () => {
        const preset = genres.find(g => g.id === genre);
        const res = await fetch('/api/personas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                genre,
                systemPrompt,
                writingStyle: preset?.defaultStyle || {},
                rules,
                constraints: [],
            }),
        });
        if (res.ok) {
            const persona = await res.json();
            setPersonas(prev => [persona, ...prev]);
            setShowModal(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setName(''); setDescription(''); setGenre(''); setSystemPrompt(''); setRules([]); setNewRule('');
        setEditingPersonaId(null);
    };

    const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);

    const editPersona = (p: Persona) => {
        setEditingPersonaId(p.id);
        setName(p.name);
        setDescription(p.description);
        setGenre(p.genre);
        setSystemPrompt(p.system_prompt);
        try { setRules(JSON.parse(p.rules_json || '[]')); } catch { setRules([]); }
        setShowModal(true);
    };

    const deletePersona = async (id: string) => {
        if (!confirm('이 페르소나를 삭제하시겠습니까?')) return;
        await fetch(`/api/personas/${id}`, { method: 'DELETE' });
        setPersonas(prev => prev.filter(p => p.id !== id));
    };

    const savePersona = async () => {
        if (editingPersonaId) {
            // Update existing persona
            const preset = genres.find(g => g.id === genre);
            const res = await fetch(`/api/personas/${editingPersonaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, genre, systemPrompt, writingStyle: preset?.defaultStyle || {}, rules }),
            });
            if (res.ok) {
                const updated = await res.json();
                setPersonas(prev => prev.map(p => p.id === updated.id ? updated : p));
                setShowModal(false);
                resetForm();
            }
        } else {
            await createPersona();
        }
    };

    const GENRE_MAP: Record<string, { name: string; emoji: string }> = {
        murim: { name: '무협', emoji: '🥋' },
        fusion_murim: { name: '퓨전무협', emoji: '⚔️' },
        traditional_fantasy: { name: '정통판타지', emoji: '🐉' },
        modern_fantasy: { name: '현대판타지', emoji: '🏙️' },
    };

    const loadKnowledgeFiles = async (personaId: string) => {
        if (expandedPersona === personaId) {
            setExpandedPersona(null);
            return;
        }
        setExpandedPersona(personaId);
        const res = await fetch(`/api/personas/${personaId}/knowledge`);
        const data = await res.json();
        setKnowledgeFiles(data.files || []);
    };

    const addKnowledgeFile = async (personaId: string) => {
        if (!newFileName.trim()) return;
        const res = await fetch(`/api/personas/${personaId}/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: newFileName, content: newFileContent }),
        });
        if (res.ok) {
            setNewFileName(''); setNewFileContent('');
            loadKnowledgeFiles(personaId);
            setExpandedPersona(personaId); // force re-expand
        }
    };

    const deleteKnowledgeFile = async (personaId: string, fileId: string) => {
        await fetch(`/api/personas/${personaId}/knowledge?fileId=${fileId}`, { method: 'DELETE' });
        loadKnowledgeFiles(personaId);
        setExpandedPersona(personaId);
    };

    const updateKnowledgeFile = async (personaId: string, fileId: string, content: string) => {
        await fetch(`/api/personas/${personaId}/knowledge`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, content }),
        });
        setEditingFile(null);
        loadKnowledgeFiles(personaId);
        setExpandedPersona(personaId);
    };

    const summarizeAll = async (personaId: string) => {
        setIsSummarizing(true);
        try {
            await fetch(`/api/personas/${personaId}/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'summarize_all' }),
            });
            loadKnowledgeFiles(personaId);
            setExpandedPersona(personaId);
        } catch { /* */ }
        setIsSummarizing(false);
    };

    return (
        <div className="main-content fade-in">
            <div className="section-header">
                <div>
                    <h2>🎭 페르소나 관리</h2>
                    <p>Gems처럼 작가의 문체, 톤, 규칙을 정의하여 일관된 소설을 작성하세요</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 새 페르소나
                </button>
            </div>

            {personas.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">🎭</div>
                    <h3>아직 페르소나가 없습니다</h3>
                    <p>장르 프리셋을 기반으로 나만의 작가 페르소나를 만들어보세요.</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                        + 첫 페르소나 만들기
                    </button>
                </div>
            ) : (
                <div className="card-grid">
                    {personas.map(p => {
                        const g = GENRE_MAP[p.genre];
                        const parsedRules = JSON.parse(p.rules_json || '[]');
                        return (
                            <div key={p.id} className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ fontSize: 24 }}>🎭</span>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
                                        {g && <span className={`genre-tag ${p.genre}`} style={{ fontSize: 11 }}>{g.emoji} {g.name}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => editPersona(p)} style={{ fontSize: 10, padding: '3px 8px' }}>✏️</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deletePersona(p.id)} style={{ fontSize: 10, padding: '3px 8px' }}>✕</button>
                                    </div>
                                </div>
                                {p.description && (
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                                        {p.description}
                                    </p>
                                )}
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    시스템 프롬프트: {(p.system_prompt || '').length}자
                                </div>
                                {parsedRules.length > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                        규칙 {parsedRules.length}개: {parsedRules.slice(0, 2).join(', ')}{parsedRules.length > 2 ? '...' : ''}
                                    </div>
                                )}

                                {/* Knowledge Files Toggle */}
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%', fontSize: 11 }}
                                    onClick={() => loadKnowledgeFiles(p.id)}>
                                    📚 지식 파일 {expandedPersona === p.id ? '▲ 접기' : '▼ 보기'}
                                </button>

                                {/* Knowledge Files Panel */}
                                {expandedPersona === p.id && (
                                    <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>📚 지식 파일 ({knowledgeFiles.length})</span>
                                            <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 8px' }}
                                                disabled={isSummarizing || knowledgeFiles.length === 0}
                                                onClick={() => summarizeAll(p.id)}>
                                                {isSummarizing ? '✨ 요약 중...' : '✨ 전체 요약 생성'}
                                            </button>
                                        </div>

                                        {/* Existing files */}
                                        {knowledgeFiles.map((kf: any) => (
                                            <div key={kf.id} style={{ marginBottom: 8, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                                                        {kf.is_active ? '🟢' : '⚪'} {kf.filename}
                                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>({kf.char_count}자)</span>
                                                    </span>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button className="btn btn-secondary" style={{ fontSize: 9, padding: '1px 6px' }}
                                                            onClick={() => { setEditingFile(kf.id); setEditFileContent(kf.content || ''); }}>✏️</button>
                                                        <button className="btn btn-danger" style={{ fontSize: 9, padding: '1px 6px' }}
                                                            onClick={() => deleteKnowledgeFile(p.id, kf.id)}>✕</button>
                                                    </div>
                                                </div>
                                                {kf.summary && (
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, padding: 4, background: 'rgba(147,130,255,0.05)', borderRadius: 4 }}>
                                                        ✨ <strong>요약:</strong> {kf.summary.substring(0, 150)}{kf.summary.length > 150 ? '...' : ''}
                                                    </div>
                                                )}
                                                {editingFile === kf.id && (
                                                    <div style={{ marginTop: 6 }}>
                                                        <textarea className="form-textarea" rows={8} value={editFileContent}
                                                            onChange={e => setEditFileContent(e.target.value)}
                                                            style={{ fontSize: 11, fontFamily: 'monospace' }} />
                                                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                            <button className="btn btn-primary btn-sm" style={{ fontSize: 10 }}
                                                                onClick={() => updateKnowledgeFile(p.id, kf.id, editFileContent)}>저장</button>
                                                            <button className="btn btn-secondary btn-sm" style={{ fontSize: 10 }}
                                                                onClick={() => setEditingFile(null)}>취소</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add new file */}
                                        <div style={{ marginTop: 8, padding: 8, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                                            <input className="form-input" placeholder="파일명 (예: 01_World_Setting.md)" value={newFileName}
                                                onChange={e => setNewFileName(e.target.value)} style={{ fontSize: 11, marginBottom: 4 }} />
                                            <textarea className="form-textarea" rows={4} placeholder="지식 파일 내용을 입력하세요...
예: 세계관 설정, 캐릭터 설정, 스타일 가이드 등"
                                                value={newFileContent} onChange={e => setNewFileContent(e.target.value)}
                                                style={{ fontSize: 11, fontFamily: 'monospace' }} />
                                            <button className="btn btn-primary btn-sm" style={{ marginTop: 4, width: '100%', fontSize: 11 }}
                                                onClick={() => addKnowledgeFile(p.id)} disabled={!newFileName.trim()}>
                                                ➕ 지식 파일 추가
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Persona Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh' }}>
                        <h3>🎭 새 페르소나</h3>

                        <div className="form-group">
                            <label>페르소나 이름</label>
                            <input className="form-input" placeholder="예: 열혈 무협 작가" value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>설명</label>
                            <input className="form-input" placeholder="이 페르소나의 특징..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>장르 프리셋 (클릭하면 기본값 자동 적용)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {genres.map(g => (
                                    <div
                                        key={g.id}
                                        onClick={() => applyPreset(g.id)}
                                        style={{
                                            padding: '10px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${genre === g.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                            background: genre === g.id ? 'var(--accent-glow)' : 'var(--bg-input)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ fontSize: 20 }}>{g.emoji}</div>
                                        <div style={{ fontSize: 12, marginTop: 4 }}>{g.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>시스템 프롬프트 (AI에게 보내는 핵심 지시)</label>
                            <textarea
                                className="form-textarea"
                                value={systemPrompt}
                                onChange={e => setSystemPrompt(e.target.value)}
                                rows={8}
                                placeholder="예: 당신은 정통 무협소설 작가입니다..."
                                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                            />
                        </div>

                        <div className="form-group">
                            <label>작성 규칙</label>
                            {rules.map((rule, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>• {rule}</span>
                                    <button className="btn btn-danger btn-sm" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => removeRule(i)}>✕</button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <input
                                    className="form-input"
                                    placeholder="새 규칙 입력..."
                                    value={newRule}
                                    onChange={e => setNewRule(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addRule()}
                                    style={{ fontSize: 13 }}
                                />
                                <button className="btn btn-secondary btn-sm" onClick={addRule}>추가</button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>취소</button>
                            <button className="btn btn-primary" onClick={savePersona} disabled={!name}>
                                🎭 {editingPersonaId ? '페르소나 저장' : '페르소나 생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
