// lib/logger.ts

export interface LocalLog {
    id: string;
    route: string;
    method: string;
    status: number;
    message: string;
    created_at: string;
}

// Store logs in a global variable so it persists across hot-reloads during server runtime
const globalForLogs = global as unknown as { apiLogs: LocalLog[] };

if (!globalForLogs.apiLogs) {
    globalForLogs.apiLogs = [
        {
            id: "init",
            route: "System Gateway",
            method: "INFO",
            status: 200,
            message: "Gateway initialized successfully. Ready to intercept endpoint routes.",
            created_at: new Date().toISOString()
        }
    ];
}

export const apiLogs = globalForLogs.apiLogs;

export function addLocalLog(route: string, method: string, status: number, message: string) {
    const newLog: LocalLog = {
        id: `log_${Math.random().toString(36).substring(2, 9)}`,
        route,
        method,
        status,
        message,
        created_at: new Date().toISOString()
    };

    // Add new logs to the beginning of the array and limit history to the last 100 entries
    apiLogs.unshift(newLog);
    if (apiLogs.length > 100) {
        apiLogs.pop();
    }
}