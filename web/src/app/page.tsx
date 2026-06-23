/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string | null;
  stock: number;
  type?: "PHYSICAL" | "DIGITAL";
  pdfUrl?: string | null;
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<"books" | "theses">("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "books") {
        let url = `/api/books?q=${encodeURIComponent(searchQuery)}`;
        if (selectedCategory) url += `&categoryId=${selectedCategory}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setBooks(json.data || json);
        }
      } else {
        const res = await fetch(`/api/thesis?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setTheses(json.data || json);
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, selectedCategory]);

  const handleReserveBook = async (bookId: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg("Reservasi berhasil dibuat");
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        alert(data.message || "Gagal melakukan reservasi");
      }
    } catch (e) {
      alert("Terjadi kesalahan server");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-primary">
              PerpusDigital
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink-secondary hidden md:inline-block">
                  {user.name}
                </span>
                <Link
                  href={user.role === "STUDENT" ? "/mahasiswa" : "/admin"}
                  className="bg-primary text-white hover:bg-accent-hover transition-colors rounded-md px-4 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-primary text-white hover:bg-accent-hover transition-colors rounded-md px-4 py-2.5 text-sm font-medium"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-bg-subtle py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4 max-w-3xl mx-auto leading-tight">
            Katalog Buku & Repository Skripsi
          </h1>
          <p className="max-w-2xl mx-auto text-base text-ink-secondary mb-8">
            Akses katalog buku perpustakaan dan repositori karya ilmiah mahasiswa secara online.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={
                activeTab === "books"
                  ? "Cari buku berdasarkan judul, penulis, penerbit..."
                  : "Cari skripsi berdasarkan judul, jurusan, penulis..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border mb-8">
          <button
            onClick={() => {
              setActiveTab("books");
              setSearchQuery("");
            }}
            className={`px-5 py-3.5 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "books"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Katalog Buku
          </button>
          <button
            onClick={() => {
              setActiveTab("theses");
              setSearchQuery("");
            }}
            className={`px-5 py-3.5 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "theses"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Repository Skripsi
          </button>
        </div>

        {/* Action Message */}
        {actionMsg && (
          <div className="mb-6 bg-success-bg border border-success/20 text-success p-3 rounded-md text-sm">
            {actionMsg}
          </div>
        )}

        {/* Category Filter */}
        {activeTab === "books" && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-white border-primary"
                  : "bg-bg text-ink-secondary border-border hover:border-border-strong"
              }`}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  selectedCategory === c.id
                    ? "bg-primary text-white border-primary"
                    : "bg-bg text-ink-secondary border-border hover:border-border-strong"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-ink-muted text-sm">Memuat data...</p>
          </div>
        ) : activeTab === "books" ? (
          books.length === 0 ? (
            <div className="text-center py-20 bg-bg-subtle border border-dashed border-border rounded-lg">
              <p className="text-ink-muted text-sm">Tidak ada buku yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-bg rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-[4/3] w-full bg-bg-muted relative overflow-hidden flex items-center justify-center">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-sm text-ink-muted">Tidak ada cover</span>
                    )}
                    <span
                      className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded ${
                        book.type === "DIGITAL"
                          ? "bg-info-bg text-info"
                          : book.stock > 0
                            ? "bg-success-bg text-success"
                            : "bg-danger-bg text-danger"
                      }`}
                    >
                      {book.type === "DIGITAL" ? "Digital" : (book.stock > 0 ? `Stok: ${book.stock}` : "Habis")}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-ink line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-ink-secondary mt-1">{book.author}</p>
                      <p className="text-sm text-ink-muted mt-0.5">{book.publisher}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-border flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <span>ISBN: {book.isbn || "-"}</span>
                        <span>{book.year}</span>
                      </div>
                      
                      {book.type === "DIGITAL" && book.pdfUrl ? (
                        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-3 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-accent-hover transition-colors">
                          Baca PDF
                        </a>
                      ) : (
                        <button onClick={() => handleReserveBook(book.id)} disabled={book.stock > 0} className="block w-full text-center px-3 py-2 bg-bg-muted text-ink rounded-md text-sm font-medium hover:bg-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          {book.stock > 0 ? "Tersedia (Pinjam Offline)" : "Reservasi Antrian"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          theses.length === 0 ? (
            <div className="text-center py-20 bg-bg-subtle border border-dashed border-border rounded-lg">
              <p className="text-ink-muted text-sm">Tidak ada skripsi yang ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {theses.map((thesis) => (
                <div
                  key={thesis.id}
                  className="bg-bg rounded-lg border border-border p-5 hover:shadow-sm transition-shadow flex flex-col md:flex-row md:items-start justify-between gap-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary-lighter text-primary">
                        {thesis.department}
                      </span>
                      <span className="text-sm text-ink-muted">Tahun: {thesis.year}</span>
                    </div>
                    <h3 className="text-base font-semibold text-ink mb-2">{thesis.title}</h3>
                    <p className="text-sm text-ink-secondary mb-3">
                      Penulis: <strong className="text-ink">{thesis.authorName}</strong> &mdash; Pembimbing:{" "}
                      {thesis.advisor1} {thesis.advisor2 ? `& ${thesis.advisor2}` : ""}
                    </p>
                    <div className="bg-bg-subtle p-3 rounded-md border border-border">
                      <p className="text-xs font-medium text-ink-secondary mb-1">Abstrak</p>
                      <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3">
                        {thesis.abstract}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:w-40 gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedThesis(thesis)}
                      className="px-4 py-2.5 text-center text-sm font-medium rounded-md bg-primary hover:bg-accent-hover text-white transition-colors cursor-pointer"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-subtle py-8 text-center text-sm text-ink-muted">
        <p>&copy; {new Date().getFullYear()} PerpusDigital. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>

      {/* Detail Thesis Modal */}
      {selectedThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-bg border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedThesis(null)}
              className="absolute top-4 right-4 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              Tutup
            </button>

            <div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary-lighter text-primary">
                {selectedThesis.department}
              </span>
              <h2 className="text-lg font-semibold text-ink mt-3 mb-2 leading-snug">
                {selectedThesis.title}
              </h2>
              <p className="text-sm text-ink-secondary mb-4">
                Penulis: <strong className="text-ink">{selectedThesis.authorName}</strong> &mdash; Tahun: {selectedThesis.year}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-secondary mb-5 bg-bg-subtle p-4 border border-border rounded-md">
                <div>
                  <span className="text-xs font-medium text-ink-muted block">Dosen Pembimbing 1</span>
                  <span className="text-ink block mt-0.5">{selectedThesis.advisor1}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-ink-muted block">Dosen Pembimbing 2</span>
                  <span className="text-ink block mt-0.5">{selectedThesis.advisor2 || "-"}</span>
                </div>
              </div>

              <div className="bg-bg-subtle p-4 rounded-md border border-border mb-5">
                <p className="text-xs font-medium text-ink-muted mb-1">Abstrak</p>
                <p className="text-sm text-ink-secondary leading-relaxed max-h-40 overflow-y-auto">
                  {selectedThesis.abstract}
                </p>
              </div>

              {/* Chapters List */}
              <div className="border-t border-border pt-5">
                <h4 className="text-sm font-semibold text-ink mb-4">
                  Daftar Bab & Unduh Berkas
                </h4>

                <div className="space-y-2">
                  {!selectedThesis.chapters || selectedThesis.chapters.length === 0 ? (
                    <div className="flex items-center justify-between p-3 bg-bg-subtle border border-border rounded-md">
                      <span className="text-sm text-ink">Dokumen Lengkap (Full Text)</span>
                      {selectedThesis.pdfPath ? (
                        <a
                          href={selectedThesis.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary hover:bg-accent-hover text-white transition-colors"
                        >
                          Buka PDF
                        </a>
                      ) : (
                        <span className="text-sm text-ink-muted">Tidak tersedia</span>
                      )}
                    </div>
                  ) : (
                    selectedThesis.chapters.map((ch) => {
                      const isChapterLocked = ch.isLocked;
                      const canAccess = !isChapterLocked || user !== null;

                      return (
                        <div
                          key={ch.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-bg-subtle border border-border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink">{ch.chapterName}</span>
                            {isChapterLocked && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-warning-bg text-warning">
                                Terkunci
                              </span>
                            )}
                          </div>

                          {canAccess ? (
                            <a
                              href={ch.pdfPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary hover:bg-accent-hover text-white transition-colors shrink-0"
                            >
                              Baca Bab
                            </a>
                          ) : (
                            <Link
                              href="/login"
                              className="px-3 py-1.5 text-sm font-medium rounded-md bg-bg-muted text-ink-muted border border-border hover:bg-border transition-colors shrink-0"
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
