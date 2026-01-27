"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/login?verified=true");
            } else {
                setError(data.error || "Verification failed");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-primary" /> Verify Email
                    </CardTitle>
                    <CardDescription>
                        We've sent a 6-digit code to your email. Please enter it below.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleVerify}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="123456"
                                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                                autoFocus
                            />

                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full h-10"
                            type="submit"
                            disabled={code.length !== 6 || isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Verify Account
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
