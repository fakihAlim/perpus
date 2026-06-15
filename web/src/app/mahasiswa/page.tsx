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
  book: {
    title: string;
    author: string;
  };
}

interface ThesisChapter {
  id: number;
  chapterName: string;
  pdfPath: string;
  isLocked: boolean;
}

interface Thesis {
  id: number;
  title: string;
  department: string;
  year: number;
  status: string;
  pdfPath: string | null;
  createdAt: string;
  chapters?: ThesisChapter[];
}

interface ChapterUpload {
  name: string;
  file: File | null;
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile">("dashboard");
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string; status: string; createdAt: string } | null>(null);

  // Toggle Upload Thesis View
  const [isUploading, setIsUploading] = useState(false);

  // Upload Thesis Form States
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [advisor1, setAdvisor1] = useState("");
  const [advisor2, setAdvisor2] = useState("");
  const [department, setDepartment] = useState("Teknik Informatika");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  // Dynamic chapters array
  const [chapters, setChapters] = useState<ChapterUpload[]>([
    { name: "Bab 1 - Pendahuluan", file: null }
  ]);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Change Password Form States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const router = useRouter();

  const fetchDashboardData = async (token: string) => {
    setLoading(true);
    try {
      const bRes = await fetch("/api/borrowings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bRes.ok) {
        setBorrowings(await bRes.json());
      }

      const tRes = await fetch("/api/thesis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tRes.ok) {
        setTheses(await tRes.json());
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    const parseUser = JSON.parse(storedUser);
    if (parseUser.role !== "STUDENT" && parseUser.role !== "GUEST") {
      router.push("/");
      return;
    }

    setUser(parseUser);
    fetchDashboardData(storedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddChapterRow = () => {
    const nextIndex = chapters.length + 1;
    setChapters([...chapters, { name: `Bab ${nextIndex}`, file: null }]);
  };

  const handleRemoveChapterRow = (index: number) => {
    if (chapters.length === 1) {
      setErrorMsg("Harap unggah minimal satu bab skripsi");
      return;
    }
    setErrorMsg("");
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleChapterNameChange = (index: number, value: string) => {
    const newChapters = [...chapters];
    newChapters[index].name = value;
    setChapters(newChapters);
  };

  const handleChapterFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        setErrorMsg(`Ukuran file untuk bab ${chapters[index].name} tidak boleh melebihi 10MB`);
        e.target.value = "";
        return;
      }

      if (!file.name.endsWith(".pdf")) {
        setErrorMsg("File harus berupa berkas PDF (.pdf)");
        e.target.value = "";
        return;
      }

      setErrorMsg("");
      const newChapters = [...chapters];
      newChapters[index].file = file;
      setChapters(newChapters);
    }
  };

  const handleUploadThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate that all chapters have files selected
    const missingFile = chapters.findIndex((ch) => !ch.file);
    if (missingFile !== -1) {
      setErrorMsg(`Silakan pilih file PDF untuk ${chapters[missingFile].name}`);
      return;
    }

    setUploadLoading(true);
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("abstract", abstract);
    formData.append("department", department);
    formData.append("year", year);
    formData.append("authorName", user?.name || "");
    formData.append("advisor1", advisor1);
    formData.append("advisor2", advisor2);

    // Build chapter metadata mapping
    const chaptersMetadata = chapters.map((ch, index) => ({
      name: ch.name,
      index,
    }));
    formData.append("chaptersMetadata", JSON.stringify(chaptersMetadata));

    // Append files with matched indexes
    chapters.forEach((ch, index) => {
      if (ch.file) {
        formData.append(`file_${index}`, ch.file);
      }
    });

    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Gagal mengunggah skripsi");
        return;
      }

      setSuccessMsg("UPLOAD_SUCCESS. MENUNGGU VERIFIKASI PETUGAS.");
      setTitle("");
      setAbstract("");
      setAdvisor1("");
      setAdvisor2("");
      setChapters([{ name: "Bab 1 - Pendahuluan", file: null }]);
      setIsUploading(false);
      
      if (token) fetchDashboardData(token);
    } catch (error) {
      console.error(error);
      setErrorMsg("Terjadi kesalahan koneksi server");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter");
      return;
    }

    setPasswordLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.message || "Gagal memperbarui kata sandi");
        return;
      }

      setPasswordSuccess("PASSWORD_CHANGED_SUCCESSFULLY");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setPasswordError("Koneksi server gagal");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest">
        SYSTEM_LOADING_DASHBOARD...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight font-display text-slate-900">
              PERPUS<span className="text-indigo-600 font-mono">_</span>DIGITAL
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
              MEMBER: <strong className="text-indigo-600 font-sans font-medium">{user?.name.toUpperCase()}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-all"
            >
              [Exit]
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 mb-8">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsUploading(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`px-5 py-3.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "dashboard" && !isUploading
                ? "border-slate-900 text-slate-900 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("profile");
              setIsUploading(false);
              setPasswordError("");
              setPasswordSuccess("");
            }}
            className={`px-5 py-3.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "profile"
                ? "border-slate-900 text-slate-900 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Profile Anda
          </button>
        </div>

        {activeTab === "dashboard" ? (
          isUploading ? (
            /* Upload Thesis View */
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Unggah Mandiri Skripsi</h2>
                  <p className="text-xs text-slate-500 mt-1 font-sans">
                    Unggah skripsi per bab. Petugas akan memverifikasi dan menyetel bab-bab yang akan dikunci sebelum dipublikasikan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsUploading(false);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs font-mono font-bold uppercase text-slate-400 hover:text-slate-800 transition-colors"
                >
                  [Batal]
                </button>
              </div>

              {errorMsg && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-mono uppercase tracking-wide">
                  [ERROR]: {errorMsg}
                </div>
              )}

              <form onSubmit={handleUploadThesis} className="space-y-6">
                
                {/* Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Judul Skripsi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan judul skripsi lengkap"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Jurusan
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Sains Data">Sains Data</option>
                      <option value="Teknik Elektro">Teknik Elektro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Abstrak
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tuliskan ringkasan abstrak penelitian..."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Tahun Lulus
                    </label>
                    <input
                      type="number"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Dosen Pembimbing 1
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Dosen Pembimbing 1"
                      value={advisor1}
                      onChange={(e) => setAdvisor1(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Dosen Pembimbing 2 (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Dosen Pembimbing 2"
                      value={advisor2}
                      onChange={(e) => setAdvisor2(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* Chapters Dynamic Rows */}
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Berkas PDF Bab Skripsi</h3>
                    <button
                      type="button"
                      onClick={handleAddChapterRow}
                      className="text-xs font-mono font-bold uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      + Tambah Bab
                    </button>
                  </div>

                  <div className="space-y-4">
                    {chapters.map((ch, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 p-4 border border-slate-200/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <label className="block text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                            Nama Bab/Bagian
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Bab 1 - Pendahuluan"
                            value={ch.name}
                            onChange={(e) => handleChapterNameChange(index, e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                          />
                        </div>

                        <div className="w-full md:w-64">
                          <label className="block text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                            File PDF (Maks 10MB)
                          </label>
                          <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => handleChapterFileChange(index, e)}
                            className="w-full bg-white text-slate-500 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>

                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChapterRow(index)}
                            className="text-xs font-mono font-bold uppercase text-red-500 hover:text-red-700 md:mt-4 self-end md:self-auto"
                          >
                            [Hapus]
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="w-full mt-4 py-3.5 px-4 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm font-mono"
                >
                  {uploadLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "UNGGAH_SKRIPSI"
                  )}
                </button>

              </form>
            </div>
          ) : (
            /* Main Dashboard View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column (Borrowing & Status) */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Active Borrowing Card */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 mb-5 font-mono uppercase tracking-wider border-b border-slate-100 pb-3">
                    Buku Yang Sedang Dipinjam
                  </h2>

                  {borrowings.filter((b) => b.status === "BORROWED").length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-400 text-xs font-mono uppercase tracking-wider">
                      TIDAK_ADA_BUKU_YANG_DIPINJAM
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {borrowings
                        .filter((b) => b.status === "BORROWED")
                        .map((b) => (
                          <div
                            key={b.id}
                            className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-4"
                          >
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{b.book.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Penulis: {b.book.author}</p>
                              <p className="text-[10px] font-mono text-red-500 mt-2 font-semibold">
                                BATAS PENGEMBALIAN: {new Date(b.dueDate).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                              Dipinjam
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Thesis Submissions List Card */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
                      Status Riwayat Skripsi Anda
                    </h2>
                    <button
                      onClick={() => {
                        setIsUploading(true);
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-xs font-mono font-bold uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      + Unggah Skripsi
                    </button>
                  </div>

                  {successMsg && (
                    <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-lg text-xs font-mono uppercase tracking-wide">
                      [SUCCESS]: {successMsg}
                    </div>
                  )}

                  {theses.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-400 text-xs font-mono uppercase tracking-wider">
                      BELUM_ADA_RIWAYAT_UNGGAHAN_SKRIPSI
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {theses.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{t.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Jurusan: {t.department} | Tahun: {t.year}</p>
                            </div>

                            <span
                              className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                                t.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : t.status === "PENDING"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>

                          {/* List of uploaded chapters */}
                          {t.chapters && t.chapters.length > 0 && (
                            <div className="mt-2 border-t border-slate-100 pt-2 bg-slate-50/50 p-2.5 rounded">
                              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">Daftar Bab Uploaded:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {t.chapters.map((ch) => (
                                  <div key={ch.id} className="flex items-center justify-between text-xs text-slate-600 bg-white border border-slate-150 px-2 py-1 rounded">
                                    <span className="truncate max-w-[150px] font-sans">{ch.chapterName}</span>
                                    <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                      {ch.isLocked ? "Terkunci" : "Terbuka"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Info Dashboard & Panduan) */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 font-mono uppercase tracking-wider border-b border-slate-100 pb-2">
                    Panduan Pengunggahan Skripsi
                  </h2>
                  <ul className="space-y-3.5 text-xs text-slate-500 font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-950 font-bold font-mono">1.</span>
                      <span>Mahasiswa mengunggah data skripsi lengkap dengan melampirkan berkas PDF **per bab** skripsi secara urut.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-950 font-bold font-mono">2.</span>
                      <span>Unggahan baru memiliki status **PENDING** dan belum diterbitkan di beranda umum.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-950 font-bold font-mono">3.</span>
                      <span>Petugas perpustakaan akan memverifikasi berkas. Petugas yang berwenang **mengunci bab tertentu** (misalnya bab pembahasan/data penting) dan mempublikasikan skripsi ke website.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-950 font-bold font-mono">4.</span>
                      <span>Setelah disetujui (**APPROVED**), file skripsi yang tidak dikunci bisa dibaca publik secara bebas, sedangkan bab terkunci mewajibkan login terlebih dahulu.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          )
        ) : (
          /* Profile Tab View */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-4xl mx-auto">
            
            {/* User Details Box */}
            <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm h-fit">
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 font-mono text-slate-400 font-bold text-lg mb-4">
                  [USR]
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">{user?.name}</h3>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
                  {user?.role}
                </span>
              </div>

              <div className="pt-6 space-y-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Alamat Email</span>
                  <span className="text-slate-800 font-medium block mt-0.5">{user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Status Keanggotaan</span>
                  <span className="text-emerald-600 font-bold uppercase tracking-wider block mt-0.5 font-mono">
                    {user?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password Box */}
            <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-5 font-mono uppercase tracking-wider border-b border-slate-100 pb-3">
                Ubah Kata Sandi Akun
              </h3>

              {passwordError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-mono uppercase tracking-wide">
                  [ERROR]: {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-lg text-xs font-mono uppercase tracking-wide font-mono">
                  [SUCCESS]: {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Kata Sandi Lama
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full mt-2 py-3.5 px-4 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm font-mono"
                >
                  {passwordLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "PERBARUI_KATA_SANDI"
                  )}
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
