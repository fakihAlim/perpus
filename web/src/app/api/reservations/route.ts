import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/reservations - Get reservations
export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 401 });
    }

    const whereClause: Record<string, unknown> = {};
    if (user.role === "STUDENT" || user.role === "GUEST") {
      whereClause.userId = user.userId;
    }

    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            stock: true,
          }
        }
      },
      orderBy: { reserveDate: "desc" }
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("GET reservations error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/reservations - Create a reservation
export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json({ message: "bookId wajib diisi" }, { status: 400 });
    }

    // Check if book exists and has 0 stock
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId.toString()) }
    });

    if (!book) {
      return NextResponse.json({ message: "Buku tidak ditemukan" }, { status: 404 });
    }

    if (book.stock > 0) {
      return NextResponse.json({ message: "Buku masih tersedia, Anda bisa langsung meminjamnya" }, { status: 400 });
    }

    // Check if user already has an active reservation for this book
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId: user.userId,
        bookId: parseInt(bookId.toString()),
        status: "PENDING"
      }
    });

    if (existingReservation) {
      return NextResponse.json({ message: "Anda sudah melakukan reservasi untuk buku ini" }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.userId,
        bookId: parseInt(bookId.toString()),
        status: "PENDING"
      }
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("POST reservation error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
