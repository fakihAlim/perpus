import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

// GET /api/thesis/[id] - Get details of a single thesis
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thesis = await prisma.thesis.findUnique({
      where: { id: parseInt(id) },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        chapters: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!thesis) {
      return NextResponse.json({ message: "Skripsi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(thesis);
  } catch (error) {
    console.error("GET thesis detail error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT /api/thesis/[id] - Approve/Reject or update thesis (Librarian/Admin only)
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
    const body = await request.json();
    const { status, title, abstract, department, year, chaptersConfig } = body;

    const thesis = await prisma.thesis.findUnique({
      where: { id: parseInt(id) },
    });

    if (!thesis) {
      return NextResponse.json({ message: "Skripsi tidak ditemukan" }, { status: 404 });
    }

    // If admin is saving chapter locking configurations
    if (chaptersConfig && Array.isArray(chaptersConfig)) {
      for (const config of chaptersConfig) {
        await prisma.thesisChapter.update({
          where: { id: config.id },
          data: { isLocked: config.isLocked },
        });
      }
    }

    const updatedThesis = await prisma.thesis.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        title: title || undefined,
        abstract: abstract || undefined,
        department: department || undefined,
        year: year ? parseInt(year.toString()) : undefined,
      },
      include: {
        chapters: {
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json({
      message: `Status skripsi berhasil diubah menjadi ${updatedThesis.status}`,
      thesis: updatedThesis,
    });
  } catch (error) {
    console.error("PUT thesis update error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE /api/thesis/[id] - Delete thesis & PDF file from disk
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

    const thesis = await prisma.thesis.findUnique({
      where: { id: parseInt(id) },
      include: {
        chapters: true,
      },
    });

    if (!thesis) {
      return NextResponse.json({ message: "Skripsi tidak ditemukan" }, { status: 404 });
    }

    // Delete all chapter PDF files from disk
    if (thesis.chapters && thesis.chapters.length > 0) {
      for (const ch of thesis.chapters) {
        try {
          const filePath = path.join(process.cwd(), "public", ch.pdfPath);
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`Chapter PDF file not found on disk: ${ch.pdfPath}`, err);
        }
      }
    }

    // Try deleting fallback main file from disk if it differs from first chapter
    if (thesis.pdfPath) {
      try {
        const filePath = path.join(process.cwd(), "public", thesis.pdfPath);
        await fs.unlink(filePath);
      } catch (err) {
        // file might have already been deleted if it was a chapter
      }
    }

    await prisma.thesis.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Skripsi dan semua file PDF bab berhasil dihapus" });
  } catch (error) {
    console.error("DELETE thesis error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
