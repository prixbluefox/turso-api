// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
const generateUUID = () => crypto.randomUUID();

export async function POST(request: Request): Promise<NextResponse> {
    try {
        // 🛠️ 1. Extract pin from incoming JSON payload
        const { email, password, fullName, businessName, pin } = await request.json();

        // Include pin in the required validation check
        if (!email || !password || !fullName || !businessName || !pin) {
            return NextResponse.json({ error: "Missing required registration parameters (including PIN)." }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUserResult = await turso.execute({
            sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
            args: [normalizedEmail]
        });

        if (existingUserResult.rows.length > 0) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        }

        // Generate unique UUID tokens
        const userId = `usr_${generateUUID()}`;
        const businessId = `biz_${generateUUID()}`;
        const shopId = `shp_${generateUUID()}`;
        const passwordHash = await bcrypt.hash(password, 10);

        // Order-Safe Sequence: Parent entities first, then fully populated child rows
        const statements = [
            // Step A: Create the Business container first
            {
                sql: `INSERT INTO businesses (id, owner_id, business_name, business_type, created_at)
                      VALUES (?, ?, ?, 'RETAIL', CURRENT_TIMESTAMP);`,
                args: [businessId, userId, businessName]
            },
            // Step B: Create the Shop branch assigned to that Business
            {
                sql: `INSERT INTO shops (id, business_id, name, is_active, deleted_at)
                      VALUES (?, ?, 'Main Branch', 1, 0);`,
                args: [shopId, businessId]
            },
            // 🛠️ Step C: Map the custom pin straight into the users table insertion query
            {
                sql: `INSERT INTO users (id, email, name, role, password_hash, pin, business_id, shop_id, created_at)
                      VALUES (?, ?, ?, 'OWNER', ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
                args: [userId, normalizedEmail, fullName, passwordHash, pin, businessId, shopId]
            }
        ];

        await turso.batch(statements, "write");
        console.log(`✨ Successfully created tenant stack and injected baseline seeds for: ${normalizedEmail}`);

        // Sign session token
        const token = jwt.sign(
            { userId, role: 'OWNER', businessId, shopId },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        return NextResponse.json({
            token,
            user: { id: userId, email: normalizedEmail, name: fullName, role: 'OWNER' },
            context: { businessId, shopId }
        }, { status: 201 });

    } catch (error: any) {
        console.error("❌ [SIGNUP SEED CRASH]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}