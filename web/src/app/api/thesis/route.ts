/* eslint-disable */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

// GET /api/thesis - Get theses list with search filters
export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const statusParam = searchParams.get("status"); // PENDING, APPROVED, REJECTED

    // Default filters
    let whereClause: any = {};

    // Determine query permissions based on roles
    if (!user || user.role === "GUEST" || user.role === "STUDENT") {
      // Public / Guest / Student can only see APPROVED theses by default, 
      // or the Student's own uploaded theses
      if (user && user.role === "STUDENT") {
        whereClause = {
          OR: [
            { status: "APPROVED" },
            { uploaderId: user.userId }
          ]
        };
      } else {
        whereClause = { status: "APPROVED" };
      }
    } else {
      // Admin/Librarian can filter by status or see all
      if (statusParam) {
        whereClause.status = statusParam;
      }
    }

    // Apply search query if present
    if (q) {
      const searchFilter = {
        OR: [
          { title: { contains: q } },
          { abstract: { contains: q } },
          { authorName: { contains: q } },
          { department: { contains: q } },
        ]
      };

      if (whereClause.OR) {
        // Merge conditions
        whereClause = {
          AND: [
            whereClause,
            searchFilter
          ]
        };
      } else {
        whereClause = {
          ...whereClause,
          ...searchFilter
        };
      }
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const [total, theses] = await Promise.all([
      prisma.thesis.count({ where: whereClause }),
      prisma.thesis.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          chapters: {
            orderBy: { id: "asc" }
          }
        }
      })
    ]);

    return NextResponse.json({
      data: theses,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET theses error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST /api/thesis - Upload thesis (Student/Librarian/Admin)
export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user || user.role === "GUEST") {
      return NextResponse.json({ message: "Tidak diizinkan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const abstract = formData.get("abstract") as string;
    const authorName = formData.get("authorName") as string;
    const advisor1 = formData.get("advisor1") as string;
    const advisor2 = formData.get("advisor2") as string || "";
    const department = formData.get("department") as string;
    const yearStr = formData.get("year") as string;

    if (!title || !abstract || !authorName || !advisor1 || !department || !yearStr) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const chaptersMetadataStr = formData.get("chaptersMetadata") as string | null;
    const chaptersMetadata = chaptersMetadataStr ? JSON.parse(chaptersMetadataStr) : [];

    const chaptersData = [];

    if (chaptersMetadata && chaptersMetadata.length > 0) {
      // Multiple chapters mode
      for (let i = 0; i < chaptersMetadata.length; i++) {
        const file = formData.get(`file_${i}`) as File | null;
        const meta = chaptersMetadata[i];
        if (!file || !meta) {
          return NextResponse.json({ message: `Berkas PDF untuk bab ${meta?.name || i + 1} tidak ditemukan` }, { status: 400 });
        }

        // Validate type & size
        if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
          return NextResponse.json({ message: `Bab ${meta.name} harus berupa file PDF` }, { status: 400 });
        }
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          return NextResponse.json({ message: `Ukuran file Bab ${meta.name} melebihi batas 10MB` }, { status: 400 });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), "public", "uploads", "theses");
        await fs.mkdir(uploadDir, { recursive: true });

        const safeFileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeFileName);
        await fs.writeFile(filePath, buffer);

        chaptersData.push({
          chapterName: meta.name,
          pdfPath: `/uploads/theses/${safeFileName}`,
          isLocked: false, // Default is unlocked until librarian sets lock on approval
        });
      }
    } else {
      // Fallback: Single file mode (e.g. from mobile application / old forms)
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ message: "Silakan pilih berkas PDF skripsi" }, { status: 400 });
      }

      if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
        return NextResponse.json({ message: "File harus dalam format PDF" }, { status: 400 });
      }
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ message: "Ukuran file PDF melebihi batas maksimal 10MB" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "uploads", "theses");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeFileName);
      await fs.writeFile(filePath, buffer);

      chaptersData.push({
        chapterName: "Dokumen Lengkap",
        pdfPath: `/uploads/theses/${safeFileName}`,
        isLocked: false,
      });
    }

    if (chaptersData.length === 0) {
      return NextResponse.json({ message: "Harap unggah minimal satu bab skripsi" }, { status: 400 });
    }

    // Save in database
    const thesis = await prisma.thesis.create({
      data: {
        title,
        abstract,
        authorName,
        advisor1,
        advisor2: advisor2 || null,
        department,
        year: parseInt(yearStr),
        pdfPath: chaptersData[0].pdfPath, // fallback main pdfPath to first chapter path
        status: user.role === "STUDENT" ? "PENDING" : "APPROVED",
        uploaderId: user.userId,
        chapters: {
          create: chaptersData,
        },
      },
      include: {
        chapters: true,
      },
    });

    return NextResponse.json(
      { message: "Skripsi berhasil diunggah dan sedang menunggu verifikasi petugas", thesis },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST thesis error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat memproses unggahan" },
      { status: 500 }
    );
  }
}
