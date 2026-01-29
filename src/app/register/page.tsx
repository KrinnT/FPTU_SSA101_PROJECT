"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Enforce Email Only
        if (!identifier.includes("@") || !identifier.includes(".")) {
            alert("Please enter a valid email address.");
            setIsLoading(false);
            return;
        }

        const email = identifier;
        const phone = ""; // Disable phone registration

        const response = await register(name, email, phone, password);

        if (!response.success) {
            alert(response.error || "Registration failed. Email or Phone might be taken.");
            setIsLoading(false);
            return;
        }

        if (response.requireVerification) {
            router.push("/verify");
        } else {
            // Success but no verification needed (auto login)
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-secondary" /> Create Account
                    </CardTitle>
                    <CardDescription>
                        Join to track your well-being journey.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Email Address</Label>
                            <Input
                                id="identifier"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
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
                        <Button className="w-full bg-secondary hover:bg-secondary/90 text-white" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
