"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/meals", label: "Meals", icon: "🍽️" },
  { href: "/grocery", label: "Grocery", icon: "🛒" },
  { href: "/memory", label: "Memory", icon: "🧠" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-muted shadow-soft z-40">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2"
            >
              <span
                className={`flex items-center justify-center w-11 rounded-btn text-lg py-1 ${
                  active ? "bg-muted" : "opacity-50"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-medium mt-0.5 ${
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
