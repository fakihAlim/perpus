import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/books - Get books (public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const books = await prisma.book.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { author: { contains: q } },
              { publisher: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("GET books error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/books - Add a new book (Admin & Librarian only)
export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { title, author, publisher, year, isbn, stock, coverUrl } = await request.json();

    if (!title || !author || !publisher || !year) {
      return NextResponse.json(
        { message: "Field judul, penulis, penerbit, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        publisher,
        year: parseInt(year.toString()),
        isbn: isbn || null,
        stock: stock ? parseInt(stock.toString()) : 1,
        coverUrl: coverUrl || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("POST book error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
