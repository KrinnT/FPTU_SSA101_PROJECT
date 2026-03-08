import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const material = await prisma.material.findUnique({
            where: { id },
            select: { uploadedById: true }
        });

        if (!material) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        // Only the uploader can delete
        if (material.uploadedById !== session.user.id) {
            return NextResponse.json({ error: "Forbidden – you can only delete your own materials" }, { status: 403 });
        }

        await prisma.material.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[material DELETE]', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
