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

import { processAndSavePDF } from "@/lib/pdf-utils";

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
    const contentType = request.headers.get("content-type") || "";
    let title, author, publisher, year, isbn, stock, coverUrl, type, pdfUrl, categoryIdsStr;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = formData.get("title") as string | null;
      author = formData.get("author") as string | null;
      publisher = formData.get("publisher") as string | null;
      year = formData.get("year") as string | null;
      isbn = formData.get("isbn") as string | null;
      stock = formData.get("stock") as string | null;
      coverUrl = formData.get("coverUrl") as string | null;
      type = formData.get("type") as "PHYSICAL" | "DIGITAL" | null;
      categoryIdsStr = formData.get("categoryIds");
      
      const file = formData.get("pdfFile") as File | null;
      if (type === "DIGITAL" && file) {
        pdfUrl = await processAndSavePDF(file, "public/uploads/books");
      }
    } else {
      const body = await request.json();
      title = body.title;
      author = body.author;
      publisher = body.publisher;
      year = body.year;
      isbn = body.isbn;
      stock = body.stock;
      coverUrl = body.coverUrl;
      type = body.type;
      pdfUrl = body.pdfUrl;
      categoryIdsStr = body.categoryIds;
    }

    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    let categoryIds: number[] | undefined = undefined;
    if (categoryIdsStr !== undefined && categoryIdsStr !== null) {
      if (Array.isArray(categoryIdsStr)) {
        categoryIds = categoryIdsStr.map((id: unknown) => parseInt(String(id)));
      } else if (typeof categoryIdsStr === "string" && categoryIdsStr.trim() !== "") {
        categoryIds = categoryIdsStr.split(",").map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
      } else if (categoryIdsStr === "") {
        categoryIds = [];
      }
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
        type: type || undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
        pdfUrl: pdfUrl !== undefined ? pdfUrl : undefined,
        categories: categoryIds !== undefined ? {
          set: categoryIds.map(catId => ({ id: catId }))
        } : undefined,
      },
      include: { categories: true }
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
