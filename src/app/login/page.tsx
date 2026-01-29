"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { LogIn } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </React.Suspense>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const verified = searchParams.get("verified");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const success = await login(identifier, password);

        if (!success) {
            alert("Invalid email/phone or password.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <LogIn className="w-6 h-6 text-primary" /> Login
                    </CardTitle>
                    <CardDescription>
                        Enter your email or phone to access your mental health space.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {verified && (
                            <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Account verified! Please sign in.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Email or Phone Number</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Email or Phone Number"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
