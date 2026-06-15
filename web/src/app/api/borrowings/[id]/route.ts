import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// PUT /api/borrowings/[id] - Process book return (Librarian/Admin only)
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

    const borrowing = await prisma.borrowing.findUnique({
      where: { id: parseInt(id) },
    });

    if (!borrowing) {
      return NextResponse.json({ message: "Data peminjaman tidak ditemukan" }, { status: 404 });
    }

    if (borrowing.status === "RETURNED") {
      return NextResponse.json({ message: "Buku sudah dikembalikan sebelumnya" }, { status: 400 });
    }

    const returnDate = new Date();
    const dueDate = new Date(borrowing.dueDate);

    // Calculate denda (Rp 1.000 per day late)
    let fine = 0;
    const diffTime = returnDate.getTime() - dueDate.getTime();
    if (diffTime > 0) {
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 1000;
    }

    // Process return: increment stock and update borrowing status
    const [updatedBook, updatedBorrowing] = await prisma.$transaction([
      prisma.book.update({
        where: { id: borrowing.bookId },
        data: { stock: { increment: 1 } },
      }),
      prisma.borrowing.update({
        where: { id: parseInt(id) },
        data: {
          returnDate,
          status: "RETURNED",
          fine,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Pengembalian buku berhasil dicatat",
      borrowing: updatedBorrowing,
    });
  } catch (error) {
    console.error("PUT borrowing return error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE /api/borrowings/[id] - Delete record (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const { id } = await params;

    const borrowing = await prisma.borrowing.findUnique({
      where: { id: parseInt(id) },
    });

    if (!borrowing) {
      return NextResponse.json({ message: "Data peminjaman tidak ditemukan" }, { status: 404 });
    }

    // If borrowing is currently active (not returned), increment stock back
    if (borrowing.status === "BORROWED") {
      await prisma.book.update({
        where: { id: borrowing.bookId },
        data: { stock: { increment: 1 } },
      });
    }

    await prisma.borrowing.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Data peminjaman berhasil dihapus" });
  } catch (error) {
    console.error("DELETE borrowing error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
