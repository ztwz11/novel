'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GenerateTabProps {
    projectId: string;
    chapters: any[];
    activeVolume: any;
    knowledgeFiles: any[];
    selectedKnowledgeIds: string[];
    onKnowledgeToggle: (id: string, checked: boolean) => void;
    onChapterGenerated: (chapter: any) => void;
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;
    direction: string;
    onDirectionChange: (val: string) => void;
}

export default function GenerateTab({
    projectId, chapters, activeVolume, knowledgeFiles, selectedKnowledgeIds,
    onKnowledgeToggle, onChapterGenerated, isGenerating, setIsGenerating,
    direction, onDirectionChange,
}: GenerateTabProps) {
    const [providers, setProviders] = useState<any[]>([]);
    const [selectedProvider, setSelectedProvider] = useState('gemini');
    const [selectedModel, setSelectedModel] = useState('');
    const [costEstimate, setCostEstimate] = useState<any>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [useStreaming, setUseStreaming] = useState(true);
    const [streamingText, setStreamingText] = useState('');
    const streamRef = useRef<HTMLDivElement>(null);

    // Load providers
    useEffect(() => {
        fetch(`/api/projects/${projectId}/estimate`).then(r => r.json()).then(d => {
            if (d.providers) {
                setProviders(d.providers);
                const first = d.providers.find((p: any) => p.configured);
                if (first) { setSelectedProvider(first.id); setSelectedModel(first.models[0]?.id || ''); }
            }
        });
    }, [projectId]);

    // Cost estimation
    const fetchCost = useCallback(async () => {
        if (!direction || !activeVolume) return;
        setIsEstimating(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/estimate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: selectedProvider, modelId: selectedModel,
                    volumeId: activeVolume.id, chapterNumber: chapters.length + 1,
                    direction, knowledgeFileIds: selectedKnowledgeIds,
                }),
            });
            const data = await res.json();
            setCostEstimate(data.estimate);
        } catch { /* silent */ }
        setIsEstimating(false);
    }, [direction, selectedProvider, selectedModel, activeVolume, chapters.length, selectedKnowledgeIds, projectId]);

    useEffect(() => {
        if (!direction || direction.length < 10) { setCostEstimate(null); return; }
        const t = setTimeout(fetchCost, 800);
        return () => clearTimeout(t);
    }, [direction, selectedProvider, selectedModel, fetchCost]);

    // Generate with streaming
    const handleGenerate = async () => {
        if (!direction || !activeVolume || isGenerating) return;
        setIsGenerating(true);
        setStreamingText('');

        if (useStreaming) {
            // SSE streaming
            try {
                const res = await fetch(`/api/projects/${projectId}/stream`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        volumeId: activeVolume.id, chapterNumber: chapters.length + 1,
                        direction, knowledgeFileIds: selectedKnowledgeIds.length > 0 ? selectedKnowledgeIds : undefined,
                        providerId: selectedProvider, modelId: selectedModel,
                    }),
                });

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.slice(6));
                                if (event.type === 'chunk') {
                                    setStreamingText(prev => prev + event.text);
                                    // Auto-scroll
                                    if (streamRef.current) {
                                        streamRef.current.scrollTop = streamRef.current.scrollHeight;
                                    }
                                } else if (event.type === 'done') {
                                    onChapterGenerated(event.chapter);
                                    onDirectionChange('');
                                    setCostEstimate(null);
                                    setStreamingText('');
                                } else if (event.type === 'error') {
                                    setStreamingText(prev => prev + `\n\n⚠️ 오류: ${event.message}`);
                                }
                            } catch { /* skip invalid JSON */ }
                        }
                    }
                }
            } catch (err: any) {
                setStreamingText(prev => prev + `\n\n⚠️ 오류: ${err.message}`);
            } finally {
                setIsGenerating(false);
            }
        } else {
            // Non-streaming (original behavior)
            try {
                const res = await fetch(`/api/projects/${projectId}/generate`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        volumeId: activeVolume.id, chapterNumber: chapters.length + 1,
                        direction, knowledgeFileIds: selectedKnowledgeIds.length > 0 ? selectedKnowledgeIds : undefined,
                        providerId: selectedProvider, modelId: selectedModel,
                    }),
                });
                const result = await res.json();
                if (res.ok) {
                    onChapterGenerated(result.chapter);
                    onDirectionChange('');
                    setCostEstimate(null);
                }
            } catch { /* silent */ }
            finally { setIsGenerating(false); }
        }
    };

    return (
        <div className="fade-in">
            <div className="gen-panel">
                <h4>✨ {chapters.length + 1}화 생성</h4>

                {/* Provider */}
                <div className="form-group">
                    <label>AI 프로바이더</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {providers.filter((p: any) => p.configured).map((p: any) => (
                            <button key={p.id}
                                className={`btn btn-sm ${selectedProvider === p.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { setSelectedProvider(p.id); setSelectedModel(p.models[0]?.id || ''); setCostEstimate(null); }}
                                style={{ flex: 1, fontSize: 11 }}
                            >
                                {p.id === 'gemini' ? '💎' : p.id === 'openai' ? '🤖' : '🟣'} {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Model */}
                <div className="form-group">
                    <label>모델</label>
                    <select className="form-select" value={selectedModel}
                        onChange={e => { setSelectedModel(e.target.value); setCostEstimate(null); }}>
                        {providers.find((p: any) => p.id === selectedProvider)?.models?.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name} — {m.description}</option>
                        ))}
                    </select>
                </div>

                {/* Streaming toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={useStreaming} onChange={e => setUseStreaming(e.target.checked)} />
                    ⚡ 실시간 스트리밍 (타이핑 효과)
                </label>

                {/* Direction */}
                <div className="form-group">
                    <label>챕터 방향 지시</label>
                    <textarea className="form-textarea"
                        placeholder={`예시:\n- 주인공이 비급을 발견하고 수련 시작\n- 적대 세력과 첫 조우`}
                        value={direction} onChange={e => onDirectionChange(e.target.value)}
                        rows={5} disabled={isGenerating} />
                </div>

                {/* Knowledge Files */}
                {knowledgeFiles.length > 0 && (
                    <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            📚 참고 지식 파일 ({selectedKnowledgeIds.length}/{knowledgeFiles.length})
                        </div>
                        {knowledgeFiles.map((kf: any) => (
                            <label key={kf.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', cursor: 'pointer', fontSize: 11 }}>
                                <input type="checkbox" checked={selectedKnowledgeIds.includes(kf.id)}
                                    onChange={e => onKnowledgeToggle(kf.id, e.target.checked)} />
                                <span>{kf.filename}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>({kf.char_count}자{kf.summary ? ' ✨요약' : ''})</span>
                            </label>
                        ))}
                    </div>
                )}

                {/* Cost */}
                {costEstimate && (
                    <div style={{
                        marginBottom: 12, padding: 10,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                        borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.3)',
                    }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>💰 예상 비용</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>₩{costEstimate.estimatedCostKRW?.toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>${costEstimate.estimatedCostUSD?.toFixed(4)} USD</div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-muted)' }}>
                                <div>입력 ~{(costEstimate.estimatedInputTokens / 1000).toFixed(1)}K 토큰</div>
                                <div>출력 ~{(costEstimate.estimatedOutputTokens / 1000).toFixed(1)}K 토큰</div>
                            </div>
                        </div>
                    </div>
                )}
                {isEstimating && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
                        <span className="loading-spin" style={{ display: 'inline-block' }}>⟳</span> 비용 계산 중...
                    </div>
                )}

                {/* Generate */}
                <button className="btn btn-primary" style={{ width: '100%', fontSize: 14, padding: '12px 0' }}
                    onClick={handleGenerate}
                    disabled={!direction || isGenerating}>
                    {isGenerating ? (
                        <><span className="loading-spin">⟳</span> {useStreaming ? '스트리밍 중...' : '생성 중...'}</>
                    ) : (
                        <>✨ {chapters.length + 1}화 생성하기{costEstimate ? ` (₩${costEstimate.estimatedCostKRW?.toLocaleString()})` : ''}</>
                    )}
                </button>

                {/* Streaming Output */}
                {streamingText && (
                    <div ref={streamRef} style={{
                        marginTop: 12, padding: 14, maxHeight: 400, overflowY: 'auto',
                        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--accent-primary)',
                        fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                    }}>
                        <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginBottom: 8, fontWeight: 600 }}>
                            ⚡ 실시간 생성 중...
                        </div>
                        {streamingText}
                        {isGenerating && <span className="loading-pulse" style={{ display: 'inline-block', width: 8, height: 16, background: 'var(--accent-primary)', marginLeft: 2, verticalAlign: 'text-bottom' }}>|</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
