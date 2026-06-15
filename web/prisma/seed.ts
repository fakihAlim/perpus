import { PrismaClient, Role, UserStatus, ThesisStatus } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL || "mysql://root:@localhost:3306/perpus";
const adapter = new PrismaMariaDb(url);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Memulai seeding database...");

  // Clean existing data to avoid duplicates
  await prisma.borrowing.deleteMany();
  await prisma.thesis.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const librarianPassword = await bcrypt.hash("pustakawan123", 10);
  const studentPassword = await bcrypt.hash("mahasiswa123", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@perpus.com",
      password: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  const librarian = await prisma.user.create({
    data: {
      name: "Ahmad Pustakawan",
      email: "pustakawan@perpus.com",
      password: librarianPassword,
      role: Role.LIBRARIAN,
      status: UserStatus.APPROVED,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "mahasiswa1@perpus.com",
      password: studentPassword,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Siti Aminah",
      email: "mahasiswa2@perpus.com",
      password: studentPassword,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: "Rudi Hermawan",
      email: "mahasiswa3@perpus.com",
      password: studentPassword,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
    },
  });

  console.log("Pengguna berhasil dibuat!");

  // 2. Create Books
  const book1 = await prisma.book.create({
    data: {
      title: "Laskar Pelangi",
      author: "Andrea Hirata",
      publisher: "Bentang Pustaka",
      year: 2005,
      isbn: "979-3062-79-7",
      stock: 5,
      coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300",
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: "Bumi",
      author: "Tere Liye",
      publisher: "Gramedia Pustaka Utama",
      year: 2014,
      isbn: "978-602-03-3290-1",
      stock: 3,
      coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300",
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: "React & Next.js Modern",
      author: "John Doe",
      publisher: "TechPress",
      year: 2023,
      isbn: "978-123-456-789-0",
      stock: 2,
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=300",
    },
  });

  console.log("Buku berhasil dibuat!");

  // 3. Create Sample Theses (Skripsi)
  await prisma.thesis.create({
    data: {
      title: "Analisis Perbandingan Performa Rest API Node.js dan Go",
      abstract: "Skripsi ini membahas perbandingan performa antara Node.js (Express) dan Go (Gin) dalam menangani beban kerja API secara bersamaan (concurrency testing) dengan parameter throughput dan response time.",
      authorName: "Budi Santoso",
      advisor1: "Dr. Ir. H. M. Yusuf, M.T.",
      advisor2: "Indah Permata, S.Kom., M.Cs.",
      department: "Teknik Informatika",
      year: 2025,
      pdfPath: "/uploads/theses/sample_thesis_1.pdf",
      status: ThesisStatus.APPROVED,
      uploaderId: student1.id,
    },
  });

  await prisma.thesis.create({
    data: {
      title: "Rancang Bangun Aplikasi Perpustakaan Berbasis Android",
      abstract: "Penelitian ini mengembangkan aplikasi mobile perpustakaan digital untuk membantu mahasiswa melakukan pencarian katalog buku, reservasi peminjaman, serta akses repository skripsi secara online.",
      authorName: "Siti Aminah",
      advisor1: "Prof. Dr. Suparman, M.Eng.",
      advisor2: "Rahmat Hidayat, M.T.",
      department: "Sistem Informasi",
      year: 2026,
      pdfPath: "/uploads/theses/sample_thesis_2.pdf",
      status: ThesisStatus.PENDING,
      uploaderId: student2.id,
    },
  });

  console.log("Skripsi sampel berhasil dibuat!");
  console.log("Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("Error saat melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
