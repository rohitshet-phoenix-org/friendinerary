"use client";
import { Home, Plane, PlusCircle, List, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { name: "home", icon: Home, href: "/home" },
  { name: "booking", icon: Plane, href: "/booking" },
  { name: "new", icon: PlusCircle, href: "/new-itinerary" },
  { name: "saved", icon: List, href: "/saved" },
  { name: "profile", icon: User, href: "/profile" },
];

export default function BottomNav({ current }: { current: string }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className={`p-3 ${pathname === item.href ? "text-blue-600" : "text-gray-600"}`}>
            <item.icon className="w-6 h-6 mx-auto" />
            <span className="text-xs capitalize">{item.name === "new" ? "+" : item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}