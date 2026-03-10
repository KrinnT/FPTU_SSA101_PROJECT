"use client";

export default function ExamMaterialsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
            <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-left max-w-3xl overflow-auto border border-red-500/20">
                <p><strong>Name:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Digest:</strong> {error.digest}</p>
                <p><strong>Stack:</strong></p>
                <pre className="text-xs whitespace-pre-wrap">{error.stack}</pre>
            </div>
            <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
