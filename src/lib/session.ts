import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET || "secret-key-change-me";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    console.log("[DEBUG] getSession cookie:", session ? "FOUND" : "MISSING");
    if (!session) return null;
    try {
        const payload = await decrypt(session);
        console.log("[DEBUG] Decrypt success for:", payload?.user?.email);
        return payload;
    } catch (e) {
        console.error("[DEBUG] Decrypt failed:", e);
        return null;
    }
}

export async function setSession(user: any) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user });

    console.log("[DEBUG] setSession for user:", user.email);
    console.log("[DEBUG] NODE_ENV:", process.env.NODE_ENV);
    const isProduction = process.env.NODE_ENV === "production";

    (await cookies()).set("session", session, {
        expires,
        httpOnly: true,
        secure: false, // Ensure this is false on localhost
        sameSite: "lax",
        path: "/",
    });
}

export async function clearSession() {
    (await cookies()).delete("session");
}

// --- Pending Verification Logic ---

export async function getPendingSession() {
    const session = (await cookies()).get("pending_verification")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (e) {
        return null;
    }
}

export async function setPendingSession(data: any) {
    // Expires in 15 minutes for security
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const session = await encrypt(data);

    (await cookies()).set("pending_verification", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}

export async function clearPendingSession() {
    (await cookies()).delete("pending_verification");
}
