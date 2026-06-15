import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
  Modal,
  Platform,
} from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ThesisChapter {
  id: number;
  chapterName: string;
  pdfPath: string;
  isLocked: boolean;
}

interface Thesis {
  id: number;
  title: string;
  authorName: string;
  advisor1: string;
  advisor2?: string | null;
  department: string;
  year: number;
  abstract: string;
  status: string;
  chapters?: ThesisChapter[];
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

interface Borrowing {
  id: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fine: number;
  book: { title: string; author: string };
}

// ─── Visual Barcode Component ─────────────────────────────────────────────────
const Barcode = ({ value }: { value: string }) => {
  const lines = [2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 4, 2, 1, 3, 2, 4, 1, 2];
  return (
    <View style={styles.barcodeContainer}>
      <View style={styles.barcodeLines}>
        {lines.map((width, index) => (
          <View
            key={index}
            style={[styles.barcodeLine, { width, marginRight: index % 4 === 0 ? 2 : 1 }]}
          />
        ))}
      </View>
      <Text style={styles.barcodeText}>MEMBER ID: {value.padStart(6, "0")}</Text>
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED:  { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "PUBLISHED" },
    PENDING:   { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", label: "PENDING"   },
    REJECTED:  { bg: "rgba(244,63,94,0.12)",   color: "#f43f5e", label: "REJECTED"  },
  };
  const c = config[status] ?? config["PENDING"];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.color }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [token, setToken]             = useState("");
  const [user, setUser]               = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [apiHost, setApiHost]         = useState("http://192.168.1.8:3000");
  const [tempHost, setTempHost]       = useState("http://192.168.1.8:3000");
  const [showHostModal, setShowHostModal] = useState(false);

  // Use a ref so fetch functions always see the latest apiHost (fixes stale closure)
  const apiHostRef = useRef(apiHost);
  useEffect(() => { apiHostRef.current = apiHost; }, [apiHost]);
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Login form
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"repository" | "catalog" | "loans" | "account">("repository");

  // Repository (Thesis) state
  const [theses, setTheses]             = useState<Thesis[]>([]);
  const [thesisSearch, setThesisSearch] = useState("");
  const [thesisLoading, setThesisLoading] = useState(false);
  const [expandedThesis, setExpandedThesis] = useState<number | null>(null);
  const [chapterLoading, setChapterLoading] = useState<number | null>(null);

  // Catalog (Books) state
  const [books, setBooks]             = useState<Book[]>([]);
  const [bookSearch, setBookSearch]   = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError]     = useState("");

  // Loans state
  const [borrowings, setBorrowings]       = useState<Borrowing[]>([]);
  const [borrowingsLoading, setBorrowingsLoading] = useState(false);

  // ── Fetch helpers — menggunakan ref agar selalu dapat apiHost terbaru ────────
  const loadTheses = async (q?: string) => {
    const query = q ?? thesisSearch;
    setThesisLoading(true);
    try {
      const res = await fetch(`${apiHostRef.current}/api/thesis?q=${encodeURIComponent(query)}&status=APPROVED`);
      if (res.ok) setTheses(await res.json());
      else console.warn("Thesis API error:", res.status);
    } catch (e) {
      console.warn("Thesis fetch error:", e);
    } finally {
      setThesisLoading(false);
    }
  };

  const loadThesisDetail = async (thesisId: number) => {
    if (expandedThesis === thesisId) { setExpandedThesis(null); return; }
    setChapterLoading(thesisId);
    try {
      const res = await fetch(`${apiHostRef.current}/api/thesis/${thesisId}`);
      if (res.ok) {
        const detail: Thesis = await res.json();
        setTheses((prev) =>
          prev.map((t) => (t.id === thesisId ? { ...t, chapters: detail.chapters } : t))
        );
        setExpandedThesis(thesisId);
      }
    } catch (e) {
      Alert.alert("Gagal memuat bab", `Periksa koneksi. Host: ${apiHostRef.current}`);
    } finally {
      setChapterLoading(null);
    }
  };

  const loadBooks = async (q?: string) => {
    const query = q ?? bookSearch;
    setBookLoading(true);
    setBookError("");
    try {
      const res = await fetch(`${apiHostRef.current}/api/books?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        setBooks(await res.json());
      } else {
        setBookError(`Server error: ${res.status}`);
      }
    } catch (e) {
      const msg = `Gagal terhubung ke ${apiHostRef.current}. Pastikan server berjalan dan IP Host sudah benar.`;
      setBookError(msg);
      console.warn("Books fetch error:", e);
    } finally {
      setBookLoading(false);
    }
  };

  const loadBorrowings = async () => {
    if (!isLoggedIn) return;
    setBorrowingsLoading(true);
    try {
      const res = await fetch(`${apiHostRef.current}/api/borrowings`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) setBorrowings(await res.json());
    } catch (e) {
      console.warn("Borrowings fetch error:", e);
    } finally {
      setBorrowingsLoading(false);
    }
  };

  // Initial load & tab change
  useEffect(() => { loadTheses(); }, []);
  useEffect(() => {
    if (activeTab === "catalog") loadBooks();
    else if (activeTab === "loans") loadBorrowings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn]);

  // ── Auth handlers ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) { setAuthError("Email dan kata sandi wajib diisi."); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${apiHost}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.message || "Gagal masuk."); return; }
      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      setEmail("");
      setPassword("");
    } catch (e) {
      setAuthError("Koneksi ke server gagal. Periksa kembali Host API.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken("");
    setUser(null);
    setEmail("");
    setPassword("");
    setBorrowings([]);
    setActiveTab("repository");
  };

  // ── PDF open handler ────────────────────────────────────────────────────────
  const handleOpenChapter = (chapter: ThesisChapter) => {
    if (chapter.isLocked && !isLoggedIn) {
      Alert.alert(
        "Bab Terkunci",
        "Bab ini dikunci. Silakan masuk ke akun Anda terlebih dahulu untuk mengaksesnya.",
        [
          { text: "Batal", style: "cancel" },
          { text: "Masuk Sekarang", onPress: () => setActiveTab("account") },
        ]
      );
      return;
    }
    const fullUrl = `${apiHost}${chapter.pdfPath}`;
    Linking.openURL(fullUrl).catch(() =>
      Alert.alert("Gagal membuka PDF", "Tidak dapat membuka URL: " + fullUrl)
    );
  };

  // ── Tab guard for login-required tabs ──────────────────────────────────────
  const handleTabPress = (tab: typeof activeTab) => {
    if ((tab === "loans") && !isLoggedIn) {
      Alert.alert(
        "Perlu Masuk",
        "Fitur ini memerlukan akun anggota. Silakan masuk terlebih dahulu.",
        [
          { text: "Batal", style: "cancel" },
          { text: "Masuk", onPress: () => setActiveTab("account") },
        ]
      );
      return;
    }
    setActiveTab(tab);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER TABS ──────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  const renderRepository = () => (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul, penulis, atau jurusan..."
          placeholderTextColor="#6b7280"
          value={thesisSearch}
          onChangeText={(t) => {
            setThesisSearch(t);
            loadTheses(t);
          }}
        />
      </View>

      {thesisLoading ? (
        <ActivityIndicator size="large" color="#5b48e0" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={theses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada skripsi yang diterbitkan.</Text>
          }
          renderItem={({ item }) => {
            const isOpen = expandedThesis === item.id;
            return (
              <View style={styles.thesisCard}>
                {/* Header */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => loadThesisDetail(item.id)}
                  style={styles.thesisHeader}
                >
                  <View style={{ flex: 1 }}>
                    <StatusBadge status={item.status} />
                    <Text style={styles.thesisTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.thesisMeta}>
                      {item.authorName} · {item.department} · {item.year}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{isOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {/* Chapter loading */}
                {chapterLoading === item.id && (
                  <ActivityIndicator size="small" color="#5b48e0" style={{ paddingVertical: 12 }} />
                )}

                {/* Expanded chapters */}
                {isOpen && item.chapters && (
                  <View style={styles.chaptersBox}>
                    <Text style={styles.chaptersLabel}>DAFTAR BAB</Text>
                    {item.chapters.length === 0 && (
                      <Text style={styles.emptyText}>Tidak ada bab tersedia.</Text>
                    )}
                    {item.chapters.map((ch) => (
                      <TouchableOpacity
                        key={ch.id}
                        style={[
                          styles.chapterRow,
                          ch.isLocked && !isLoggedIn && styles.chapterRowLocked,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleOpenChapter(ch)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.chapterName}>{ch.chapterName}</Text>
                          {ch.isLocked && !isLoggedIn && (
                            <Text style={styles.chapterLockedHint}>Login diperlukan</Text>
                          )}
                        </View>
                        <View style={[styles.chapterBtn, ch.isLocked && !isLoggedIn ? styles.chapterBtnLocked : styles.chapterBtnOpen]}>
                          <Text style={styles.chapterBtnText}>
                            {ch.isLocked && !isLoggedIn ? "KUNCI" : "BACA"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Abstract */}
                    <View style={styles.abstractBox}>
                      <Text style={styles.abstractLabel}>ABSTRAK</Text>
                      <Text style={styles.abstractText}>{item.abstract}</Text>
                    </View>
                    <View style={styles.advisorBox}>
                      <Text style={styles.advisorLabel}>Pembimbing:</Text>
                      <Text style={styles.advisorText}>{item.advisor1}{item.advisor2 ? `, ${item.advisor2}` : ""}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );

  const renderCatalog = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari judul atau penulis buku..."
          placeholderTextColor="#6b7280"
          value={bookSearch}
          onChangeText={(t) => {
            setBookSearch(t);
            loadBooks(t);
          }}
        />
      </View>
      {bookLoading ? (
        <ActivityIndicator size="large" color="#5b48e0" style={{ marginTop: 32 }} />
      ) : bookError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxTitle}>Gagal Memuat Katalog</Text>
          <Text style={styles.errorBoxMsg}>{bookError}</Text>
          <TouchableOpacity style={styles.errorBoxBtn} onPress={() => loadBooks()}>
            <Text style={styles.errorBoxBtnText}>Coba Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.errorBoxBtn, { backgroundColor: "#f3f4f6", marginTop: 8 }]} onPress={() => setShowHostModal(true)}>
            <Text style={[styles.errorBoxBtnText, { color: "#374151" }]}>Ubah Host API</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={<Text style={styles.emptyText}>Buku tidak ditemukan.</Text>}
          renderItem={({ item }) => (
            <View style={styles.bookCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookMeta}>Penulis: {item.author}</Text>
                <Text style={styles.bookMeta}>Penerbit: {item.publisher} · {item.year}</Text>
                {item.isbn ? <Text style={styles.bookMeta}>ISBN: {item.isbn}</Text> : null}
              </View>
              <View style={styles.stockBadge}>
                <Text style={[styles.stockText, { color: item.stock > 0 ? "#10b981" : "#f43f5e" }]}>
                  {item.stock > 0 ? `${item.stock}\nTersedia` : "Habis"}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderLoans = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Riwayat Pinjaman Buku</Text>
        <TouchableOpacity onPress={loadBorrowings}>
          <Text style={styles.refreshBtn}>Muat Ulang</Text>
        </TouchableOpacity>
      </View>
      {borrowingsLoading ? (
        <ActivityIndicator size="large" color="#5b48e0" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={borrowings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat peminjaman.</Text>}
          renderItem={({ item }) => (
            <View style={styles.loanCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.loanTitle}>{item.book.title}</Text>
                <Text style={styles.loanMeta}>Penulis: {item.book.author}</Text>
                <Text style={styles.loanDate}>
                  Pinjam: {new Date(item.borrowDate).toLocaleDateString("id-ID")}
                </Text>
                <Text style={[styles.loanDate, { color: "#f43f5e" }]}>
                  Batas: {new Date(item.dueDate).toLocaleDateString("id-ID")}
                </Text>
                {item.returnDate && (
                  <Text style={[styles.loanDate, { color: "#10b981" }]}>
                    Kembali: {new Date(item.returnDate).toLocaleDateString("id-ID")}
                  </Text>
                )}
                {item.fine > 0 && (
                  <Text style={styles.fineText}>
                    Denda: Rp {item.fine.toLocaleString("id-ID")}
                  </Text>
                )}
              </View>
              <View style={[
                styles.loanBadge,
                { backgroundColor: item.status === "RETURNED" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)" }
              ]}>
                <Text style={[styles.loanBadgeText, { color: item.status === "RETURNED" ? "#10b981" : "#f59e0b" }]}>
                  {item.status === "RETURNED" ? "KEMBALI" : "PINJAM"}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderAccount = () => {
    if (isLoggedIn) {
      // Member card view
      return (
        <ScrollView contentContainerStyle={styles.accountScroll}>
          <View style={styles.memberCard}>
            <Text style={styles.memberCardHeader}>KARTU ANGGOTA PERPUSTAKAAN</Text>
            <View style={styles.divider} />
            <View style={styles.memberRow}>
              <View>
                <Text style={styles.memberLabel}>NAMA ANGGOTA</Text>
                <Text style={styles.memberValue}>{user?.name.toUpperCase()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.memberLabel}>PERAN</Text>
                <Text style={[styles.memberValue, { color: "#fa7faa" }]}>{user?.role}</Text>
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.memberLabel}>EMAIL</Text>
              <Text style={styles.memberSubValue}>{user?.email}</Text>
            </View>
            <Barcode value={user?.id.toString() ?? "0"} />
          </View>

          <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
            <Text style={styles.logoutCardText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // Login form
    return (
      <ScrollView contentContainerStyle={styles.accountScroll}>
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>Masuk ke Akun</Text>
          <Text style={styles.loginSubtitle}>
            Login untuk membaca bab skripsi yang terkunci dan melihat riwayat peminjaman Anda.
          </Text>

          {authError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={styles.textInput}
            placeholder="nama@email.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>KATA SANDI</Text>
          <TextInput
            style={styles.textInput}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.loginBtn, authLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>MASUK</Text>
            )}
          </TouchableOpacity>

          {/* API Host config */}
          <TouchableOpacity
            style={styles.settingsToggle}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={styles.settingsToggleText}>
              {showSettings ? "Sembunyikan Pengaturan Host" : "Konfigurasi Host API Server"}
            </Text>
          </TouchableOpacity>

          {showSettings && (
            <View style={styles.settingsBox}>
              <Text style={styles.inputLabel}>ALAMAT HOST API</Text>
              <TextInput
                style={styles.textInput}
                value={apiHost}
                onChangeText={setApiHost}
                placeholder="http://192.168.x.x:3000"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <Text style={styles.settingsHint}>
                Gunakan http://10.0.2.2:3000 untuk Android Emulator, atau alamat IP komputer Anda jika menggunakan HP fisik dalam satu jaringan Wi-Fi yang sama.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fc" />

      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.topHeaderTitle}>PERPUS DIGITAL</Text>
          <Text style={styles.topHeaderSub}>
            {isLoggedIn ? `Halo, ${user?.name}` : "Repository Ilmiah"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {isLoggedIn && (
            <View style={styles.loggedInBadge}>
              <Text style={styles.loggedInBadgeText}>ANGGOTA</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.hostBtn}
            onPress={() => { setTempHost(apiHost); setShowHostModal(true); }}
          >
            <Text style={styles.hostBtnText}>HOST</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {activeTab === "repository" && renderRepository()}
        {activeTab === "catalog"    && renderCatalog()}
        {activeTab === "loans"      && renderLoans()}
        {activeTab === "account"    && renderAccount()}
      </View>

      {/* ── Bottom Tab Bar ───────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {(
          [
            { key: "repository", label: "Repository" },
            { key: "catalog",    label: "Katalog"    },
            { key: "loans",      label: "Pinjaman"   },
            { key: "account",    label: isLoggedIn ? "Akun" : "Masuk" },
          ] as { key: typeof activeTab; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIndicator, isActive && styles.tabIndicatorActive]} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Host Settings Modal ─────────────────────────────────────── */}
      <Modal
        visible={showHostModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Konfigurasi Host API</Text>
            <Text style={styles.modalSubtitle}>
              Masukkan alamat IP server Next.js Anda. HP dan komputer harus terhubung ke Wi-Fi yang sama.
            </Text>
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>ALAMAT HOST API</Text>
            <TextInput
              style={styles.textInput}
              value={tempHost}
              onChangeText={setTempHost}
              placeholder="http://192.168.x.x:3000"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalHintBox}>
              <Text style={styles.modalHint}>• Emulator Android: http://10.0.2.2:3000</Text>
              <Text style={styles.modalHint}>• HP Fisik (Wi-Fi): http://192.168.1.x:3000</Text>
              <Text style={styles.modalHint}>• Cek IP komputer: ipconfig (Windows)</Text>
            </View>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                setApiHost(tempHost);
                apiHostRef.current = tempHost;
                setShowHostModal(false);
                // Reload data dengan host baru
                if (activeTab === "catalog") { setBookError(""); loadBooks(); }
                else if (activeTab === "repository") loadTheses();
              }}
            >
              <Text style={styles.loginBtnText}>SIMPAN &amp; TERAPKAN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutCard, { marginTop: 10 }]}
              onPress={() => setShowHostModal(false)}
            >
              <Text style={styles.logoutCardText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles (Clean Light Theme) ──────────────────────────────────────────────
const C = {
  bg:         "#f8f9fc",
  surface:    "#ffffff",
  border:     "#e5e7eb",
  primary:    "#5b48e0",
  primarySoft:"#ede9fe",
  ink:        "#111827",
  muted:      "#6b7280",
  faint:      "#9ca3af",
  accent:     "#f43f5e",
  success:    "#10b981",
  warning:    "#f59e0b",
  locked:     "#fef3c7",
  lockedBorder:"#fbbf24",
};

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: C.bg },

  // Top header
  topHeader: {
    flexDirection:      "row",
    justifyContent:     "space-between",
    alignItems:         "center",
    paddingHorizontal:  20,
    paddingVertical:    14,
    backgroundColor:    C.surface,
    borderBottomWidth:  1,
    borderBottomColor:  C.border,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  topHeaderTitle:    { fontSize: 17, fontWeight: "800", color: C.ink, letterSpacing: 0.3 },
  topHeaderSub:      { fontSize: 11, color: C.primary, fontWeight: "600", marginTop: 1 },
  loggedInBadge:     { backgroundColor: C.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  loggedInBadgeText: { fontSize: 10, color: C.primary, fontWeight: "800", letterSpacing: 0.5 },

  // Bottom tab bar
  bottomBar: {
    flexDirection:     "row",
    backgroundColor:   C.surface,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    paddingBottom:     Platform.OS === "ios" ? 16 : 4,
  },
  tabBtn:            { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabIndicator:      { width: 24, height: 3, borderRadius: 2, backgroundColor: "transparent", marginBottom: 4 },
  tabIndicatorActive:{ backgroundColor: C.primary },
  tabLabel:          { fontSize: 11, color: C.muted, fontWeight: "600" },
  tabLabelActive:    { color: C.primary },

  // Shared
  searchBar:         { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: {
    backgroundColor: C.bg,
    color:           C.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     C.border,
    fontSize:        14,
  },
  listPad:           { padding: 16, paddingBottom: 32 },
  emptyText:         { color: C.muted, textAlign: "center", marginTop: 48, fontSize: 14 },
  sectionHeader: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  sectionTitle:      { fontSize: 15, fontWeight: "700", color: C.ink },
  refreshBtn:        { fontSize: 12, color: C.primary, fontWeight: "600" },

  // Thesis card
  thesisCard: {
    backgroundColor: C.surface,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    14,
    overflow:        "hidden",
  },
  thesisHeader:      { flexDirection: "row", alignItems: "center", padding: 16 },
  thesisTitle:       { fontSize: 14, fontWeight: "700", color: C.ink, marginTop: 6, marginBottom: 4, lineHeight: 20 },
  thesisMeta:        { fontSize: 12, color: C.muted },
  chevron:           { fontSize: 12, color: C.muted, marginLeft: 8 },

  // Chapters
  chaptersBox:       { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  chaptersLabel:     { fontSize: 10, fontWeight: "800", color: C.faint, letterSpacing: 1, marginBottom: 8 },
  chapterRow: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius:    8,
    backgroundColor: C.bg,
    marginBottom:    6,
    borderWidth:     1,
    borderColor:     C.border,
  },
  chapterRowLocked:  { backgroundColor: C.locked, borderColor: C.lockedBorder },
  chapterName:       { fontSize: 13, fontWeight: "600", color: C.ink },
  chapterLockedHint: { fontSize: 11, color: C.warning, marginTop: 2 },
  chapterBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  chapterBtnOpen:    { backgroundColor: C.primary },
  chapterBtnLocked:  { backgroundColor: C.lockedBorder },
  chapterBtnText:    { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  abstractBox:       { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  abstractLabel:     { fontSize: 10, fontWeight: "800", color: C.faint, letterSpacing: 1, marginBottom: 4 },
  abstractText:      { fontSize: 13, color: C.muted, lineHeight: 20 },
  advisorBox:        { flexDirection: "row", marginTop: 10, flexWrap: "wrap" },
  advisorLabel:      { fontSize: 12, fontWeight: "700", color: C.ink },
  advisorText:       { fontSize: 12, color: C.muted, marginLeft: 4 },

  // Status badge
  badge:             { alignSelf: "flex-start", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  badgeText:         { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  // Book card
  bookCard: {
    backgroundColor: C.surface,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         14,
    marginBottom:    10,
    flexDirection:   "row",
    alignItems:      "center",
  },
  bookTitle:         { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 4 },
  bookMeta:          { fontSize: 12, color: C.muted, marginTop: 1 },
  stockBadge:        { alignItems: "center", marginLeft: 10 },
  stockText:         { fontSize: 11, fontWeight: "800", textAlign: "center" },

  // Loan card
  loanCard: {
    backgroundColor: C.surface,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         14,
    marginBottom:    10,
    flexDirection:   "row",
    alignItems:      "center",
  },
  loanTitle:         { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 4 },
  loanMeta:          { fontSize: 12, color: C.muted },
  loanDate:          { fontSize: 11, color: C.muted, marginTop: 3 },
  fineText:          { fontSize: 11, color: C.accent, fontWeight: "700", marginTop: 4 },
  loanBadge:         { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  loanBadgeText:     { fontSize: 10, fontWeight: "800" },

  // Account / member card
  accountScroll:     { flexGrow: 1, padding: 20 },
  memberCard: {
    backgroundColor: C.surface,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         24,
    marginBottom:    16,
  },
  memberCardHeader:  { fontSize: 11, fontWeight: "800", color: C.primary, textAlign: "center", letterSpacing: 1.5 },
  divider:           { height: 1, backgroundColor: C.border, marginVertical: 16 },
  memberRow:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  memberLabel:       { fontSize: 10, color: C.faint, fontWeight: "700", letterSpacing: 1 },
  memberValue:       { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 2 },
  memberSubValue:    { fontSize: 13, color: C.muted, marginTop: 2 },
  logoutCard: {
    backgroundColor: "#fef2f2",
    borderWidth:     1,
    borderColor:     "#fecaca",
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      "center",
  },
  logoutCardText:    { fontSize: 13, fontWeight: "700", color: C.accent },

  // Barcode
  barcodeContainer:  { alignItems: "center", marginTop: 10, padding: 12, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: C.border },
  barcodeLines:      { flexDirection: "row", height: 50, alignItems: "center" },
  barcodeLine:       { height: "100%", backgroundColor: "#000" },
  barcodeText:       { color: C.ink, fontSize: 9, fontWeight: "800", letterSpacing: 2, marginTop: 8 },

  // Login form
  loginBox: {
    backgroundColor: C.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         24,
    marginTop:       8,
  },
  loginTitle:        { fontSize: 20, fontWeight: "800", color: C.ink, marginBottom: 6 },
  loginSubtitle:     { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 24 },
  inputLabel:        { fontSize: 10, fontWeight: "800", color: C.faint, letterSpacing: 1, marginBottom: 6 },
  textInput: {
    backgroundColor: C.bg,
    color:           C.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     C.border,
    fontSize:        14,
    marginBottom:    16,
  },
  loginBtn:          { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  loginBtnText:      { fontSize: 14, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  errorAlert: {
    backgroundColor: "#fef2f2",
    borderWidth:     1,
    borderColor:     "#fecaca",
    borderRadius:    8,
    padding:         12,
    marginBottom:    16,
  },
  errorAlertText:    { color: C.accent, fontSize: 13, fontWeight: "600" },
  settingsToggle:    { alignItems: "center", marginTop: 20, paddingVertical: 8 },
  settingsToggleText:{ fontSize: 12, color: C.primary, fontWeight: "600" },
  settingsBox:       { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  settingsHint:      { fontSize: 11, color: C.faint, lineHeight: 16, marginTop: 4 },

  // Host button in header
  hostBtn: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      6,
    backgroundColor:   C.primarySoft,
    borderWidth:       1,
    borderColor:       C.primary + "40",
  },
  hostBtnText: { fontSize: 10, color: C.primary, fontWeight: "800", letterSpacing: 0.5 },

  // Host modal
  modalOverlay: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent:  "flex-end",
  },
  modalBox: {
    backgroundColor: C.surface,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:         24,
    paddingBottom:   36,
  },
  modalTitle:    { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 4 },
  modalHintBox:  { backgroundColor: C.bg, borderRadius: 8, padding: 12, marginVertical: 12, gap: 4 },
  modalHint:     { fontSize: 12, color: C.muted, lineHeight: 18 },

  // Error box in catalog
  errorBox: {
    margin:          20,
    padding:         20,
    backgroundColor: "#fff5f5",
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     "#fecaca",
    alignItems:      "center",
  },
  errorBoxTitle: { fontSize: 15, fontWeight: "800", color: C.accent, marginBottom: 8 },
  errorBoxMsg:   { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  errorBoxBtn:   { backgroundColor: C.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, width: "100%" as const, alignItems: "center" as const },
  errorBoxBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
