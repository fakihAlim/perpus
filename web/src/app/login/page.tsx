/* eslint-disable */
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

      setSuccessMsg("Login berhasil. Mengalihkan...");
      
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

      setSuccessMsg("Pendaftaran berhasil. Silakan hubungi petugas perpustakaan untuk aktivasi.");
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
    <div className="min-h-screen bg-bg-subtle flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold tracking-tight text-primary">
              PerpusDigital
            </span>
          </Link>
          <h2 className="text-xl font-semibold text-ink">
            {activeTab === "login" ? "Masuk ke Akun Anda" : "Daftar Akun Tamu"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Atau{" "}
            <Link href="/" className="text-primary font-medium hover:underline">
              kembali ke beranda
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg rounded-lg border border-border p-8">
          {/* Tab Selector */}
          <div className="flex bg-bg-muted p-1 rounded-lg mb-6">
            <button
              onClick={() => {
                setActiveTab("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 text-center py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "login"
                  ? "bg-bg text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
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
              className={`flex-1 text-center py-2.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "register"
                  ? "bg-bg text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Daftar Tamu
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 bg-danger-bg border border-danger/20 text-danger p-3 rounded-md text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-success-bg border border-success/20 text-success p-3 rounded-md text-sm">
              {successMsg}
            </div>
          )}

          {activeTab === "login" ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg text-ink border border-border rounded-md px-3.5 py-2.5 text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg text-ink border border-border rounded-md px-3.5 py-2.5 text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-md text-sm font-semibold bg-primary hover:bg-accent-hover text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg text-ink border border-border rounded-md px-3.5 py-2.5 text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="tamu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg text-ink border border-border rounded-md px-3.5 py-2.5 text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg text-ink border border-border rounded-md px-3.5 py-2.5 text-sm placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-md text-sm font-semibold bg-primary hover:bg-accent-hover text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Daftar Sebagai Tamu"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
