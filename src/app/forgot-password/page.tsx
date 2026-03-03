"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, ArrowLeft, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1); // 1 = Request Code, 2 = Verify & Reset
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Form states
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "An error occurred.");
            } else {
                setSuccessMsg(data.message);
                setStep(2); // Move to reset step
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "An error occurred.");
                setIsLoading(false);
            } else {
                // Success! Redirect to login
                router.push("/login?verified=true");
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect to server.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-primary" />
                        {step === 1 ? "Forgot Password" : "Reset Password"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Enter your email address to receive a 6-digit reset code."
                            : `Enter the code sent to ${email} and your new password.`}
                    </CardDescription>
                </CardHeader>

                {step === 1 ? (
                    <form onSubmit={handleRequestCode}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        className="pl-9"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </Button>
                            <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {successMsg && (
                                <Alert className="bg-green-500/10 border-green-500/20 text-green-600">
                                    <AlertDescription>{successMsg}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="code">6-Digit Reset Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    className="tracking-widest font-mono text-lg"
                                    required
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" disabled={isLoading}>
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setError(""); setSuccessMsg(""); }}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Try a different email
                            </button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
