import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// PUT /api/reservations/[id] - Process reservation (Admin/Librarian only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = getAuthenticatedUser(request);
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // FULFILLED or CANCELLED

    if (!["FULFILLED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reservation) {
      return NextResponse.json({ message: "Reservasi tidak ditemukan" }, { status: 404 });
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json({ message: "Reservasi sudah diproses sebelumnya" }, { status: 400 });
    }

    // If FULFILLED, create a borrowing automatically?
    // According to the plan: Admin manually converts it to a borrowing when the student comes.
    // Or we can just create the borrowing here and decrement stock. Let's do that!
    
    if (status === "FULFILLED") {
      const book = await prisma.book.findUnique({ where: { id: reservation.bookId } });
      if (!book || book.stock <= 0) {
        return NextResponse.json({ message: "Stok buku tidak mencukupi untuk memenuhi reservasi ini" }, { status: 400 });
      }

      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(borrowDate.getDate() + 7); // Default 7 days

      await prisma.$transaction([
        prisma.book.update({
          where: { id: reservation.bookId },
          data: { stock: { decrement: 1 } }
        }),
        prisma.borrowing.create({
          data: {
            userId: reservation.userId,
            bookId: reservation.bookId,
            borrowDate,
            dueDate,
            status: "BORROWED"
          }
        }),
        prisma.reservation.update({
          where: { id: parseInt(id) },
          data: { status: "FULFILLED" }
        })
      ]);

      return NextResponse.json({ message: "Reservasi berhasil dipenuhi dan diubah menjadi peminjaman" });
    } else {
      // Just cancel it
      await prisma.reservation.update({
        where: { id: parseInt(id) },
        data: { status: "CANCELLED" }
      });
      return NextResponse.json({ message: "Reservasi dibatalkan" });
    }

  } catch (error) {
    console.error("PUT reservation error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
