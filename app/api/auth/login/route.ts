// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// 🟢 Import your new local logger
import { addLocalLog } from "@/app/api/lib/logger";

// 1. Initialize Turso Cloud Link with environment guardrails
const databaseUrl = process.env.TURSO_DATABASE_URL;
const databaseToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !databaseToken) {
    throw new Error("Missing critical Turso database environment variables.");
}

const turso = createClient({
    url: databaseUrl,
    authToken: databaseToken,
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

// 2. Strong Typing for User Row from LibSQL/Turso
interface UserRow {
    id: string;
    email: string;
    name: string;
    role: string;
    password_hash: string;
    business_id: string | null;
    shop_id: string | null;
    [key: string]: any;
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            // 🟢 Log the missing input validation failure
            addLocalLog("/api/login", "POST", 400, "Login rejected: Missing email or password input.");
            return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Locate user identity in Turso cloud matrix
        const userResult = await turso.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [normalizedEmail]
        });

        if (userResult.rows.length === 0) {
            // 🟢 Log the nonexistent user attempt
            addLocalLog("/api/login", "POST", 401, `Failed login attempt: User ${normalizedEmail} does not exist.`);
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Safely type-cast the database result row
        const user = userResult.rows[0] as unknown as UserRow;

        // Verify hashed passwords match perfectly
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            // 🟢 Log the password mismatch
            addLocalLog("/api/login", "POST", 401, `Failed login attempt: Incorrect password for ${normalizedEmail}.`);
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Extract tenant operational boundaries
        const businessId = user.business_id;
        const shopId = user.shop_id;

        // Generate organizational session payload token
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                businessId: businessId,
                shopId: shopId
            },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        // 🟢 Log the successful authentication
        addLocalLog("/api/login", "POST", 200, `User verified: ${normalizedEmail} (${user.role}) has logged in.`);

        // Return successfully wrapped payload parameters back to Expo client
        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            context: { businessId, shopId }
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ [AUTH ROUTE CRASH]:", error.message);

        // 🟢 Log the actual route runtime crash details
        addLocalLog("/api/login", "POST", 500, `CRITICAL SYSTEM ERROR: ${error.message}`);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}