"use client";

import AvatarDropdown from "./AvatarDropdown";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-edge bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <AvatarDropdown />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
