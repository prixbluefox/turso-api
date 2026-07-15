// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// 🔗 Initialize your server-side Turso cluster link
const remoteTursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://biashara-main-prixbluefox.aws-eu-west-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, businessId, shopId, batches } = body;

        if (!userId || !batches) {
            return NextResponse.json({ error: "Missing required identity synchronization metadata." }, { status: 400 });
        }

        console.log(`📦 [TURSO BACKEND] Processing incoming data batch stream for user: ${userId}`);

        // Run the entire batch inside a high-speed atomic transaction sequence
        const transactionStatements = [];

        // 1. Process Tenant Entities (Businesses)
        if (batches.businesses && batches.businesses.length > 0) {
            for (const biz of batches.businesses) {
                transactionStatements.push({
                    sql: `INSERT INTO businesses (id, owner_id, business_name, business_type, created_at)
                          VALUES (?, ?, ?, ?, ?)
                          ON CONFLICT(id) DO UPDATE SET
                            business_name = excluded.business_name,
                            business_type = excluded.business_type;`,
                    args: [biz.id, userId, biz.business_name, biz.business_type, biz.created_at]
                });
            }
        }

        // 2. Process Branch Entities (Shops)
        if (batches.shops && batches.shops.length > 0) {
            for (const shop of batches.shops) {
                transactionStatements.push({
                    sql: `INSERT INTO shops (id, business_id, name, is_active, deleted_at)
                          VALUES (?, ?, ?, ?, ?)
                          ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            is_active = excluded.is_active,
                            deleted_at = excluded.deleted_at;`,
                    args: [shop.id, shop.business_id, shop.name, shop.is_active ?? 1, shop.deleted_at ?? null]
                });
            }
        }

        // 3. Process Live Transactions / Ledger Sheets
        if (batches.transactions && batches.transactions.length > 0) {
            for (const tx of batches.transactions) {
                transactionStatements.push({
                    sql: `INSERT INTO transactions (id, shop_id, clerk_name, cash_paid, mpesa_paid, created_at)
                          VALUES (?, ?, ?, ?, ?, ?)
                          ON CONFLICT(id) DO NOTHING;`, // Ledger records are typically immutable
                    args: [tx.id, tx.shop_id || shopId, tx.clerk_name || 'Staff Clerk', tx.cash_paid || 0, tx.mpesa_paid || 0, tx.created_at]
                });
            }
        }

        // Execute all mutations collectively over the Turso network channel
        if (transactionStatements.length > 0) {
            await remoteTursoClient.batch(transactionStatements, "write");
            console.log(`✨ Successfully synchronized ${transactionStatements.length} operations directly to cloud tables.`);
        }

        // Return a successful acknowledgment block back to your Expo Go application client engine
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            status: "synchronized"
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ [SYNC CRASH] Server-side remote sync execution failed:", error.message);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}