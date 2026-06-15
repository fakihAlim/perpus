"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string | null;
  stock: number;
  coverUrl: string | null;
}

interface Thesis {
  id: number;
  title: string;
  abstract: string;
  authorName: string;
  advisor1: string;
  advisor2: string | null;
  department: string;
  year: number;
  pdfPath: string | null;
  status: string;
  createdAt: string;
  chapters?: ThesisChapter[];
}

interface ThesisChapter {
  id: number;
  chapterName: string;
  pdfPath: string;
  isLocked: boolean;
}

// Mascot stickers removed to match minimalist branding

export default function Home() {
  const [activeTab, setActiveTab] = useState<"books" | "theses">("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "books") {
        const res = await fetch(`/api/books?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        }
      } else {
        const res = await fetch(`/api/thesis?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setTheses(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface-canvas-dark text-on-primary flex flex-col font-sans relative">
      
      {/* Decorative Starfield Texture - Pure CSS background points */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* System Canvas */}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-hairline-violet bg-surface-canvas-dark/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight font-display text-white">
              PERPUS<span className="text-accent-lime font-mono">_</span>DIGITAL
            </span>
            <span className="hidden sm:inline-block font-mono text-[9px] bg-surface-night border border-hairline-violet text-accent-pink px-2 py-0.5 rounded-full uppercase tracking-wider">
              v1.0.0-Stable
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-on-dark-muted hidden md:inline-block font-mono">
                  SESSION: <strong className="text-accent-lime font-sans font-medium">{user.name.toUpperCase()}</strong> ({user.role})
                </span>
                <Link
                  href={user.role === "STUDENT" ? "/mahasiswa" : "/admin"}
                  className="bg-white text-primary hover:bg-surface-press-light transition-all rounded-md px-4 py-2 font-bold uppercase tracking-[0.2px] text-xs shadow-sm shadow-black/20"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-mono text-xs font-bold uppercase tracking-[0.2px] text-on-dark-muted hover:text-white transition-colors"
                >
                  [Exit]
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-white text-primary hover:bg-surface-press-light transition-all rounded-md px-4 py-2.5 font-bold uppercase tracking-[0.2px] text-xs shadow-lg shadow-black/30"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 bg-gradient-to-b from-surface-canvas-dark via-surface-canvas-dark to-primary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block font-mono text-[10px] bg-accent-violet-deep border border-hairline-violet text-white px-3 py-1 rounded-full uppercase tracking-[0.2px] mb-6">
            [SYS_OBSERVABILITY_&_REPOSITORY_CORE]
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 font-display text-white max-w-4xl mx-auto leading-none">
            Temukan Pengetahuan & Repository{" "}
            <span className="bg-accent-lime text-primary rounded-xs font-display px-3.5 py-0.5 inline-block select-none transform rotate-[-1deg]">
              Skripsi
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-on-dark-muted mb-10 font-sans leading-relaxed">
            Akses katalog buku perpustakaan secara transparan, serta repositori karya ilmiah mahasiswa (EPrints) yang terverifikasi dan aman.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto bg-surface-night/85 p-2 rounded-xl border border-hairline-violet shadow-2xl backdrop-blur-md flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-3.5 text-slate-500 font-mono text-sm">&gt;</span>
              <input
                type="text"
                placeholder={
                  activeTab === "books"
                    ? "Cari buku berdasarkan judul, penulis, penerbit..."
                    : "Cari skripsi berdasarkan judul, jurusan, penulis, abstrak..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-8 pr-4 py-3 rounded-lg text-white placeholder-slate-600 focus:outline-none text-sm font-sans"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center border-b border-hairline-violet mb-10">
          <button
            onClick={() => {
              setActiveTab("books");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-xs font-bold uppercase tracking-[0.2px] transition-all ${
              activeTab === "books"
                ? "border-accent-lime text-accent-lime font-extrabold"
                : "border-transparent text-on-dark-muted hover:text-white"
            }`}
          >
            Katalog Buku
          </button>
          <button
            onClick={() => {
              setActiveTab("theses");
              setSearchQuery("");
            }}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-xs font-bold uppercase tracking-[0.2px] transition-all ${
              activeTab === "theses"
                ? "border-accent-lime text-accent-lime font-extrabold"
                : "border-transparent text-on-dark-muted hover:text-white"
            }`}
          >
            Repository Skripsi
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-accent-lime border-t-transparent rounded-full animate-spin"></div>
            <p className="text-on-dark-muted text-xs font-mono uppercase tracking-[0.2px]">SYSTEM_LOADING...</p>
          </div>
        ) : activeTab === "books" ? (
          // Books Grid
          books.length === 0 ? (
            <div className="text-center py-20 bg-surface-night border border-dashed border-hairline-violet rounded-xl">
              <p className="text-on-dark-muted font-mono text-xs uppercase tracking-[0.2px]">[NO_BOOKS_MATCHED_THE_QUERY]</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="group relative bg-surface-night rounded-xl border border-hairline-violet overflow-hidden hover:border-slate-700 transition-all flex flex-col"
                >
                  <div className="aspect-[4/3] w-full bg-primary/60 relative overflow-hidden flex items-center justify-center border-b border-hairline-violet">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">[NO_COVER]</span>
                    )}
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        book.stock > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {book.stock > 0 ? `QTY: ${book.stock}` : "OUT_OF_STOCK"}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-accent-lime transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-on-dark-muted mt-1 font-sans">Penulis: {book.author}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">Penerbit: {book.publisher}</p>
                    </div>
                    <div className="pt-4 border-t border-hairline-violet flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>ISBN: {book.isbn || "-"}</span>
                      <span>YEAR: {book.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Theses List
          theses.length === 0 ? (
            <div className="text-center py-20 bg-surface-night border border-dashed border-hairline-violet rounded-xl">
              <p className="text-on-dark-muted font-mono text-xs uppercase tracking-[0.2px]">[NO_THESES_MATCHED_THE_QUERY]</p>
            </div>
          ) : (
            <div className="space-y-4">
              {theses.map((thesis) => (
                <div
                  key={thesis.id}
                  className="bg-surface-night rounded-xl border border-hairline-violet p-6 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-violet-deep text-white border border-hairline-violet uppercase">
                        {thesis.department}
                      </span>
                      <span className="text-xs text-on-dark-muted">Tahun: {thesis.year}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 font-display">{thesis.title}</h3>
                    <p className="text-xs text-on-dark-muted mb-4 font-sans">
                      Penulis: <strong className="text-slate-200">{thesis.authorName}</strong> | Dosen Pembimbing:{" "}
                      {thesis.advisor1} {thesis.advisor2 ? `& ${thesis.advisor2}` : ""}
                    </p>
                    <div className="bg-primary/50 p-4 rounded-lg border border-hairline-violet">
                      <h4 className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase mb-1">Abstrak</h4>
                      <p className="text-xs text-on-dark-muted leading-relaxed font-sans">
                        {thesis.abstract}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:w-48 gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedThesis(thesis)}
                      className="px-4 py-2.5 text-center text-xs font-bold rounded bg-white hover:bg-surface-press-light text-primary transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-[0.2px] cursor-pointer"
                    >
                      Buka Detail & Bab
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Decorative Lime Squiggly Footer Divider */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pointer-events-none">
        <svg 
          className="w-full h-6 text-accent-lime" 
          viewBox="0 0 1200 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          preserveAspectRatio="none"
        >
          <path d="M0,12 C100,2 150,22 250,12 C350,2 400,22 500,12 C600,2 650,22 750,12 C850,2 900,22 1000,12 C1100,2 1150,22 1200,12" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="border-t border-hairline-violet bg-surface-night py-10 text-center text-xs text-slate-500 relative">
        <p>&copy; {new Date().getFullYear()} PerpusDigital. Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="mt-1 text-slate-600 font-mono text-[10px]">
          POWERED BY NEXT.JS + TAILWIND CSS v4 + PRISMA ORM
        </p>
      </footer>

      {/* Detail Thesis Modal */}
      {selectedThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-night border border-hairline-violet rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative flex flex-col justify-between">
            <button
              onClick={() => setSelectedThesis(null)}
              className="absolute top-4 right-4 text-xs font-mono font-bold uppercase text-on-dark-muted hover:text-white transition-colors"
            >
              [Tutup]
            </button>

            <div className="flex-grow">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent-violet-deep text-white border border-hairline-violet uppercase">
                {selectedThesis.department}
              </span>
              <h2 className="text-xl font-bold text-white mt-3 mb-2 font-display leading-snug">
                {selectedThesis.title}
              </h2>
              <p className="text-xs text-on-dark-muted mb-4">
                Penulis: <strong className="text-slate-200">{selectedThesis.authorName}</strong> | Tahun: {selectedThesis.year}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-on-dark-muted mb-6 bg-primary/40 p-4 border border-hairline-violet rounded-lg">
                <div>
                  <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Dosen Pembimbing 1</span>
                  <span className="text-white font-medium block mt-0.5">{selectedThesis.advisor1}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Dosen Pembimbing 2</span>
                  <span className="text-white font-medium block mt-0.5">{selectedThesis.advisor2 || "-"}</span>
                </div>
              </div>

              <div className="bg-primary/50 p-4 rounded-lg border border-hairline-violet mb-6">
                <h4 className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase mb-2">Abstrak</h4>
                <p className="text-xs text-on-dark-muted leading-relaxed font-sans max-h-40 overflow-y-auto">
                  {selectedThesis.abstract}
                </p>
              </div>

              {/* Chapters List */}
              <div className="border-t border-hairline-violet pt-6">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4">
                  Daftar Bab & Unduh Berkas
                </h4>

                <div className="space-y-3">
                  {!selectedThesis.chapters || selectedThesis.chapters.length === 0 ? (
                    <div className="flex items-center justify-between p-3.5 bg-primary/50 border border-hairline-violet rounded-lg">
                      <span className="text-xs font-medium text-white font-mono">Dokumen Lengkap (Full Text)</span>
                      {selectedThesis.pdfPath ? (
                        <a
                          href={selectedThesis.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-center text-xs font-bold rounded bg-white hover:bg-surface-press-light text-primary transition-all font-mono uppercase tracking-wider"
                        >
                          Buka PDF
                        </a>
                      ) : (
                        <span className="text-xs font-mono text-slate-500 uppercase">[KOSONG]</span>
                      )}
                    </div>
                  ) : (
                    selectedThesis.chapters.map((ch) => {
                      const isChapterLocked = ch.isLocked;
                      const canAccess = !isChapterLocked || user !== null;

                      return (
                        <div
                          key={ch.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-primary/50 border border-hairline-violet rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white font-mono">{ch.chapterName}</span>
                            {isChapterLocked && (
                              <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Terkunci
                              </span>
                            )}
                          </div>

                          {canAccess ? (
                            <a
                              href={ch.pdfPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-center text-xs font-bold rounded bg-white hover:bg-surface-press-light text-primary transition-all font-mono uppercase tracking-wider shrink-0"
                            >
                              Baca Bab
                            </a>
                          ) : (
                            <Link
                              href="/login"
                              className="px-4 py-2 text-center text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all font-mono uppercase tracking-wider shrink-0"
                            >
                              Login untuk Membaca
                            </Link>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
