// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { apiLogs } from "@/app/api/lib/logger";

export async function GET() {
    try {
        // Return the live, in-memory array of logs
        return NextResponse.json({ logs: apiLogs }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}