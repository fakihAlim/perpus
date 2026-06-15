import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/books/[id] - Get book by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("GET book by id error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Update book details (Admin & Librarian only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const { title, author, publisher, year, isbn, stock, coverUrl } = await request.json();

    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title: title || undefined,
        author: author || undefined,
        publisher: publisher || undefined,
        year: year ? parseInt(year.toString()) : undefined,
        isbn: isbn !== undefined ? isbn : undefined,
        stock: stock ? parseInt(stock.toString()) : undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
      },
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("PUT book error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id] - Delete book (Admin & Librarian only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;

    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Buku berhasil dihapus" });
  } catch (error) {
    console.error("DELETE book error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
