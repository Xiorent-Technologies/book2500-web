"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import {
  Wallet,
  History,
  CreditCard,
  ArrowDownToLine,
  UserCog,
  BookOpen,
  User,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const profileActions = [
  { label: "Profile", icon: <User className="w-4 h-4" />, href: "/profile" },
  { label: "Deposit", icon: <Wallet className="w-4 h-4" />, href: "/deposit" },
  {
    label: "Withdraw",
    icon: <ArrowDownToLine className="w-4 h-4" />,
    href: "/withdraw",
  },
  {
    label: "Transactions",
    icon: <History className="w-4 h-4" />,
    href: "/transaction-log",
  },
  {
    label: "Deposit History",
    icon: <CreditCard className="w-4 h-4" />,
    href: "/deposit-log",
  },
  {
    label: "Bet History",
    icon: <BookOpen className="w-4 h-4" />,
    href: "/bet-log",
  },
  {
    label: "Update Profile",
    icon: <UserCog className="w-4 h-4" />,
    href: "/profile-setting",
  },
];

export default function ProfileSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Define allowed paths for sidebar
  const allowedPaths = [
    "/profile",
    "/deposit",
    "/withdraw",
    "/transaction-log",
    "/deposit-log",
    "/bet-log",
    "/profile-setting",
  ];

  // Don't render if not on allowed path
  if (!allowedPaths.includes(pathname)) {
    return null;
  }

  const NavItems = () => (
    <nav className="space-y-2">
      {profileActions.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          className={`w-full justify-start text-sm font-medium transition-all duration-200 
            ${
              pathname === action.href
                ? "bg-brand-purple text-brand-gold border-l-4 border-brand-gold pl-3"
                : "text-gray-300 hover:bg-brand-purple/50 hover:text-white"
            }`}
          onClick={() => {
            router.push(action.href);
            setIsOpen(false);
          }}
        >
          <span className="w-8">{action.icon}</span>
          <span>{action.label}</span>
        </Button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden sticky top-0 z-10 bg-[#1A0F2E] p-4 mb-4 flex justify-between items-center">
        <h2 className="text-white font-bold">My Account</h2>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-[#2D1A4A] border-purple-900 p-0 w-[280px]"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Navigation</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={() => setIsOpen(false)}
                >
                  {/* <X className="h-5 w-5" /> */}
                </Button>
              </div>
              <NavItems />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block md:col-span-3">
        <div className="bg-[#2D1A4A] rounded-lg shadow-xl p-4 border border-purple-900 sticky top-4">
          <NavItems />
        </div>
      </div>
    </>
  );
}
