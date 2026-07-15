// app/api/auth/verify-tenant/route.ts
import { NextResponse } from 'next/server';
import { createClient } from "@libsql/client/web";
// 🟢 Import the in-memory logger
import { addLocalLog } from "@/app/api/lib/logger";


const databaseUrl = process.env.TURSO_DATABASE_URL;
const databaseToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !databaseToken) {
    throw new Error("Missing critical Turso database environment variables.");
}

const turso = createClient({
    url: databaseUrl,
    authToken: databaseToken,
});

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { email } = await request.json();

        if (!email) {
            addLocalLog("/api/auth/verify-tenant", "POST", 400, "Verification failed: No email parameter provided.");
            return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Query Turso cloud to see if this user row actually exists
        const result = await turso.execute({
            sql: "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
            args: [normalizedEmail]
        });

        // 🚨 If Turso has 0 rows, the cloud doesn't recognize this user!
        if (result.rows.length === 0) {
            addLocalLog("/api/auth/verify-tenant", "POST", 404, `Tenant absent: ${normalizedEmail} not found in database.`);
            return NextResponse.json({ valid: false, message: "User not found in Turso" }, { status: 404 });
        }

        // 🟢 Log the successful check
        addLocalLog("/api/auth/verify-tenant", "POST", 200, `Tenant verified: ${normalizedEmail} exists.`);

        return NextResponse.json({ message: "Signup route placeholder" });

    } catch (error: any) {
        console.error("❌ [VERIFY TENANT CRASH]:", error.message);

        // 🟢 Log unexpected failures
        addLocalLog("/api/auth/verify-tenant", "POST", 500, `TENANT VERIFICATION CRASH: ${error.message}`);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}