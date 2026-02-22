import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "NovelForge | AI 장편소설 창작 도구",
  description: "30권 이상의 장편 웹소설을 AI와 함께 창작하세요. 무협, 판타지, 현대판타지 장르 지원.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="app-header">
          <a href="/" className="logo">
            📚 <span>NovelForge</span>
          </a>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <a href="/" className="btn btn-secondary btn-sm">프로젝트</a>
            <a href="/personas" className="btn btn-secondary btn-sm">페르소나</a>
          </nav>
        </header>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

