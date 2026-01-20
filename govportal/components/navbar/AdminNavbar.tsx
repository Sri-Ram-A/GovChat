"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Menu, X, Sun, Moon, Shield, FileText, User, LogOut, ChevronDown, Home, Bell, MessageSquare, } from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  items?: { label: string; href: string; icon?: React.ReactNode }[];
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Services",
    items: [
      { label: "File Complaint", href: "/citizen/complaints" },
      { label: "View Status", href: "/citizen/status" },
      { label: "Documents", href: "/citizen/documents" },
      { label: "Licenses", href: "/citizen/licenses" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Guidelines", href: "/resources/guidelines" },
      { label: "FAQs", href: "/resources/faq" },
      { label: "Contact Us", href: "/resources/contact" },
      { label: "Announcements", href: "/resources/announcements" },
    ],
  },
  { label: "About Us", href: "/about-us" },
];

export default function GovernmentNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md  supports-backdrop-filter:bg-background/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-lg bg-primary/90 text-primary-foreground group-hover:bg-primary transition-colors shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-foreground">
                GovChat
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Governance Made Simple
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-primary/5"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-primary/5 flex items-center gap-1">
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}

                {/* Dropdown Menu */}
                {item.items && (
                  <div className="absolute left-0 mt-0 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 backdrop-blur-md ">
                    {item.items.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {subitem.icon}
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggler */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <div className="mr-2 h-4 w-4">⚙️</div>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors hidden sm:flex"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/citizen/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/citizen/complaints" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    My Complaints
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/citizen/notifications" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <div className="my-2 border-t border-border" />
                <DropdownMenuItem className="text-destructive cursor-pointer flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-lg"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-border pt-4">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setActiveSubmenu(
                          activeSubmenu === item.label ? null : item.label
                        )
                      }
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors flex items-center justify-between"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          activeSubmenu === item.label && "rotate-180"
                        )}
                      />
                    </button>
                    {activeSubmenu === item.label && item.items && (
                      <div className="pl-4 space-y-1">
                        {item.items.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {subitem.icon}
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <Link
                href="/citizen/complaints"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-4 w-4" />
                File Complaint
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
