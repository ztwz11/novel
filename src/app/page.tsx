'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  title: string;
  genre: string;
  description: string;
  target_volumes: number;
  persona_name?: string;
  created_at: string;
  updated_at: string;
}

interface GenrePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface Persona {
  id: string;
  name: string;
  genre: string;
}

const GENRE_MAP: Record<string, { name: string; emoji: string }> = {
  murim: { name: '무협', emoji: '🥋' },
  fusion_murim: { name: '퓨전무협', emoji: '⚔️' },
  traditional_fantasy: { name: '정통판타지', emoji: '🐉' },
  modern_fantasy: { name: '현대판타지', emoji: '🏙️' },
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [genres, setGenres] = useState<GenrePreset[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPersonaId, setNewPersonaId] = useState('');
  const [newTargetVolumes, setNewTargetVolumes] = useState(30);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
    fetch('/api/genres').then(r => r.json()).then(setGenres);
    fetch('/api/personas').then(r => r.json()).then(setPersonas);
  }, []);

  const createProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        genre: newGenre,
        description: newDescription,
        personaId: newPersonaId || null,
        targetVolumes: newTargetVolumes,
      }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects(prev => [project, ...prev]);
      setShowModal(false);
      setNewTitle('');
      setNewGenre('');
      setNewDescription('');
      window.location.href = `/project/${project.id}`;
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="main-content fade-in">
      <div className="section-header">
        <div>
          <h2>📚 내 소설 프로젝트</h2>
          <p>AI와 함께 장편 웹소설을 창작하세요</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
          ✨ 새 소설 시작
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">✍️</div>
          <h3>아직 프로젝트가 없습니다</h3>
          <p>새 소설을 시작하여 AI와 함께 장편 웹소설을 창작해보세요.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            ✨ 첫 소설 시작하기
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map(project => {
            const genre = GENRE_MAP[project.genre];
            return (
              <div key={project.id} className="card" style={{ cursor: 'pointer', position: 'relative' }}>
                <a href={`/project/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    {genre && (
                      <span className={`genre-tag ${project.genre}`}>
                        {genre.emoji} {genre.name}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      목표 {project.target_volumes}권
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{project.title}</h3>
                  {project.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                      {project.description.length > 80 ? project.description.slice(0, 80) + '...' : project.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{project.persona_name ? `🎭 ${project.persona_name}` : ''}</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </a>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: 12, right: 12, opacity: 0.7 }}
                  onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* New project modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <h3>✨ 새 소설 프로젝트</h3>

            <div className="form-group">
              <label>작품 제목</label>
              <input className="form-input" placeholder="예: 천마의 귀환" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>장르</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {genres.map(g => (
                  <div
                    key={g.id}
                    onClick={() => setNewGenre(g.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${newGenre === g.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: newGenre === g.id ? 'var(--accent-glow)' : 'var(--bg-input)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{g.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{g.description.slice(0, 30)}...</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>작품 설명 (선택)</label>
              <textarea className="form-textarea" placeholder="이 소설의 핵심 컨셉이나 줄거리..." value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} />
            </div>

            <div className="form-group">
              <label>목표 권수</label>
              <input className="form-input" type="number" min={1} max={100} value={newTargetVolumes} onChange={e => setNewTargetVolumes(Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label>페르소나 (선택)</label>
              <select className="form-select" value={newPersonaId} onChange={e => setNewPersonaId(e.target.value)}>
                <option value="">기본 (장르 프리셋 사용)</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={createProject} disabled={!newTitle || !newGenre}>
                ✨ 프로젝트 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
