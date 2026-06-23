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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?limit=4`);
      if (res.ok) {
        const json = await res.json();
        setBooks(json.data || json);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen font-sans bg-white selection:bg-yellow-100 selection:text-slate-900">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 w-full bg-slate-100 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Lexicon Library
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <div className="flex flex-col items-center">
              <Link href="#" className="text-[11px] font-bold tracking-widest uppercase text-slate-900 pb-1">
                CATALOG
              </Link>
              <div className="w-full h-0.5 bg-yellow-500 rounded-full"></div>
            </div>
            <Link href="#" className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              MEMBERSHIP
            </Link>
            <Link href="#" className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              EVENTS
            </Link>
            <Link href="#" className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors">
              ABOUT US
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href={user.role === "STUDENT" ? "/mahasiswa" : "/admin"}
                  className="bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded px-6 py-2.5 text-xs font-bold tracking-widest uppercase"
                >
                  DASHBOARD
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-red-600 transition-colors"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded px-6 py-2.5 text-[11px] font-bold tracking-widest uppercase"
              >
                MEMBER LOGIN
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-slate-600 py-24 md:py-32 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background pattern or noise could go here */}
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Buka Jendela Dunia di <span className="text-yellow-400">Lexicon <br className="hidden md:block"/>Library</span>
          </h1>
          <p className="text-slate-200 text-lg md:text-xl italic mb-12 font-serif">
            "Akses ribuan koleksi buku, jurnal digital, dan ruang kolaborasi modern dalam satu tempat."
          </p>

          <div className="max-w-2xl mx-auto bg-white rounded-full p-2 flex items-center shadow-2xl">
            <div className="pl-5 text-slate-400">
              <span className="font-bold text-lg">O</span> {/* Mock Icon */}
            </div>
            <input
              type="text"
              placeholder="Cari judul buku, pengarang, atau ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-full transition-colors">
              CARI
            </button>
          </div>
        </div>
      </section>

      {/* 3. KOLEKSI UNGGULAN */}
      <section className="py-20 max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h4 className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-[0.2em] mb-2">
              RUANG KOLEKSI
            </h4>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Koleksi Unggulan
            </h2>
          </div>
          <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2">
            LIHAT SEMUA <span className="text-lg leading-none">&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">Memuat koleksi...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Map from actual books if available, otherwise static */}
            {books.slice(0, 3).map((book, index) => (
              <div key={book.id} className="group flex flex-col cursor-pointer">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200 shadow-sm">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <span className="text-slate-700 text-6xl font-serif">L</span>
                    </div>
                  )}
                  {/* Dark gradient overlay for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-8">
                    <h3 className="text-white text-xl font-bold mb-1 leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-slate-300 text-sm font-medium">
                      {book.author}
                    </p>
                  </div>
                </div>
                {/* Under image pills */}
                <div className="border border-t-0 border-slate-200 p-4 bg-white flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    {book.type === "DIGITAL" ? "E-JOURNAL" : "FISIK"}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    {book.stock > 0 ? `${book.stock} TERSEDIA` : "HABIS"}
                  </span>
                </div>
              </div>
            ))}
            {/* Fallback Static Cards if db is empty */}
            {books.length === 0 && (
              <>
                <div className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10 flex flex-col justify-end p-8">
                      <h3 className="text-white text-xl font-bold mb-1 leading-snug">Fiksi Populer</h3>
                      <p className="text-slate-300 text-sm font-medium">Eksplorasi imajinasi tanpa batas.</p>
                    </div>
                  </div>
                  <div className="border border-t-0 border-slate-200 p-4 bg-white flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">TRENDING</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">5,200+ JUDUL</span>
                  </div>
                </div>
                <div className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10 flex flex-col justify-end p-8">
                      <h3 className="text-white text-xl font-bold mb-1 leading-snug">Teknologi & Sains</h3>
                      <p className="text-slate-300 text-sm font-medium">Wawasan masa depan di tangan Anda.</p>
                    </div>
                  </div>
                  <div className="border border-t-0 border-slate-200 p-4 bg-white flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">E-JOURNAL</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">TERBARU</span>
                  </div>
                </div>
                <div className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10 flex flex-col justify-end p-8">
                      <h3 className="text-white text-xl font-bold mb-1 leading-snug">Sastra Klasik</h3>
                      <p className="text-slate-300 text-sm font-medium">Warisan pemikiran lintas zaman.</p>
                    </div>
                  </div>
                  <div className="border border-t-0 border-slate-200 p-4 bg-white flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">ARSIP</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">LANGKA</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* 4. FITUR KEANGGOTAAN */}
      <section className="bg-[#050B14] py-24 border-y border-slate-800 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Kiri: Teks & Fitur */}
          <div>
            <h4 className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-[0.2em] mb-3">
              GABUNG BERSAMA KAMI
            </h4>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight">
              Eksklusivitas untuk Pencari Ilmu
            </h2>

            <div className="space-y-8 mb-12">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Peminjaman Tak Terbatas</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Akses fisik dan digital ke seluruh katalog kami tanpa batasan jumlah per bulan.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 border-2 border-yellow-500 rounded-sm"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Akses Jurnal Eksklusif</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Kerja sama dengan Elsevier, JSTOR, dan Springer untuk referensi akademik terpercaya.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Ruang Diskusi Privat</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Fasilitas ruang kolaborasi kedap suara dengan dukungan teknologi multimedia modern.</p>
                </div>
              </div>
            </div>

            <Link href="/login" className="inline-block bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-[11px] uppercase tracking-widest px-8 py-4 rounded transition-colors">
              DAFTAR KEANGGOTAAN
            </Link>
          </div>

          {/* Kanan: Kartu Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] rounded-full"></div>
            {/* Outline Card Background */}
            <div className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl p-6 md:p-8 transform rotate-0 lg:rotate-1 z-10 border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Kartu Member Digital</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>

              {/* Inside Card */}
              <div className="w-full aspect-[1.6/1] bg-[#0A1128] rounded-xl overflow-hidden relative shadow-inner flex flex-col justify-between p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/30 rounded-full blur-[60px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full blur-[40px] -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mb-1">LEXICON LIBRARY PLATINUM</p>
                  <h3 className="text-2xl font-bold text-white tracking-wide">{user ? user.name.toUpperCase() : "ADRIAN MAULANA"}</h3>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div className="text-[11px] text-slate-400 tracking-widest font-mono">
                    ID: {user ? "9021-4201-9999" : "0024-8491-1004"}
                  </div>
                  <div className="text-xl font-bold text-yellow-500 tracking-tight">
                    LEXICON
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status Keanggotaan</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Aktif</span>
              </div>
            </div>
            
            {/* Decorative outline box behind */}
            <div className="absolute top-8 left-8 right-[-2rem] bottom-[-2rem] border border-yellow-500/20 rounded-2xl z-0 hidden lg:block"></div>
          </div>

        </div>
      </section>

      {/* 5. KEGIATAN LITERASI */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 text-center mb-16">
          <h4 className="text-[10px] font-extrabold text-yellow-500 uppercase tracking-[0.2em] mb-3">
            JADWAL MENDATANG
          </h4>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Kegiatan Literasi & Komunitas
          </h2>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Acara 1 */}
          <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-lg overflow-hidden group hover:shadow-lg transition-all">
            <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-800 relative shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-slate-700"></div> {/* Placeholder image background */}
              {/* Fake image overlay pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_#ffffff_1px,_transparent_1px)] [background-size:10px_10px]"></div>
              
              <div className="absolute top-0 left-0 bg-white px-4 py-3 text-center border-b border-r border-slate-200">
                <span className="block text-2xl font-bold text-slate-900 leading-none">24</span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">OCT</span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">SEMINAR TEKNOLOGI</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Bedah Buku: Masa Depan AI</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed line-clamp-2">
                Mendalami implikasi kecerdasan buatan dalam literasi masa depan bersama pakar teknologi.
              </p>
              <div className="flex items-center gap-6 mt-auto">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="font-serif">🕒</span> 13:00 - 15:00
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="font-serif">📍</span> Ruang Diskusi Utama
                </div>
              </div>
            </div>
          </div>

          {/* Acara 2 */}
          <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-lg overflow-hidden group hover:shadow-lg transition-all">
            <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-800 relative shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-slate-600"></div>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_#ffffff_1px,_transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="absolute top-0 left-0 bg-white px-4 py-3 text-center border-b border-r border-slate-200">
                <span className="block text-2xl font-bold text-slate-900 leading-none">12</span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">NOV</span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-2">WORKSHOP KREATIF</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Workshop Penulisan Kreatif</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed line-clamp-2">
                Asah bakat menulismu dengan panduan langsung dari penulis profesional peraih penghargaan.
              </p>
              <div className="flex items-center gap-6 mt-auto">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="font-serif">🕒</span> 09:00 - 12:00
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="font-serif">📍</span> Ruang Kolaborasi Atas
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#050B14] pt-20 pb-8 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Kolom 1: Profil (Lebih Lebar) */}
          <div className="lg:col-span-2 pr-8">
            <h3 className="text-xl font-bold text-white mb-6">Lexicon Library</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Otoritas perpustakaan modern yang didedikasikan untuk preservasi ilmu pengetahuan dan pengembangan komunitas intelektual.
            </p>
          </div>

          {/* Kolom 2: Layanan */}
          <div>
            <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-6">LAYANAN</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Katalog Online</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Library Services</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Digital Archives</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Member Support</Link></li>
            </ul>
          </div>

          {/* Kolom 3: Informasi */}
          <div>
            <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-6">INFORMASI</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Opening Hours</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Use</Link></li>
            </ul>
          </div>

          {/* Kolom 4: Lokasi */}
          <div>
            <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-6">LOKASI</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Jl. Aksara No. 42, Kompleks Edukasi<br />
              Jakarta Pusat, 10110<br />
              Indonesia
            </p>
            {/* Mock Social Icons using Text */}
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-serif">in</a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-serif">ig</a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-serif">fb</a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Lexicon Library Authority. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Facebook</Link>
            <Link href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Instagram</Link>
            <Link href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">LinkedIn</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
