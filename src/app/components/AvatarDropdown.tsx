"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function AvatarDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user's first name or fallback
  const displayName = user?.firstName || "User";
  const avatarUrl = user?.imageUrl || null;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-sm font-medium text-on-surface">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-edge bg-surface shadow-lg backdrop-blur-xl"
          role="menu"
        >
          <div className="border-b border-edge px-4 py-3">
            <div className="text-sm font-semibold text-on-surface">
              {displayName}
            </div>
            {user?.primaryEmailAddress && (
              <div className="text-xs text-on-surface-dim">
                {user.primaryEmailAddress.emailAddress}
              </div>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-alt"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-alt"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
