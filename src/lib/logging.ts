interface SecurityLogEntry {
    timestamp: string;
    level: "warn" | "error";
    event: string;
    clerkId?: string;
    ip?: string;
    detail?: string;
}

export function logSecurity(entry: Omit<SecurityLogEntry, "timestamp">) {
    const log: SecurityLogEntry = {
        timestamp: new Date().toISOString(),
        ...entry,
    };
    console.error(JSON.stringify(log));
}
