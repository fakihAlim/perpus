import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Tidak diizinkan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Kata sandi lama dan baru wajib diisi" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Kata sandi lama salah" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Kata sandi baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Kata sandi berhasil diperbarui" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
