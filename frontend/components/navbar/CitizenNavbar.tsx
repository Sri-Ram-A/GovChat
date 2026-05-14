"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Bell,
  User,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getStoredToken, clearStoredToken } from "@/services/auth";
import { REQUEST } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href?: string;
  items?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Home", href: "/citizen/home" },
  {
    label: "Services",
    items: [
      { label: "File Complaint", href: "/citizen/post" },
      { label: "Community Feed", href: "/citizen/complaints" },
    ],
  },
  { label: "Gov Services AI", href: "/citizen/chat" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function CitizenNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      REQUEST("GET", "citizens/me/")
        .then((res: any) => setUser(res))
        .catch(console.error);
    }
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    router.push("/citizen/login");
  };

  const getUserInitials = () => {
    if (!user?.user) return "U";
    const first = user.user.first_name?.[0] || "";
    const last = user.user.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getFullName = () => {
    if (!user?.user) return "Loading...";
    return `${user.user.first_name} ${user.user.last_name}`;
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md shadow-sm">
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="w-[200px]">
          <Link href="/citizen/home" className="flex items-center gap-2 group" title="Go to Home">
            <span className="text-2xl font-bold tracking-tight text-[#0f172a]">
              GovChat
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <div className="hidden lg:flex flex-1 justify-center items-center gap-4">
          {navItems.map(function(item) {
            const isActive = item.href === pathname || 
                           (item.items?.some(function(sub) { return pathname === sub.href; }));

            return (
              <div key={item.label} className="relative group">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors py-2 px-4 rounded-md hover:bg-accent/50",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={`Go to ${item.label}`}
                  >
                    <span className="relative">
                      {item.label}
                      {isActive && (
                        <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#b45309] rounded-full" />
                      )}
                    </span>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className={cn(
                          "text-sm font-medium transition-colors py-2 px-4 rounded-md hover:bg-accent/50 flex items-center gap-1",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                        title="Open Services Menu"
                      >
                        <span className="relative flex items-center gap-1">
                          {item.label}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                          {isActive && (
                            <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#b45309] rounded-full" />
                          )}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.items?.map(function(subitem) {
                        return (
                          <DropdownMenuItem key={subitem.href} asChild>
                            <Link href={subitem.href} className="cursor-pointer">
                              {subitem.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="w-[200px] flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={function() { setTheme(theme === "dark" ? "light" : "dark"); }}
              title="Toggle Dark Mode"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              title="View Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
            </Button>
          </div>

          <div className="h-8 w-px bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 pl-2 pr-1 h-10 rounded-full hover:bg-accent"
                title="User Profile Menu"
              >
                <span className="text-xs font-bold text-foreground hidden sm:inline uppercase tracking-tight">
                  {getFullName()}
                </span>
                <Avatar className="h-8 w-8 border border-border shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account Settings
              </div>
              <DropdownMenuItem asChild>
                <Link href="/citizen/profile" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/citizen/complaints?filter=my" className="cursor-pointer flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> My Complaints
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive cursor-pointer flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-lg"
            onClick={function() { setIsOpen(!isOpen); }}
            title={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-2">
          {navItems.map(function(item) {
            const isActive = item.href === pathname || 
                           (item.items?.some(function(sub) { return pathname === sub.href; }));

            return (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                      isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={function() { setIsOpen(false); }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </div>
                    {item.items?.map(function(subitem) {
                      const isSubActive = pathname === subitem.href;
                      return (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            "block px-6 py-2 text-sm font-medium rounded-md transition-colors",
                            isSubActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                          onClick={function() { setIsOpen(false); }}
                        >
                          {subitem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}