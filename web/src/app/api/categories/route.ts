import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/categories - Get all categories (Public)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Add a new category (Admin & Librarian only)
export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || (user.role !== "ADMIN" && user.role !== "LIBRARIAN")) {
      return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ message: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json({ message: "Kategori dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST categories error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
