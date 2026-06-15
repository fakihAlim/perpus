"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Email atau password salah");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMsg("LOGIN_SUCCESS. REDIRECTING...");
      
      setTimeout(() => {
        if (data.user.role === "STUDENT") {
          router.push("/mahasiswa");
        } else if (data.user.role === "ADMIN" || data.user.role === "LIBRARIAN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi server gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Pendaftaran gagal");
        return;
      }

      setSuccessMsg("REGISTRATION_SUCCESS. PLEASE CONTACT LIBRARIAN.");
      setName("");
      setEmail("");
      setPassword("");
      
      setTimeout(() => {
        setActiveTab("login");
        setSuccessMsg("");
      }, 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Koneksi server gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas-dark flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      
      {/* Decorative Starfield background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="w-full max-w-[450px] relative z-10 px-4">
        
        {/* Header */}
        <div className="w-full text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold tracking-tight font-display text-white">
              PERPUS<span className="text-accent-lime font-mono">_</span>DIGITAL
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-display">
            {activeTab === "login" ? "MASUK_SISTEM" : "PENDAFTARAN_TAMU"}
          </h2>
          <p className="mt-2 text-xs text-on-dark-muted font-mono uppercase tracking-[0.2px]">
            Atau{" "}
            <Link href="/" className="text-white underline hover:text-accent-lime transition-colors">
              Kembali ke Beranda
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-night py-8 px-6 sm:px-10 border border-hairline-violet rounded-xl backdrop-blur-md w-full">
          {/* Tab Selector */}
          <div className="flex bg-primary p-1 rounded-lg mb-6 border border-hairline-violet">
            <button
              onClick={() => {
                setActiveTab("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-[0.2px] rounded transition-all ${
                activeTab === "login"
                  ? "bg-accent-violet-deep text-white border border-hairline-violet"
                  : "text-on-dark-muted hover:text-white"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-[0.2px] rounded transition-all ${
                activeTab === "register"
                  ? "bg-accent-violet-deep text-white border border-hairline-violet"
                  : "text-on-dark-muted hover:text-white"
              }`}
            >
              Daftar Tamu
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono uppercase tracking-[0.2px] flex items-center gap-2">
              <span>[ERROR]: {errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-xs font-mono uppercase tracking-[0.2px] flex items-center gap-2">
              <span>[SUCCESS]: {successMsg}</span>
            </div>
          )}

          {activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-primary/60 text-white border border-hairline-violet rounded-sm px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-surface-night"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-primary/60 text-white border border-hairline-violet rounded-sm px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-surface-night"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-md text-xs font-bold uppercase tracking-[0.2px] bg-white hover:bg-surface-press-light text-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "MASUK_SISTEM"
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-primary/60 text-white border border-hairline-violet rounded-sm px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-surface-night"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="tamu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-primary/60 text-white border border-hairline-violet rounded-sm px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-surface-night"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-primary/60 text-white border border-hairline-violet rounded-sm px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-lime focus:ring-offset-2 focus:ring-offset-surface-night"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-md text-xs font-bold uppercase tracking-[0.2px] bg-white hover:bg-surface-press-light text-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "DAFTAR_SEBAGAI_TAMU"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
