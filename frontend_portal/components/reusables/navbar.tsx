"use client"

import Link from "next/link"
import { ThemeSwitcher } from "./theme-switcher"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  links?: { href: string; label: string }[]
  onLogout?: () => void
}

export function Navbar({ links = [], onLogout }: NavbarProps) {
  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          GovPortal
        </Link>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm hover:text-primary">
              {link.label}
            </Link>
          ))}
          <ThemeSwitcher />
          {onLogout && (
            <Button onClick={onLogout} variant="outline" size="sm">
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
