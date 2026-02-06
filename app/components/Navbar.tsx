"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "#contact" },
];

const Navbar = ({ isOpen, onClose }: NavbarProps) => {
  const pathname = usePathname();

  return (
    <div
      className={`fixed inset-0 z-30 flex items-center justify-center transition-all duration-700 ease-in-out ${
        isOpen ? "opacity-100 navbar-glass" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <ul className="text-center" onClick={(e) => e.stopPropagation()}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          
          return (
            <li
              key={item.label}
              className={`transition-all duration-700 ease-in-out ${
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${isOpen ? index * 200 : 0}ms` }}
            >
              {item.href.startsWith("/") ? (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`text-4xl sm:text-6xl font-extrabold transition-all duration-300 transform hover:scale-110 block ${
                    isActive
                      ? "text-blue-500 scale-110"
                      : "text-gray-800 hover:text-blue-500"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  onClick={onClose}
                  className={`text-4xl sm:text-6xl font-extrabold transition-all duration-300 transform hover:scale-110 block ${
                    isActive
                      ? "text-blue-500 scale-110"
                      : "text-gray-800 hover:text-blue-500"
                  }`}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Navbar;
