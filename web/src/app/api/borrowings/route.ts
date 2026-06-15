import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/borrowings - Get borrowings list
export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });
    }

    let whereClause: any = {};
    if (user.role === "STUDENT" || user.role === "GUEST") {
      whereClause.userId = user.userId;
    }

    const borrowings = await prisma.borrowing.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
      orderBy: { borrowDate: "desc" },
    });

    return NextResponse.json(borrowings);
  } catch (error) {
    console.error("GET borrowings error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/borrowings - Record a book borrowing (Librarian/Admin only)
export async function POST(request: Request) {
  try {
    const adminUser = getAuthenticatedUser(request);
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { userId, bookId, days } = await request.json();

    if (!userId || !bookId) {
      return NextResponse.json(
        { message: "Field userId dan bookId wajib diisi" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId.toString()) },
    });
    if (!targetUser) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Check if book exists and is in stock
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId.toString()) },
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    if (book.stock <= 0) {
      return NextResponse.json({ message: "Stok buku habis" }, { status: 400 });
    }

    // Calculate due date
    const borrowDays = days ? parseInt(days.toString()) : 7;
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + borrowDays);

    // Create transaction (decrement stock and create borrowing)
    const [updatedBook, borrowing] = await prisma.$transaction([
      prisma.book.update({
        where: { id: parseInt(bookId.toString()) },
        data: { stock: { decrement: 1 } },
      }),
      prisma.borrowing.create({
        data: {
          userId: parseInt(userId.toString()),
          bookId: parseInt(bookId.toString()),
          borrowDate,
          dueDate,
          status: "BORROWED",
        },
      }),
    ]);

    return NextResponse.json(borrowing, { status: 201 });
  } catch (error) {
    console.error("POST borrowing error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
