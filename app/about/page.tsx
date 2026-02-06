"use client";

import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Navbar from "@/app/components/Navbar";
import About from "@/app/components/About";

export default function AboutPage() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <main className="animated-background">
      <Navbar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {!isNavOpen && (
        <button
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setIsNavOpen(true);
          }}
          aria-label="Open menu"
        >
          <FaBars size={24} />
        </button>
      )}

      <About />
    </main>
  );
}
