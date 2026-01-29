
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Check, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Request Code
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStep("RESET");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to send code");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword })
            });

            if (res.ok) {
                alert("Password reset successfully! Please login.");
                router.push("/login");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to reset password");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-primary" />
                        {step === "REQUEST" ? "Forgot Password" : "Reset Password"}
                    </CardTitle>
                    <CardDescription>
                        {step === "REQUEST"
                            ? "Enter your email to receive a verification code."
                            : "Enter the code sent to your email and your new password."}
                    </CardDescription>
                </CardHeader>

                {step === "REQUEST" ? (
                    <form onSubmit={handleRequestCode}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" disabled={isLoading}>
                                {isLoading ? "Sending Code..." : "Send Verification Code"}
                            </Button>
                            <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    required
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest uppercase"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Password"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep("REQUEST")}
                                className="text-sm text-muted-foreground hover:text-primary"
                            >
                                Resend Code (Go Back)
                            </button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
