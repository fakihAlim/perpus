import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/stats - Get dashboard statistics (Admin/Librarian only)
export async function GET(request: Request) {
  try {
    const adminUser = getAuthenticatedUser(request);
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const now = new Date();

    const [
      totalBooks,
      totalStudents,
      totalActiveBorrowings,
      totalOverdueBorrowings,
      totalPendingTheses,
      totalPendingReservations
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.borrowing.count({ where: { status: "BORROWED" } }),
      prisma.borrowing.count({ 
        where: { 
          status: "BORROWED",
          dueDate: { lt: now } 
        } 
      }),
      prisma.thesis.count({ where: { status: "PENDING" } }),
      prisma.reservation.count({ where: { status: "PENDING" } })
    ]);

    return NextResponse.json({
      totalBooks,
      totalStudents,
      totalActiveBorrowings,
      totalOverdueBorrowings,
      totalPendingTheses,
      totalPendingReservations
    });
  } catch (error) {
    console.error("GET stats error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
