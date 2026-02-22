'use client';

import { useState } from 'react';

interface NovelSettings {
    writingStyle: any;
    maturity: any;
    fusion: any;
    storyDirection: any;
    structure: any;
    worldBuilding: any;
}

interface SettingsEditorProps {
    settings: NovelSettings;
    onSave: (settings: NovelSettings) => void;
    genre: string;
}

// Reusable slider component
function Slider({ label, value, onChange, min = 1, max = 5, descriptions }: {
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; descriptions?: string[];
}) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--accent-primary)' }}>{value}/{max}</span>
            </div>
            <input
                type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            {descriptions && descriptions[value] && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{descriptions[value]}</div>
            )}
        </div>
    );
}

function SelectField({ label, value, options, onChange }: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Toggle({ label, value, onChange, description }: {
    label: string; value: boolean; onChange: (v: boolean) => void; description?: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                {description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>}
            </div>
            <div
                onClick={() => onChange(!value)}
                style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: value ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    border: `1px solid ${value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    position: 'relative', transition: 'all 0.2s',
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: 9,
                    background: 'white', position: 'absolute', top: 2,
                    left: value ? 22 : 2, transition: 'left 0.2s',
                }} />
            </div>
        </div>
    );
}

function SectionTitle({ emoji, title }: { emoji: string; title: string }) {
    return (
        <h4 style={{
            fontSize: 14, fontWeight: 600, color: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 20, marginBottom: 12,
            paddingBottom: 8, borderBottom: '1px solid var(--border-color)',
        }}>
            {emoji} {title}
        </h4>
    );
}

export default function SettingsEditor({ settings, onSave, genre }: SettingsEditorProps) {
    const [s, setS] = useState<NovelSettings>(settings);
    const [activeSection, setActiveSection] = useState('writing');
    const [dirty, setDirty] = useState(false);

    const update = (path: string, value: any) => {
        setS(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj = next;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = value;
            return next;
        });
        setDirty(true);
    };

    const save = () => {
        onSave(s);
        setDirty(false);
    };

    const sections = [
        { id: 'writing', label: '✍️ 문체', emoji: '✍️' },
        { id: 'maturity', label: '🔞 수위', emoji: '🔞' },
        { id: 'fusion', label: '⚡ 퓨전', emoji: '⚡' },
        { id: 'direction', label: '🧭 방향', emoji: '🧭' },
        { id: 'structure', label: '📐 구조', emoji: '📐' },
        { id: 'world', label: '🌍 세계관', emoji: '🌍' },
    ];

    return (
        <div>
            {/* Section tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {sections.map(sec => (
                    <div
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        style={{
                            padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
                            background: activeSection === sec.id ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                            color: activeSection === sec.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${activeSection === sec.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        }}
                    >
                        {sec.label}
                    </div>
                ))}
            </div>

            {/* ==================== 문체 설정 ==================== */}
            {activeSection === 'writing' && (
                <div className="fade-in">
                    <SectionTitle emoji="✍️" title="문체 설정" />

                    <SelectField label="서술 시점" value={s.writingStyle.perspective}
                        options={['1인칭', '3인칭 제한', '3인칭 전지', '다시점', '2인칭']}
                        onChange={v => update('writingStyle.perspective', v)} />

                    <SelectField label="문장 스타일" value={s.writingStyle.sentenceStyle}
                        options={['간결체', '만연체', '경어체', '반말체', '혼합체']}
                        onChange={v => update('writingStyle.sentenceStyle', v)} />

                    <div className="form-group">
                        <label>톤/분위기</label>
                        <input className="form-input" placeholder="예: 어둡고 비장한, 가볍고 유쾌한"
                            value={s.writingStyle.tone} onChange={e => update('writingStyle.tone', e.target.value)} />
                    </div>

                    <Slider label="묘사 밀도" value={s.writingStyle.descriptionDensity}
                        onChange={v => update('writingStyle.descriptionDensity', v)}
                        descriptions={['', '최소 (빠른 전개)', '간략', '보통', '풍부', '매우 상세 (느린 전개)']} />

                    <Slider label="대사 비율" value={s.writingStyle.dialogueRatio}
                        onChange={v => update('writingStyle.dialogueRatio', v)}
                        descriptions={['', '서술 위주', '서술 중심', '서술-대사 균형', '대사 중심', '대사 위주']} />

                    <Slider label="내면 독백" value={s.writingStyle.innerMonologue}
                        onChange={v => update('writingStyle.innerMonologue', v)}
                        descriptions={['', '거의 없음', '가끔', '보통', '많이', '매우 많이']} />

                    <SelectField label="전투/액션 묘사" value={s.writingStyle.actionStyle}
                        options={['간결한 속도감', '상세한 초식 묘사', '감각적 몰입', '전략적 분석', '영화적 연출']}
                        onChange={v => update('writingStyle.actionStyle', v)} />

                    <Slider label="유머 수준" value={s.writingStyle.humorLevel}
                        onChange={v => update('writingStyle.humorLevel', v)}
                        descriptions={['', '시리어스', '가끔 유머', '적절한 유머', '유쾌함', '코미디']} />

                    <SelectField label="한자어/고어 사용" value={s.writingStyle.archaicLanguage}
                        options={['없음', '가끔', '보통', '많이', '매우 많이']}
                        onChange={v => update('writingStyle.archaicLanguage', v)} />
                </div>
            )}

            {/* ==================== 수위 설정 ==================== */}
            {activeSection === 'maturity' && (
                <div className="fade-in">
                    <SectionTitle emoji="🔞" title="수위 설정" />

                    <SelectField label="전체 등급" value={s.maturity.overallRating}
                        options={['전체이용가', '12세', '15세', '18세', '성인']}
                        onChange={v => update('maturity.overallRating', v)} />

                    <Slider label="폭력/잔혹 묘사" value={s.maturity.violenceLevel}
                        onChange={v => update('maturity.violenceLevel', v)}
                        descriptions={['', '순화 (간접 묘사)', '절제 (암시)', '보통 (전투 묘사)', '사실적 (피/부상)', '잔혹 (상세 묘사)']} />

                    <Slider label="로맨스/성적 묘사" value={s.maturity.romanceLevel}
                        onChange={v => update('maturity.romanceLevel', v)}
                        descriptions={['', '암시만', '가벼운 스킨십', '키스/포옹', '성적 묘사', '성인물 수준']} />

                    <Slider label="욕설/비속어" value={s.maturity.profanityLevel}
                        onChange={v => update('maturity.profanityLevel', v)}
                        descriptions={['', '없음', '약한 표현', '보통', '거친 언어', '매우 거친']} />

                    <Slider label="심리적 어둠/공포" value={s.maturity.darknessLevel}
                        onChange={v => update('maturity.darknessLevel', v)}
                        descriptions={['', '가벼운', '약간 암울', '보통', '어두운', '매우 어둡고 잔혹']} />

                    <div className="form-group">
                        <label>금지 묘사 항목 (쉼표로 구분)</label>
                        <input className="form-input" placeholder="예: 아동학대, 동물학대, 자살 미화"
                            value={(s.maturity.prohibitedContent || []).join(', ')}
                            onChange={e => update('maturity.prohibitedContent', e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} />
                    </div>
                </div>
            )}

            {/* ==================== 퓨전 설정 ==================== */}
            {activeSection === 'fusion' && (
                <div className="fade-in">
                    <SectionTitle emoji="⚡" title="퓨전 설정" />

                    <Slider label="퓨전 정도" value={s.fusion.fusionLevel} min={0}
                        onChange={v => update('fusion.fusionLevel', v)}
                        descriptions={['정통 (퓨전 없음)', '약간 (가벼운 변형)', '적당한 퓨전', '강한 퓨전', '매우 강한', '극한 퓨전 (전면 재해석)']} />

                    <Toggle label="현대 지식 활용" value={s.fusion.modernKnowledge}
                        onChange={v => update('fusion.modernKnowledge', v)}
                        description="주인공이 현대 지식으로 상황 해결" />

                    <Toggle label="회귀/타임리프" value={s.fusion.regression}
                        onChange={v => update('fusion.regression', v)}
                        description="과거로 돌아가 미래 지식 활용" />

                    <Toggle label="빙의/환생" value={s.fusion.possession}
                        onChange={v => update('fusion.possession', v)}
                        description="다른 인물의 몸에 빙의 또는 환생" />

                    <Toggle label="이세계/차원이동" value={s.fusion.isekai}
                        onChange={v => update('fusion.isekai', v)}
                        description="다른 세계로의 이동" />

                    <div style={{ marginTop: 12 }}>
                        <Toggle label="시스템 요소 사용" value={s.fusion.systemElements?.enabled || false}
                            onChange={v => update('fusion.systemElements', { ...s.fusion.systemElements, enabled: v })}
                            description="스탯창, 레벨, 스킬 등 게임적 요소" />
                    </div>

                    {s.fusion.systemElements?.enabled && (
                        <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                            <SelectField label="시스템 유형" value={s.fusion.systemElements.type || '스탯창'}
                                options={['스탯창', '스킬트리', '퀘스트', '아이템등급']}
                                onChange={v => update('fusion.systemElements', { ...s.fusion.systemElements, type: v })} />
                            <SelectField label="묘사 상세도" value={s.fusion.systemElements.detail || '보통'}
                                options={['간략', '보통', '상세']}
                                onChange={v => update('fusion.systemElements', { ...s.fusion.systemElements, detail: v })} />
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label>부장르 (쉼표로 구분)</label>
                        <input className="form-input" placeholder="예: 로맨스, 미스터리, SF"
                            value={(s.fusion.subGenres || []).join(', ')}
                            onChange={e => update('fusion.subGenres', e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} />
                    </div>
                </div>
            )}

            {/* ==================== 방향성 설정 ==================== */}
            {activeSection === 'direction' && (
                <div className="fade-in">
                    <SectionTitle emoji="🧭" title="스토리 방향성" />

                    <SelectField label="주인공 유형" value={s.storyDirection.protagonistType}
                        options={['약자에서 성장', '먼치킨(처음부터 강함)', '반영웅', '평범한 일반인', '숨겨진 천재', '몰락 귀족/강자의 부활']}
                        onChange={v => update('storyDirection.protagonistType', v)} />

                    <SelectField label="전개 방식" value={s.storyDirection.narrativeStyle}
                        options={['사이다(통쾌)', '고구마(답답)', '균형', '점진적 카타르시스']}
                        onChange={v => update('storyDirection.narrativeStyle', v)} />

                    <SelectField label="성장 속도" value={s.storyDirection.growthPace}
                        options={['느린 성장', '보통', '빠른 성장', '폭풍 성장(먼치킨)']}
                        onChange={v => update('storyDirection.growthPace', v)} />

                    <SelectField label="결말 유형" value={s.storyDirection.endingType}
                        options={['해피엔딩', '배드엔딩', '열린결말', '비터스위트', '순환(다음 시즌 연결)', '미정']}
                        onChange={v => update('storyDirection.endingType', v)} />

                    <div style={{ marginTop: 12 }}>
                        <Toggle label="로맨스 요소" value={s.storyDirection.romance?.enabled || false}
                            onChange={v => update('storyDirection.romance', { ...s.storyDirection.romance, enabled: v })}
                            description="연애/로맨스 요소 포함" />
                    </div>

                    {s.storyDirection.romance?.enabled && (
                        <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                            <SelectField label="로맨스 구조" value={s.storyDirection.romance.type || '단일 히로인'}
                                options={['단일 히로인', '삼각관계', '하렘', '역하렘', '공략물']}
                                onChange={v => update('storyDirection.romance', { ...s.storyDirection.romance, type: v })} />
                            <Slider label="로맨스 비중" value={s.storyDirection.romance.intensity || 2}
                                onChange={v => update('storyDirection.romance', { ...s.storyDirection.romance, intensity: v })}
                                descriptions={['', '가벼운 암시', '서브 플롯', '주요 요소', '핵심 플롯', '로맨스 중심']} />
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label>전체 분위기</label>
                        <input className="form-input" placeholder="예: 어둡고 무거운, 밝고 열혈적인"
                            value={s.storyDirection.atmosphere} onChange={e => update('storyDirection.atmosphere', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>핵심 갈등</label>
                        <input className="form-input" placeholder="예: 복수, 세계 멸망, 권력 쟁탈"
                            value={s.storyDirection.mainConflict} onChange={e => update('storyDirection.mainConflict', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>테마/메시지 (선택)</label>
                        <input className="form-input" placeholder="예: 진정한 힘이란 무엇인가"
                            value={s.storyDirection.theme} onChange={e => update('storyDirection.theme', e.target.value)} />
                    </div>
                </div>
            )}

            {/* ==================== 구조 설정 ==================== */}
            {activeSection === 'structure' && (
                <div className="fade-in">
                    <SectionTitle emoji="📐" title="작품 구조" />

                    <SelectField label="구조 타입" value={s.structure.structureType}
                        options={['일직선 진행', '멀티 아크', '듀얼 타임라인', '군상극', '에피소드형']}
                        onChange={v => update('structure.structureType', v)} />

                    <div className="form-group">
                        <label>챕터당 목표 글자 수</label>
                        <input className="form-input" type="number" min={1000} max={10000} step={500}
                            value={s.structure.wordsPerChapter} onChange={e => update('structure.wordsPerChapter', Number(e.target.value))} />
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            웹소설 기준: 3000~5000자가 일반적
                        </div>
                    </div>

                    <div className="form-group">
                        <label>권당 챕터 수</label>
                        <input className="form-input" type="number" min={5} max={100}
                            value={s.structure.chaptersPerVolume} onChange={e => update('structure.chaptersPerVolume', Number(e.target.value))} />
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <Toggle label="시즌제" value={s.structure.useSeason}
                            onChange={v => update('structure.useSeason', v)}
                            description="시즌별로 나눠 각 시즌마다 고유한 테마/결말 설정" />
                    </div>

                    {s.structure.useSeason && (
                        <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                            <div className="form-group">
                                <label>총 시즌 수</label>
                                <input className="form-input" type="number" min={1} max={20}
                                    value={s.structure.totalSeasons} onChange={e => update('structure.totalSeasons', Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                                <label>시즌당 권수</label>
                                <input className="form-input" type="number" min={1} max={50}
                                    value={s.structure.volumesPerSeason} onChange={e => update('structure.volumesPerSeason', Number(e.target.value))} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 0' }}>
                                총 {s.structure.totalSeasons}시즌 × {s.structure.volumesPerSeason}권 = <strong>{s.structure.totalSeasons * s.structure.volumesPerSeason}권</strong>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== 세계관 설정 ==================== */}
            {activeSection === 'world' && (
                <div className="fade-in">
                    <SectionTitle emoji="🌍" title="세계관 설정" />

                    <div className="form-group">
                        <label>시대 배경</label>
                        <input className="form-input" placeholder="예: 고대 중원, 중세 판타지, 현대 대한민국"
                            value={s.worldBuilding.era} onChange={e => update('worldBuilding.era', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>기술 수준</label>
                        <input className="form-input" placeholder="예: 냉병기 시대, 마법 문명, 현대 + 마법"
                            value={s.worldBuilding.techLevel} onChange={e => update('worldBuilding.techLevel', e.target.value)} />
                    </div>

                    <SelectField label="지리적 규모" value={s.worldBuilding.geographicScale}
                        options={['도시', '국가', '대륙', '다중 세계', '우주']}
                        onChange={v => update('worldBuilding.geographicScale', v)} />

                    <div className="form-group">
                        <label>사회 구조</label>
                        <input className="form-input" placeholder="예: 강호 사회, 봉건 왕국, 현대 + 헌터 시스템"
                            value={s.worldBuilding.socialStructure} onChange={e => update('worldBuilding.socialStructure', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>세력 구조</label>
                        <input className="form-input" placeholder="예: 정사대립, 다왕국, 길드 시스템"
                            value={s.worldBuilding.factionStructure} onChange={e => update('worldBuilding.factionStructure', e.target.value)} />
                    </div>

                    <SectionTitle emoji="⚔️" title="파워 시스템" />

                    <div className="form-group">
                        <label>파워 시스템 이름</label>
                        <input className="form-input" placeholder="예: 내공, 마나, 오라"
                            value={s.worldBuilding.powerSystem?.name || ''} onChange={e => update('worldBuilding.powerSystem', { ...s.worldBuilding.powerSystem, name: e.target.value })} />
                    </div>

                    <SelectField label="매직 시스템 유형"
                        value={s.worldBuilding.powerSystem?.hardOrSoft || '혼합'}
                        options={['하드 매직', '소프트 매직', '혼합']}
                        onChange={v => update('worldBuilding.powerSystem', { ...s.worldBuilding.powerSystem, hardOrSoft: v })} />

                    <div className="form-group">
                        <label>단계 (쉼표로 구분)</label>
                        <input className="form-input" placeholder="예: 후천경, 선천경, 화경, 현경, 절정"
                            value={(s.worldBuilding.powerSystem?.levels || []).join(', ')}
                            onChange={e => update('worldBuilding.powerSystem', {
                                ...s.worldBuilding.powerSystem,
                                levels: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean),
                            })} />
                    </div>

                    <div className="form-group">
                        <label>파워 시스템 설명</label>
                        <textarea className="form-textarea" placeholder="파워 시스템의 핵심 규칙과 제한 사항..."
                            value={s.worldBuilding.powerSystem?.description || ''} rows={3}
                            onChange={e => update('worldBuilding.powerSystem', { ...s.worldBuilding.powerSystem, description: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>초자연적 요소 (쉼표로 구분)</label>
                        <input className="form-input" placeholder="예: 몬스터, 던전, 정령, 마족"
                            value={(s.worldBuilding.supernaturalElements || []).join(', ')}
                            onChange={e => update('worldBuilding.supernaturalElements', e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} />
                    </div>
                </div>
            )}

            {/* Save button */}
            {dirty && (
                <div style={{
                    position: 'sticky', bottom: 0, padding: '12px 0',
                    background: 'var(--bg-secondary)',
                }}>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>
                        💾 설정 저장
                    </button>
                </div>
            )}
        </div>
    );
}
