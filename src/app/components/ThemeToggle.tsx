"use client";

import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string>(() =>
        typeof window !== "undefined" ? localStorage.getItem("theme") || "dark" : "dark",
    );

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.remove("dark");
            root.classList.add("light");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <button
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="rounded-md border border-white/10 bg-white/3 px-2 py-1 text-sm text-white"
        >
            {theme === "dark" ? "🌞" : "🌙"}
        </button>
    );
}
