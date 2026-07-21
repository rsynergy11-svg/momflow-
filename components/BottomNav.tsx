"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/meals", label: "Meals", icon: "🍽️" },
  { href: "/memory", label: "Memory", icon: "🧠" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-muted shadow-soft z-40">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2.5"
            >
              <span className={`text-xl ${active ? "" : "opacity-50"}`}>{item.icon}</span>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-primary" : "text-text-secondary"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
