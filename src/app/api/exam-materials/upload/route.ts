import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from "@/lib/session";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        /* clientPayload?: string, */
      ) => {
        // 1. Get user session to verify authorization
        const session = await getSession();
        if (!session?.user?.id) {
            throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint',
            'application/zip',
            'image/png',
            'image/jpeg',
          ],
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            // optional, sent to your server on upload completion
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called on your server after a file is successfully uploaded
        logger.info('Blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
