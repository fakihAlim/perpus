import React, { useState, useEffect } from "react";
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
} from "react-native";

// Types
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
  status: string;
  book: {
    title: string;
    author: string;
  };
}

// Visual Barcode Component
const Barcode = ({ value }: { value: string }) => {
  const lines = [2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 4, 2, 1, 3, 2, 4, 1, 2];
  return (
    <View style={styles.barcodeContainer}>
      <View style={styles.barcodeLines}>
        {lines.map((width, index) => (
          <View
            key={index}
            style={[
              styles.barcodeLine,
              {
                width: width,
                marginRight: index % 4 === 0 ? 2 : 1,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.barcodeText}>MEMBER ID: {value.padStart(6, "0")}</Text>
    </View>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  
  // Settings & Auth States
  const [apiHost, setApiHost] = useState("http://10.0.2.2:3000"); // default for Android Emulator to PC localhost
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Navigation Tabs inside Dashboard
  const [activeTab, setActiveTab] = useState<"catalog" | "card" | "loans">("catalog");

  // Dashboard Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  // Load catalog / loans
  const loadData = async (currentTab = activeTab, query = searchQuery) => {
    setDataLoading(true);
    try {
      if (currentTab === "catalog") {
        const res = await fetch(`${apiHost}/api/books?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        }
      } else if (currentTab === "loans") {
        const res = await fetch(`${apiHost}/api/borrowings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBorrowings(data);
        }
      }
    } catch (err) {
      console.warn("API request failed:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData(activeTab, searchQuery);
    }
  }, [isLoggedIn, activeTab]);

  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError("Email dan password wajib diisi");
      return;
    }
    
    setAuthLoading(true);
    setAuthError("");
    
    try {
      const res = await fetch(`${apiHost}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || "Gagal masuk");
        return;
      }

      if (data.user.role !== "STUDENT" && data.user.role !== "GUEST") {
        setAuthError("Aplikasi mobile dikhususkan untuk Anggota.");
        return;
      }

      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
    } catch (err) {
      console.warn(err);
      setAuthError("Koneksi ke server gagal. Periksa kembali IP Host.");
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
    setBooks([]);
    setBorrowings([]);
  };

  if (!isLoggedIn) {
    /* Login & Setup View */
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginScroll}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>PERPUS_DIGITAL</Text>
            <Text style={styles.logoSub}>APLIKASI MOBILE ANGGOTA</Text>
          </View>

          {authError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>[ERROR]: {authError.toUpperCase()}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="name@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>KATA SANDI</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator size="small" color="#150f23" />
              ) : (
                <Text style={styles.loginButtonText}>MASUK</Text>
              )}
            </TouchableOpacity>

            {/* IP Server Configuration */}
            <TouchableOpacity
              style={styles.settingsToggle}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Text style={styles.settingsToggleText}>
                {showSettings ? "[HIDE HOST CONFIG]" : "[CONFIGURE API HOST]"}
              </Text>
            </TouchableOpacity>

            {showSettings && (
              <View style={styles.settingsBox}>
                <Text style={styles.settingsLabel}>HOST API SERVER</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={apiHost}
                  onChangeText={setApiHost}
                  placeholder="http://192.168.x.x:3000"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
                <Text style={styles.settingsInfo}>
                  Gunakan http://10.0.2.2:3000 untuk Android Emulator, atau alamat IP komputer Anda jika menggunakan HP fisik (dalam satu Wi-Fi).
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* Logged In Dashboard View */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PERPUS_DIGITAL</Text>
          <Text style={styles.headerUser}>ANGGOTA: {user?.name.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>[EXIT]</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "catalog" && styles.activeTab]}
          onPress={() => setActiveTab("catalog")}
        >
          <Text style={[styles.tabText, activeTab === "catalog" && styles.activeTabText]}>
            KATALOG
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "card" && styles.activeTab]}
          onPress={() => setActiveTab("card")}
        >
          <Text style={[styles.tabText, activeTab === "card" && styles.activeTabText]}>
            KARTU
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "loans" && styles.activeTab]}
          onPress={() => setActiveTab("loans")}
        >
          <Text style={[styles.tabText, activeTab === "loans" && styles.activeTabText]}>
            PINJAMAN
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentBody}>
        {activeTab === "catalog" && (
          <View style={{ flex: 1 }}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari judul atau penulis buku..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  loadData("catalog", text);
                }}
              />
            </View>

            {dataLoading ? (
              <ActivityIndicator size="large" color="#c2ef4e" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={books}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Buku tidak ditemukan</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.bookCard}>
                    <View style={styles.bookDetails}>
                      <Text style={styles.bookTitle}>{item.title}</Text>
                      <Text style={styles.bookAuthor}>Penulis: {item.author}</Text>
                      <Text style={styles.bookInfo}>Penerbit: {item.publisher} | Tahun: {item.year}</Text>
                    </View>
                    <View style={styles.stockStatus}>
                      <Text
                        style={[
                          styles.stockText,
                          { color: item.stock > 0 ? "#10b981" : "#f43f5e" },
                        ]}
                      >
                        {item.stock > 0 ? `QTY: ${item.stock}` : "HABIS"}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {activeTab === "card" && (
          <View style={styles.cardContainer}>
            {/* Premium Card Layout */}
            <View style={styles.digitalCard}>
              <Text style={styles.cardHeader}>KARTU ANGGOTA PERPUSTAKAAN</Text>
              
              <View style={styles.cardSeparator} />

              <View style={styles.cardInfoRow}>
                <View>
                  <Text style={styles.cardInfoLabel}>NAMA ANGGOTA</Text>
                  <Text style={styles.cardInfoValue}>{user?.name.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.cardInfoLabel}>ROLE</Text>
                  <Text style={[styles.cardInfoValue, { color: "#fa7faa" }]}>
                    {user?.role.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardInfoRow}>
                <View>
                  <Text style={styles.cardInfoLabel}>EMAIL</Text>
                  <Text style={styles.cardInfoSubValue}>{user?.email}</Text>
                </View>
              </View>

              {/* Barcode Section for scanning */}
              <Barcode value={user?.id.toString() || "0"} />
            </View>
          </View>
        )}

        {activeTab === "loans" && (
          <View style={{ flex: 1 }}>
            {dataLoading ? (
              <ActivityIndicator size="large" color="#c2ef4e" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={borrowings}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Tidak ada riwayat peminjaman buku</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.loanCard}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.loanBook}>{item.book.title}</Text>
                      <Text style={styles.loanAuthor}>Penulis: {item.book.author}</Text>
                      <Text style={styles.loanDate}>
                        Batas Pengembalian: {new Date(item.dueDate).toLocaleDateString("id-ID")}
                      </Text>
                    </View>
                    <View style={styles.loanStatusBadge}>
                      <Text
                        style={[
                          styles.loanStatusText,
                          {
                            color: item.status === "RETURNED" ? "#10b981" : "#f59e0b",
                            backgroundColor:
                              item.status === "RETURNED"
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(245, 158, 11, 0.1)",
                          },
                        ]}
                      >
                        {item.status === "RETURNED" ? "KEMBALI" : "PINJAM"}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Global Layout (Sentri Dark Theme)
  container: {
    flex: 1,
    backgroundColor: "#1f1633", // surface-canvas-dark
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#362d59", // hairline-violet
    backgroundColor: "#150f23", // primary
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerUser: {
    fontSize: 10,
    color: "#c2ef4e", // accent-lime
    fontWeight: "bold",
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#362d59", // hairline-violet
    borderWidth: 1,
    borderColor: "#422082",
  },
  logoutButtonText: {
    color: "#bdb8c0",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Auth Screen styles
  loginContainer: {
    flex: 1,
    backgroundColor: "#1f1633",
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 35,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 11,
    color: "#fa7faa", // accent-pink
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 4,
  },
  errorAlert: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.2)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    color: "#f43f5e",
    fontSize: 12,
    fontWeight: "bold",
  },
  formCard: {
    backgroundColor: "#150f23", // surface-night
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#362d59", // hairline-violet
  },
  inputLabel: {
    color: "#bdb8c0", // on-dark-muted
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff", // surface-canvas-light
    color: "#1f1633", // ink-deep
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6, // rounded.sm
    borderWidth: 1,
    borderColor: "#cfcfdb", // hairline-cool
    marginBottom: 20,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#fff", // button-inverted style (white)
    paddingVertical: 14,
    borderRadius: 8, // rounded.md
    alignItems: "center",
  },
  loginButtonText: {
    color: "#1f1633", // text-primary
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.2, // button-cap tracking
  },
  settingsToggle: {
    alignItems: "center",
    marginTop: 20,
  },
  settingsToggleText: {
    color: "#c2ef4e", // accent-lime
    fontSize: 12,
    fontWeight: "bold",
  },
  settingsBox: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#362d59",
  },
  settingsLabel: {
    color: "#bdb8c0",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  settingsInput: {
    backgroundColor: "#fff",
    color: "#1f1633",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cfcfdb",
    fontSize: 13,
  },
  settingsInfo: {
    color: "#bdb8c0",
    fontSize: 10,
    marginTop: 6,
    lineHeight: 15,
  },

  // Tabs layout
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#150f23",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#362d59",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#c2ef4e", // accent-lime
  },
  tabText: {
    fontSize: 11,
    color: "#bdb8c0",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#c2ef4e",
  },

  // Dashboard content body
  contentBody: {
    flex: 1,
    backgroundColor: "#1f1633", // surface-canvas-dark
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#362d59",
  },
  searchInput: {
    backgroundColor: "#fff",
    color: "#1f1633",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cfcfdb",
    fontSize: 14,
  },
  listContainer: {
    padding: 15,
  },
  emptyText: {
    color: "#bdb8c0",
    textAlign: "center",
    marginTop: 40,
    fontSize: 13,
    fontFamily: "monospace",
  },

  // Book Card
  bookCard: {
    backgroundColor: "#150f23", // surface-night
    padding: 16,
    borderRadius: 12, // rounded.xl
    borderWidth: 1,
    borderColor: "#362d59", // hairline-violet
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookDetails: {
    flex: 1,
    paddingRight: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  bookAuthor: {
    fontSize: 12,
    color: "#bdb8c0",
    marginTop: 4,
  },
  bookInfo: {
    fontSize: 11,
    color: "#79628c",
    marginTop: 2,
  },
  stockStatus: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // Member Card tab
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  digitalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#150f23", // surface-night
    borderWidth: 1,
    borderColor: "#362d59", // hairline-violet
    borderRadius: 18, // rounded.xxl
    padding: 24,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#c2ef4e", // accent-lime
    textAlign: "center",
  },
  cardSeparator: {
    height: 1,
    backgroundColor: "#362d59",
    marginVertical: 16,
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardInfoLabel: {
    fontSize: 9,
    color: "#79628c",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardInfoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  cardInfoSubValue: {
    fontSize: 12,
    color: "#bdb8c0",
  },

  // Barcode component style
  barcodeContainer: {
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  barcodeLines: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
  },
  barcodeLine: {
    height: "100%",
    backgroundColor: "#000",
  },
  barcodeText: {
    color: "#150f23",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 2,
    marginTop: 8,
  },

  // Loan Card tab
  loanCard: {
    backgroundColor: "#150f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#362d59",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loanBook: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  loanAuthor: {
    fontSize: 12,
    color: "#bdb8c0",
    marginTop: 4,
  },
  loanDate: {
    fontSize: 11,
    color: "#fa7faa", // accent-pink
    marginTop: 6,
  },
  loanStatusBadge: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  loanStatusText: {
    fontSize: 9,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});
