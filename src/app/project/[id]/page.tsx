'use client';

import { useState, useEffect, use } from 'react';
import SettingsEditor from '@/components/SettingsEditor';
import { DEFAULT_NOVEL_SETTINGS } from '@/lib/settings/novel-settings';
import { useToast } from '@/components/Toast';
import ChapterSidebar from '@/components/ChapterSidebar';
import ChapterViewer from '@/components/ChapterViewer';
import GenerateTab from '@/components/GenerateTab';
import ReviseTab from '@/components/ReviseTab';
import IllustrateTab from '@/components/IllustrateTab';
import StoryBibleTab from '@/components/StoryBibleTab';

interface ProjectData {
    project: any;
    volumes: any[];
    storyBible: any[];
    persona: any;
}

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

const GENRE_MAP: Record<string, { name: string; emoji: string }> = {
    murim: { name: '무협', emoji: '🥋' },
    fusion_murim: { name: '퓨전무협', emoji: '⚔️' },
    traditional_fantasy: { name: '정통판타지', emoji: '🐉' },
    modern_fantasy: { name: '현대판타지', emoji: '🏙️' },
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<ProjectData | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [activeTab, setActiveTab] = useState<'bible' | 'generate' | 'info' | 'settings' | 'revise' | 'illustrate'>('generate');
    const [direction, setDirection] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeVolumeIdx, setActiveVolumeIdx] = useState(0);
    const [illustrations, setIllustrations] = useState<any[]>([]);

    // Knowledge files state
    const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);

    const toast = useToast();

    // Load project data
    useEffect(() => {
        fetch(`/api/projects/${id}`).then(r => r.json()).then(d => {
            setData(d);
            if (d.volumes?.length > 0) {
                fetch(`/api/projects/${id}/chapters?volumeId=${d.volumes[0].id}`)
                    .then(r => r.json()).then(setChapters);
            }
        });
    }, [id]);

    // Load knowledge files
    useEffect(() => {
        if (data?.project?.persona_id) {
            fetch(`/api/personas/${data.project.persona_id}/knowledge`)
                .then(r => r.json())
                .then(d => {
                    const files = (d.files || []).filter((f: any) => f.is_active);
                    setKnowledgeFiles(files);
                    setSelectedKnowledgeIds(files.map((f: any) => f.id));
                });
        }
    }, [data?.project?.persona_id]);

    const activeVolume = data?.volumes?.[activeVolumeIdx];


    // Update bible entry
    const updateBibleEntry = async (entry: any, content: string) => {
        await fetch(`/api/projects/${id}/story-bible`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryId: entry.id, content }),
        });
        setData(prev => prev ? {
            ...prev,
            storyBible: prev.storyBible.map(e => e.id === entry.id ? { ...e, content } : e),
        } : prev);
    };

    // Save settings
    const saveSettings = async (newSettings: any) => {
        await fetch(`/api/projects/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings_json: JSON.stringify(newSettings) }),
        });
        setData(prev => prev ? { ...prev, project: { ...prev.project, settings_json: JSON.stringify(newSettings) } } : prev);
        toast.addToast('success', '설정이 저장되었습니다');
    };

    // Save chapter
    const saveChapter = async (chapterId: string, title: string, content: string) => {
        const res = await fetch(`/api/projects/${id}/chapters`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapterId, title, content }),
        });
        if (res.ok) {
            const updated = await res.json();
            setChapters(prev => prev.map(c => c.id === updated.id ? { ...c, title: updated.title, content: updated.content, word_count: updated.word_count } : c));
            setSelectedChapter(prev => prev ? { ...prev, title: updated.title, content: updated.content, word_count: updated.word_count } : prev);
            toast.addToast('success', '챕터가 저장되었습니다');
        }
    };

    // Delete chapter
    const deleteChapter = async (chapterId: string) => {
        if (!confirm('이 챕터를 삭제하시겠습니까?')) return;
        await fetch(`/api/projects/${id}/chapters?chapterId=${chapterId}`, { method: 'DELETE' });
        setChapters(prev => prev.filter(c => c.id !== chapterId));
        if (selectedChapter?.id === chapterId) setSelectedChapter(null);
        toast.addToast('info', '챕터가 삭제되었습니다');
    };

    // Add volume
    const addVolume = async () => {
        const volumeNum = (data?.volumes?.length || 0) + 1;
        const res = await fetch(`/api/projects/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addVolume: true, volumeNumber: volumeNum }),
        });
        if (res.ok) {
            const d = await fetch(`/api/projects/${id}`).then(r => r.json());
            setData(d);
            setActiveVolumeIdx(d.volumes.length - 1);
            toast.addToast('success', `${volumeNum}권이 추가되었습니다`);
        }
    };

    // Volume change handler
    const handleVolumeChange = (idx: number) => {
        setActiveVolumeIdx(idx);
        setSelectedChapter(null);
        if (data?.volumes?.[idx]) {
            fetch(`/api/projects/${id}/chapters?volumeId=${data.volumes[idx].id}`)
                .then(r => r.json()).then(setChapters);
        }
    };

    if (!data) {
        return (
            <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
                <div className="loading-pulse" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>프로젝트 로딩 중...</div>
            </div>
        );
    }

    const genre = GENRE_MAP[data.project.genre];
    const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

    return (
        <div className="project-layout">
            {/* Left Sidebar */}
            <ChapterSidebar
                projectTitle={data.project.title}
                genre={genre}
                genreKey={data.project.genre}
                chapters={chapters}
                selectedChapter={selectedChapter}
                volumes={data.volumes || []}
                activeVolumeIdx={activeVolumeIdx}
                onSelectChapter={ch => setSelectedChapter(ch)}
                onDeleteChapter={deleteChapter}
                onVolumeChange={handleVolumeChange}
                onAddVolume={addVolume}
            />

            {/* Main Editor Area */}
            <div className="editor-area">
                {selectedChapter ? (
                    <ChapterViewer chapter={selectedChapter} onSaveChapter={saveChapter} />
                ) : (
                    <div className="empty-state">
                        <div className="emoji">📖</div>
                        <h3>챕터를 선택하거나 새로 생성하세요</h3>
                        <p>좌측에서 챕터를 선택하거나, 우측 패널에서 새 챕터를 생성할 수 있습니다.</p>
                    </div>
                )}
            </div>

            {/* Right Panel */}
            <div className="right-panel">
                <div className="tabs" style={{ flexWrap: 'wrap' }}>
                    <div className={`tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}>✨ 생성</div>
                    <div className={`tab ${activeTab === 'revise' ? 'active' : ''}`} onClick={() => setActiveTab('revise')}>✏️ 탈고</div>
                    <div className={`tab ${activeTab === 'illustrate' ? 'active' : ''}`} onClick={() => setActiveTab('illustrate')}>🎨 삽화</div>
                    <div className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ 세부설정</div>
                    <div className={`tab ${activeTab === 'bible' ? 'active' : ''}`} onClick={() => setActiveTab('bible')}>📚 스토리바이블</div>
                    <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>ℹ️ 정보</div>
                </div>

                {activeTab === 'generate' && (
                    <GenerateTab
                        projectId={id}
                        chapters={chapters}
                        activeVolume={activeVolume}
                        knowledgeFiles={knowledgeFiles}
                        selectedKnowledgeIds={selectedKnowledgeIds}
                        onKnowledgeToggle={(kid, checked) => {
                            if (checked) setSelectedKnowledgeIds(prev => [...prev, kid]);
                            else setSelectedKnowledgeIds(prev => prev.filter(x => x !== kid));
                        }}
                        onChapterGenerated={(chapter) => {
                            const newChapter: Chapter = {
                                id: chapter.id, volume_id: activeVolume?.id || '',
                                chapter_number: chapter.chapterNumber, title: chapter.title,
                                content: chapter.content, summary: chapter.summary,
                                word_count: chapter.wordCount, status: 'generated',
                            };
                            setChapters(prev => [...prev, newChapter]);
                            setSelectedChapter(newChapter);
                            toast.addToast('success', `${newChapter.title} 생성 완료!`);
                        }}
                        isGenerating={isGenerating}
                        setIsGenerating={setIsGenerating}
                        direction={direction}
                        onDirectionChange={setDirection}
                    />
                )}

                {activeTab === 'settings' && (
                    <div className="fade-in">
                        <SettingsEditor
                            settings={(() => {
                                try { return { ...DEFAULT_NOVEL_SETTINGS, ...JSON.parse(data.project.settings_json || '{}') }; }
                                catch { return DEFAULT_NOVEL_SETTINGS; }
                            })()}
                            onSave={saveSettings}
                            genre={data.project.genre}
                        />
                    </div>
                )}

                {activeTab === 'bible' && (
                    <StoryBibleTab entries={data.storyBible} onUpdate={updateBibleEntry} />
                )}

                {activeTab === 'info' && (
                    <div className="fade-in">
                        <div style={{ fontSize: 13, lineHeight: 2 }}>
                            <div><strong>제목:</strong> {data.project.title}</div>
                            <div><strong>장르:</strong> {genre?.emoji} {genre?.name}</div>
                            <div><strong>목표:</strong> {data.project.target_volumes}권</div>
                            <div><strong>챕터:</strong> {chapters.length}화</div>
                            <div><strong>총 글자수:</strong> {totalWords.toLocaleString()}자</div>
                            {data.persona && <div><strong>페르소나:</strong> 🎭 {data.persona.name}</div>}
                            <div><strong>생성일:</strong> {new Date(data.project.created_at).toLocaleDateString('ko-KR')}</div>
                        </div>

                        {/* Export */}
                        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 10 }}>📤 내보내기</h4>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a href={`/api/projects/${id}/export?format=txt`} download className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>📄 TXT</a>
                                <a href={`/api/projects/${id}/export?format=html`} download className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>🌐 HTML</a>
                                <a href={`/api/projects/${id}/export?format=epub`} download className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>📕 EPUB</a>
                            </div>
                        </div>

                        {/* Consistency */}
                        <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 10 }}>🔍 일관성 검증</h4>
                            <button className="btn btn-secondary btn-sm" onClick={async () => {
                                const res = await fetch(`/api/projects/${id}/consistency`, {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'deep' }),
                                });
                                const report = await res.json();
                                toast.addToast('info', `검증 완료: ${report.totalIssues}개 이슈 발견`);
                            }}>🔍 심층 분석</button>
                        </div>

                        {/* Compression */}
                        <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 10 }}>🗜️ 요약 압축</h4>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={async () => {
                                    const res = await fetch(`/api/projects/${id}/compress`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'analyze' }),
                                    });
                                    const analysis = await res.json();
                                    toast.addToast('info', `총 ${analysis.totalChapters}화, ${analysis.totalWords?.toLocaleString()}자 — 압축 대기 ${analysis.chaptersNeedingCondensed}화`);
                                }}>📊 분석</button>
                                <button className="btn btn-secondary btn-sm" onClick={async () => {
                                    const res = await fetch(`/api/projects/${id}/compress`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'compress', currentChapterNumber: chapters.length }),
                                    });
                                    const result = await res.json();
                                    toast.addToast('success', `압축 완료: ${result.compressed}개 요약 압축됨`);
                                }}>🗜️ 실행</button>
                            </div>
                        </div>

                        {data.persona && (
                            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ fontSize: 13, marginBottom: 8, color: 'var(--accent-primary)' }}>🎭 페르소나</h4>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {data.persona.system_prompt?.slice(0, 200)}{data.persona.system_prompt?.length > 200 ? '...' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'revise' && (
                    <ReviseTab
                        projectId={id}
                        chapters={chapters}
                        activeVolume={activeVolume}
                        onChaptersUpdate={chapData => setChapters(Array.isArray(chapData) ? chapData : (chapData as any).chapters || [])}
                    />
                )}

                {activeTab === 'illustrate' && (
                    <IllustrateTab
                        projectId={id}
                        selectedChapter={selectedChapter}
                        illustrations={illustrations}
                        onIllustrationsUpdate={setIllustrations}
                    />
                )}
            </div>
        </div>
    );
}
