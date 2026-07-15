import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: "Missing email or password" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Locate user identity in Turso
        const userResult = await turso.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [email.toLowerCase().trim()]
        });

        if (userResult.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const user = userResult.rows[0];

        // 2. Verify hashed password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 3. Extract business and shop constraints linked to this account
        // (If user is a worker, these will be populated from their row context)
        let businessId = user.business_id;
        let shopId = user.shop_id;

        // 4. Generate a session token embedding their isolated organizational parameters
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

        // 5. Return success payload
        return new Response(
            JSON.stringify({
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role },
                context: { businessId, shopId }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}