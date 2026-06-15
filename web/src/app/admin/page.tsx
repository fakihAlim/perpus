"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Borrowing {
  id: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  book: {
    id: number;
    title: string;
    author: string;
  };
}

interface Thesis {
  id: number;
  title: string;
  authorName: string;
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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string | null;
  stock: number;
}

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<"borrowings" | "theses" | "guests" | "books">("borrowings");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data States
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [guests, setGuests] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Forms States
  // 1. Borrowing Form
  const [borrowUserId, setBorrowUserId] = useState("");
  const [borrowBookId, setBorrowBookId] = useState("");
  const [borrowDays, setBorrowDays] = useState("7");
  // 2. Add Book Form
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookYear, setBookYear] = useState(new Date().getFullYear().toString());
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookStock, setBookStock] = useState("1");
  const [bookCoverUrl, setBookCoverUrl] = useState("");

  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedVerifyThesis, setSelectedVerifyThesis] = useState<Thesis | null>(null);
  const [chapterLocks, setChapterLocks] = useState<{ id: number; chapterName: string; isLocked: boolean }[]>([]);

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingThesis, setEditingThesis] = useState<Thesis | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parseUser = JSON.parse(storedUser);
    if (parseUser.role !== "ADMIN" && parseUser.role !== "LIBRARIAN") {
      router.push("/");
      return;
    }

    setCurrentUser(parseUser);
    loadAllData(token);
  }, [activeSubTab]);

  const loadAllData = async (token: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (activeSubTab === "borrowings") {
        const res = await fetch("/api/borrowings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setBorrowings(await res.json());
      } else if (activeSubTab === "theses") {
        const res = await fetch("/api/thesis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setTheses(await res.json());
      } else if (activeSubTab === "guests") {
        const res = await fetch("/api/users?role=GUEST", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setGuests(await res.json());
      } else if (activeSubTab === "books") {
        const res = await fetch("/api/books");
        if (res.ok) setBooks(await res.json());
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/borrowings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: borrowUserId,
          bookId: borrowBookId,
          days: borrowDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal mencatat peminjaman");
        return;
      }

      setActionMsg("Peminjaman berhasil dicatat!");
      setBorrowUserId("");
      setBorrowBookId("");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleReturnBook = async (borrowingId: number) => {
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/borrowings/${borrowingId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal mencatat pengembalian");
        return;
      }

      setActionMsg(data.message || "Buku berhasil dikembalikan!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleVerifyThesis = async (thesisId: number, status: "APPROVED" | "REJECTED") => {
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/thesis/${thesisId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal memverifikasi skripsi");
        return;
      }

      setActionMsg(data.message || "Skripsi berhasil diverifikasi!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleOpenVerifyModal = (thesis: Thesis) => {
    setSelectedVerifyThesis(thesis);
    if (thesis.chapters) {
      setChapterLocks(
        thesis.chapters.map((ch) => ({
          id: ch.id,
          chapterName: ch.chapterName,
          isLocked: ch.isLocked,
        }))
      );
    } else {
      setChapterLocks([]);
    }
  };

  const handleToggleLock = (id: number) => {
    setChapterLocks((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isLocked: !ch.isLocked } : ch))
    );
  };

  const handleApproveThesis = async () => {
    if (!selectedVerifyThesis) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/thesis/${selectedVerifyThesis.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "APPROVED",
          chaptersConfig: chapterLocks.map((lock) => ({
            id: lock.id,
            isLocked: lock.isLocked,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal memverifikasi skripsi");
        return;
      }

      setActionMsg("Skripsi berhasil disetujui, dikonfigurasi kunci babnya, dan diterbitkan!");
      setSelectedVerifyThesis(null);
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleVerifyGuest = async (userId: number, status: "APPROVED" | "REJECTED") => {
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal memperbarui status user");
        return;
      }

      setActionMsg(data.message || "Status pengguna berhasil diperbarui!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          publisher: bookPublisher,
          year: bookYear,
          isbn: bookIsbn,
          stock: bookStock,
          coverUrl: bookCoverUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal menambah buku");
        return;
      }

      setActionMsg("Buku baru berhasil ditambahkan!");
      setBookTitle("");
      setBookAuthor("");
      setBookPublisher("");
      setBookIsbn("");
      setBookStock("1");
      setBookCoverUrl("");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!window.confirm("Peringatan: Apakah Anda yakin ingin menghapus data buku ini secara permanen?")) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal menghapus buku");
        return;
      }

      setActionMsg("Buku berhasil dihapus!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleDeleteThesis = async (thesisId: number) => {
    if (!window.confirm("Peringatan: Apakah Anda yakin ingin menghapus skripsi ini beserta semua file PDF-nya secara permanen?")) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/thesis/${thesisId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal menghapus skripsi");
        return;
      }

      setActionMsg("Skripsi berhasil dihapus!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Peringatan: Apakah Anda yakin ingin menghapus data tamu ini secara permanen?")) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal menghapus pengguna");
        return;
      }

      setActionMsg("Pengguna berhasil dihapus!");
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const submitEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingBook.title,
          author: editingBook.author,
          publisher: editingBook.publisher,
          year: editingBook.year,
          isbn: editingBook.isbn,
          stock: editingBook.stock,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal mengedit buku");
        return;
      }

      setActionMsg("Data buku berhasil diperbarui!");
      setEditingBook(null);
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const submitEditThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThesis) return;
    setActionMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/thesis/${editingThesis.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingThesis.title,
          department: editingThesis.department,
          year: editingThesis.year,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal mengedit skripsi");
        return;
      }

      setActionMsg("Metadata skripsi berhasil diperbarui!");
      setEditingThesis(null);
      if (token) loadAllData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi gagal");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-surface-canvas-dark text-on-primary flex flex-col font-sans relative">
      
      {/* Decorative Starfield background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-hairline-violet bg-surface-canvas-dark/95 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight font-display text-white">
              PERPUS<span className="text-accent-lime font-mono">_</span>DIGITAL - STAFF
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-on-dark-muted font-mono">
              PETUGAS: <strong className="text-accent-lime font-sans font-medium">{currentUser?.name.toUpperCase()}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.2px] text-on-dark-muted hover:text-white px-3 py-1.5 rounded border border-hairline-violet bg-primary/40 transition-colors"
            >
              [Exit]
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Navigation Sidebar/Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline-violet pb-4 mb-6">
          <button
            onClick={() => setActiveSubTab("borrowings")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2px] transition-all ${
              activeSubTab === "borrowings"
                ? "bg-accent-violet-deep text-white border border-hairline-violet"
                : "bg-primary/40 text-on-dark-muted hover:text-white"
            }`}
          >
            Peminjaman Buku
          </button>
          <button
            onClick={() => setActiveSubTab("theses")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2px] transition-all ${
              activeSubTab === "theses"
                ? "bg-accent-violet-deep text-white border border-hairline-violet"
                : "bg-primary/40 text-on-dark-muted hover:text-white"
            }`}
          >
            Verifikasi Skripsi
          </button>
          <button
            onClick={() => setActiveSubTab("guests")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2px] transition-all ${
              activeSubTab === "guests"
                ? "bg-accent-violet-deep text-white border border-hairline-violet"
                : "bg-primary/40 text-on-dark-muted hover:text-white"
            }`}
          >
            Persetujuan Tamu
          </button>
          <button
            onClick={() => setActiveSubTab("books")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2px] transition-all ${
              activeSubTab === "books"
                ? "bg-accent-violet-deep text-white border border-hairline-violet"
                : "bg-primary/40 text-on-dark-muted hover:text-white"
            }`}
          >
            Kelola Buku
          </button>
        </div>

        {/* Action/Error Alerts */}
        {actionMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded text-xs font-mono uppercase tracking-[0.2px]">
            [SUCCESS]: {actionMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded text-xs font-mono uppercase tracking-[0.2px]">
            [ERROR]: {errorMsg}
          </div>
        )}

        {/* Dynamic Tab Render */}
        {loading ? (
          <div className="text-center py-20 text-on-dark-muted font-mono text-xs uppercase tracking-[0.2px]">PROCESSING_DATA...</div>
        ) : activeSubTab === "borrowings" ? (
          /* Peminjaman Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-surface-night border border-hairline-violet rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-6 font-display">Daftar Transaksi Peminjaman</h3>
              
              {borrowings.length === 0 ? (
                <div className="text-center py-10 text-on-dark-muted text-xs font-mono uppercase tracking-[0.2px]">NO_LOAN_RECORDS</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[10px] uppercase font-mono bg-primary/60 text-slate-400 border-b border-hairline-violet">
                      <tr>
                        <th className="px-4 py-3">Peminjam</th>
                        <th className="px-4 py-3">Buku</th>
                        <th className="px-4 py-3">Tgl Pinjam</th>
                        <th className="px-4 py-3">Batas Kembali</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Denda</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline-violet/40">
                      {borrowings.map((b) => (
                        <tr key={b.id} className="hover:bg-primary/20 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-white">{b.user.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">UID: {b.user.id}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-200 line-clamp-1">{b.book.title}</div>
                            <div className="text-[10px] font-mono text-slate-500">BID: {b.book.id}</div>
                          </td>
                          <td className="px-4 py-4 font-mono">{new Date(b.borrowDate).toLocaleDateString("id-ID")}</td>
                          <td className="px-4 py-4 font-mono text-accent-pink">{new Date(b.dueDate).toLocaleDateString("id-ID")}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${
                                b.status === "RETURNED"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {b.status === "RETURNED" ? "RETURNED" : "BORROWED"}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono text-accent-lime">
                            {b.fine > 0 ? `Rp ${b.fine.toLocaleString("id-ID")}` : "-"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {b.status === "BORROWED" && (
                              <button
                                onClick={() => handleReturnBook(b.id)}
                                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors"
                              >
                                Kembali
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-surface-night border border-hairline-violet rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4 font-display">Catat Peminjaman Baru</h3>
              <form onSubmit={handleCreateBorrowing} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">ID Anggota</label>
                  <input
                    type="number"
                    required
                    placeholder="User ID Anggota"
                    value={borrowUserId}
                    onChange={(e) => setBorrowUserId(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">ID Buku</label>
                  <input
                    type="number"
                    required
                    placeholder="Book ID Buku"
                    value={borrowBookId}
                    onChange={(e) => setBorrowBookId(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Durasi (Hari)</label>
                  <input
                    type="number"
                    required
                    value={borrowDays}
                    onChange={(e) => setBorrowDays(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-md text-xs font-bold uppercase tracking-[0.2px] bg-white hover:bg-surface-press-light text-primary transition-all shadow-sm"
                >
                  SIMPAN_TRANSAKSI
                </button>
              </form>
            </div>
          </div>
        ) : activeSubTab === "theses" ? (
          /* Verifikasi Skripsi Tab */
          <div className="bg-surface-night border border-hairline-violet rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-6 font-display">Persetujuan Mandiri Skripsi (Repository)</h3>
            
            {theses.length === 0 ? (
              <div className="text-center py-10 text-on-dark-muted text-xs font-mono uppercase tracking-[0.2px]">NO_THESES_FOR_REVIEW</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase font-mono bg-primary/60 text-slate-400 border-b border-hairline-violet">
                    <tr>
                      <th className="px-4 py-3">Skripsi</th>
                      <th className="px-4 py-3">Penulis / Jurusan</th>
                      <th className="px-4 py-3">Tahun</th>
                      <th className="px-4 py-3">Berkas</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-violet/40">
                    {theses.map((t) => (
                      <tr key={t.id} className="hover:bg-primary/20 transition-colors">
                        <td className="px-4 py-4 md:max-w-xs">
                          <div className="font-semibold text-white line-clamp-1">{t.title}</div>
                          <div className="text-[10px] font-mono text-slate-500">UPLOADED: {new Date(t.createdAt).toLocaleDateString("id-ID")}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-200">{t.authorName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{t.department}</div>
                        </td>
                        <td className="px-4 py-4 font-mono">{t.year}</td>
                        <td className="px-4 py-4">
                          <a
                            href={t.pdfPath || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white underline hover:text-accent-lime transition-colors"
                          >
                            BUKA_PDF
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${
                              t.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : t.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {t.status === "APPROVED" ? "APPROVED" : t.status === "PENDING" ? "PENDING" : "REJECTED"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right flex flex-wrap items-center justify-end gap-2">
                          {t.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleOpenVerifyModal(t)}
                                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors cursor-pointer"
                              >
                                Tinjau & Publish
                              </button>
                              <button
                                onClick={() => handleVerifyThesis(t.id, "REJECTED")}
                                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-rose-600 hover:bg-rose-500 rounded text-white transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setEditingThesis(t)}
                            className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteThesis(t.id)}
                            className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeSubTab === "guests" ? (
          /* Persetujuan Tamu Tab */
          <div className="bg-surface-night border border-hairline-violet rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-6 font-display">Persetujuan Akun Pendaftar Tamu</h3>
            
            {guests.length === 0 ? (
              <div className="text-center py-10 text-on-dark-muted text-xs font-mono uppercase tracking-[0.2px]">NO_GUEST_REGISTRATIONS</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase font-mono bg-primary/60 text-slate-400 border-b border-hairline-violet">
                    <tr>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Tgl Daftar</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-violet/40">
                    {guests.map((g) => (
                      <tr key={g.id} className="hover:bg-primary/20 transition-colors">
                        <td className="px-4 py-4 font-semibold text-white">{g.name}</td>
                        <td className="px-4 py-4 text-slate-400">{g.email}</td>
                        <td className="px-4 py-4 text-accent-pink font-mono">{g.role}</td>
                        <td className="px-4 py-4 font-mono">{new Date(g.createdAt).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] ${
                              g.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : g.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {g.status === "APPROVED" ? "APPROVED" : g.status === "PENDING" ? "PENDING" : "REJECTED"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right flex flex-wrap items-center justify-end gap-2">
                          {g.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleVerifyGuest(g.id, "APPROVED")}
                                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors"
                              >
                                Aktifkan
                              </button>
                              <button
                                onClick={() => handleVerifyGuest(g.id, "REJECTED")}
                                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-rose-600 hover:bg-rose-500 rounded text-white transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {currentUser?.role === "ADMIN" && (
                            <button
                              onClick={() => handleDeleteUser(g.id)}
                              className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Kelola Buku Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-surface-night border border-hairline-violet rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-6 font-display">Manajemen Buku</h3>
              
              {books.length === 0 ? (
                <div className="text-center py-10 text-on-dark-muted text-xs font-mono uppercase tracking-[0.2px]">NO_BOOKS_AVAILABLE</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[10px] uppercase font-mono bg-primary/60 text-slate-400 border-b border-hairline-violet">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Judul Buku</th>
                        <th className="px-4 py-3">Penulis</th>
                        <th className="px-4 py-3">Tahun</th>
                        <th className="px-4 py-3">Stok</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline-violet/40">
                      {books.map((b) => (
                        <tr key={b.id} className="hover:bg-primary/20 transition-colors">
                          <td className="px-4 py-4 font-mono text-[10px]">{b.id}</td>
                          <td className="px-4 py-4 font-semibold text-white line-clamp-1">{b.title}</td>
                          <td className="px-4 py-4 text-slate-400">{b.author}</td>
                          <td className="px-4 py-4 font-mono">{b.year}</td>
                          <td className="px-4 py-4 font-mono font-bold text-accent-lime">{b.stock}</td>
                          <td className="px-4 py-4 text-right flex flex-wrap items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingBook(b)}
                              className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b.id)}
                              className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-surface-night border border-hairline-violet rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4 font-display">Tambah Buku Baru</h3>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Judul Buku</label>
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Penulis</label>
                  <input
                    type="text"
                    required
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Penerbit</label>
                  <input
                    type="text"
                    required
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tahun Terbit</label>
                    <input
                      type="number"
                      required
                      value={bookYear}
                      onChange={(e) => setBookYear(e.target.value)}
                      className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Stok</label>
                    <input
                      type="number"
                      required
                      value={bookStock}
                      onChange={(e) => setBookStock(e.target.value)}
                      className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">ISBN</label>
                  <input
                    type="text"
                    value={bookIsbn}
                    onChange={(e) => setBookIsbn(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Cover URL</label>
                  <input
                    type="text"
                    value={bookCoverUrl}
                    onChange={(e) => setBookCoverUrl(e.target.value)}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-md text-xs font-bold uppercase tracking-[0.2px] bg-white hover:bg-surface-press-light text-primary transition-all shadow-sm"
                >
                  TAMBAH_BUKU
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Verify Thesis Modal */}
      {selectedVerifyThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-night border border-hairline-violet rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative flex flex-col justify-between">
            <button
              onClick={() => setSelectedVerifyThesis(null)}
              className="absolute top-6 right-6 text-xs font-mono font-bold uppercase text-on-dark-muted hover:text-white transition-colors"
            >
              [Batal]
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-[0.2px]">
                Tinjauan Skripsi
              </span>
              <h2 className="text-lg font-bold text-white mt-3 mb-2 font-display">
                {selectedVerifyThesis.title}
              </h2>
              <p className="text-xs text-on-dark-muted mb-4 font-mono uppercase">
                Penulis: {selectedVerifyThesis.authorName} | Jurusan: {selectedVerifyThesis.department}
              </p>

              {/* Chapters Lock Config */}
              <div className="border-t border-hairline-violet pt-4 mt-4">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3">
                  Konfigurasi Penguncian Bab Skripsi
                </h4>
                <p className="text-[10px] text-on-dark-muted mb-4 leading-relaxed">
                  Centang bab yang ingin **dikunci**. Pengunjung umum/tamu yang belum masuk log (login) tidak akan dapat membaca bab yang dicentang.
                </p>

                <div className="space-y-2.5">
                  {chapterLocks.length === 0 ? (
                    <p className="text-xs font-mono text-slate-500 italic">[TIDAK ADA DATA BAB]</p>
                  ) : (
                    chapterLocks.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between p-3 bg-primary/40 border border-hairline-violet rounded-lg"
                      >
                        <span className="text-xs font-mono text-white">{ch.chapterName}</span>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ch.isLocked}
                            onChange={() => handleToggleLock(ch.id)}
                            className="w-4 h-4 rounded border-hairline-violet bg-primary accent-accent-lime"
                          />
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                            {ch.isLocked ? "Kunci" : "Buka"}
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-hairline-violet flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    handleVerifyThesis(selectedVerifyThesis.id, "REJECTED");
                    setSelectedVerifyThesis(null);
                  }}
                  className="px-4 py-2 text-xs font-bold font-mono uppercase bg-rose-600 hover:bg-rose-500 rounded text-white transition-colors"
                >
                  Tolak Skripsi
                </button>
                <button
                  onClick={handleApproveThesis}
                  className="px-5 py-2 text-xs font-bold font-mono uppercase bg-white hover:bg-surface-press-light text-primary rounded transition-colors"
                >
                  Setujui & Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-night border border-hairline-violet rounded-xl w-full max-w-2xl p-8 relative">
            <button
              onClick={() => setEditingBook(null)}
              className="absolute top-6 right-6 text-xs font-mono font-bold uppercase text-on-dark-muted hover:text-white transition-colors"
            >
              [Batal]
            </button>
            <h2 className="text-lg font-bold text-white mb-6 font-display">Edit Data Buku</h2>
            <form onSubmit={submitEditBook} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Judul Buku</label>
                <input
                  type="text"
                  required
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Penulis</label>
                  <input
                    type="text"
                    required
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Penerbit</label>
                  <input
                    type="text"
                    required
                    value={editingBook.publisher}
                    onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tahun Terbit</label>
                  <input
                    type="number"
                    required
                    value={editingBook.year}
                    onChange={(e) => setEditingBook({ ...editingBook, year: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Stok</label>
                  <input
                    type="number"
                    required
                    value={editingBook.stock}
                    onChange={(e) => setEditingBook({ ...editingBook, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">ISBN</label>
                <input
                  type="text"
                  value={editingBook.isbn || ""}
                  onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                  className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                />
              </div>
              <div className="mt-8 pt-4 border-t border-hairline-violet flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-mono uppercase bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Thesis Modal */}
      {editingThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-night border border-hairline-violet rounded-xl w-full max-w-2xl p-8 relative">
            <button
              onClick={() => setEditingThesis(null)}
              className="absolute top-6 right-6 text-xs font-mono font-bold uppercase text-on-dark-muted hover:text-white transition-colors"
            >
              [Batal]
            </button>
            <h2 className="text-lg font-bold text-white mb-6 font-display">Edit Metadata Skripsi</h2>
            <form onSubmit={submitEditThesis} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Judul Skripsi</label>
                <input
                  type="text"
                  required
                  value={editingThesis.title}
                  onChange={(e) => setEditingThesis({ ...editingThesis, title: e.target.value })}
                  className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Jurusan</label>
                  <input
                    type="text"
                    required
                    value={editingThesis.department}
                    onChange={(e) => setEditingThesis({ ...editingThesis, department: e.target.value })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tahun</label>
                  <input
                    type="number"
                    required
                    value={editingThesis.year}
                    onChange={(e) => setEditingThesis({ ...editingThesis, year: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-canvas-light text-ink-deep border border-hairline-cool rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring-focus"
                  />
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-hairline-violet flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-mono uppercase bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
