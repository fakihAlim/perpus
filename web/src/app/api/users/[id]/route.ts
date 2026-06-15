import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// PUT /api/users/[id] - Update user status (approve/reject guest)
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
    const { status, role } = await request.json();

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        role: role || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: `Status pengguna berhasil diperbarui menjadi ${updatedUser.status}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Hanya Admin yang dapat menghapus pengguna" }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
