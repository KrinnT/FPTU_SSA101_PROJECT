export default function Loading() {
    return (
        <div className="min-h-[80vh] p-4 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-w-[300px]">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-sky-500/10 to-transparent blur-2xl" />

                {/* Spinner Rings */}
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-2 border-4 border-indigo-400 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl animate-pulse">📋</span>
                    </div>
                </div>

                {/* Text Context */}
                <h3 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    Loading Assessments
                </h3>
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                    Retrieving your history... <br />
                    <span className="text-xs opacity-70">(Secure connection waking up)</span>
                </p>
            </div>
        </div>
    );
}
