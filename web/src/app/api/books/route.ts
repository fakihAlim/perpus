import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

import { processAndSavePDF } from "@/lib/pdf-utils";

// GET /api/books - Get books (public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const categoryId = searchParams.get("categoryId");

    const whereClause: Record<string, unknown> = q
      ? {
          OR: [
            { title: { contains: q } },
            { author: { contains: q } },
            { publisher: { contains: q } },
          ],
        }
      : {};

    if (categoryId) {
      whereClause.categories = {
        some: { id: parseInt(categoryId) }
      };
    }

    const skip = (page - 1) * limit;

    const [total, books] = await Promise.all([
      prisma.book.count({ where: Object.keys(whereClause).length > 0 ? whereClause : undefined }),
      prisma.book.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: { categories: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({
      data: books,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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

    const contentType = request.headers.get("content-type") || "";
    let title, author, publisher, year, isbn, stock, coverUrl, type, pdfUrl, categoryIdsStr;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = formData.get("title") as string;
      author = formData.get("author") as string;
      publisher = formData.get("publisher") as string;
      year = formData.get("year") as string;
      isbn = formData.get("isbn") as string;
      stock = formData.get("stock") as string;
      coverUrl = formData.get("coverUrl") as string;
      type = formData.get("type") as "PHYSICAL" | "DIGITAL";
      categoryIdsStr = formData.get("categoryIds") as string || "";
      
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
      type = body.type || "PHYSICAL";
      pdfUrl = body.pdfUrl;
      categoryIdsStr = body.categoryIds || "";
    }

    if (!title || !author || !publisher || !year) {
      return NextResponse.json(
        { message: "Field judul, penulis, penerbit, dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    let categoryIds: number[] = [];
    if (Array.isArray(categoryIdsStr)) {
      categoryIds = categoryIdsStr.map(id => parseInt(id));
    } else if (typeof categoryIdsStr === "string" && categoryIdsStr.trim() !== "") {
      categoryIds = categoryIdsStr.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        publisher,
        year: parseInt(year?.toString() || "0"),
        isbn: isbn || null,
        stock: stock ? parseInt(stock.toString()) : 1,
        type: type || "PHYSICAL",
        coverUrl: coverUrl || null,
        pdfUrl: pdfUrl || null,
        categories: categoryIds.length > 0 ? {
          connect: categoryIds.map(id => ({ id }))
        } : undefined
      },
      include: { categories: true }
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
