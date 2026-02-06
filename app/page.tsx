"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaBars,
} from "react-icons/fa";
import Navbar from "./components/Navbar";

export default function Home() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-2 animated-background">
      <Navbar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      <div
        className="glassmorphism p-4 sm:p-8 rounded-2xl text-center relative max-w-2xl mx-4"
        onClick={() => {
          if (isNavOpen) {
            setIsNavOpen(false);
          }
        }}
      >
        {!isNavOpen && (
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 rounded-full bg-blue-500 text-white hover:scale-110 transition-transform duration-300 shadow-lg hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setIsNavOpen(true);
            }}
            aria-label="Open menu"
          >
            <FaBars size={24} />
          </button>
        )}
        <Image
          src="/profile.png"
          alt="My Picture"
          width={120}
          height={120}
          className="rounded-full mx-auto floating w-32 h-32 sm:w-48 sm:h-48 border-4 shadow-xl"
        />
        <h1 className="text-4xl sm:text-5xl font-bold mt-6 text-black">
          Chamba Nanang
        </h1>
        <p className="text-lg sm:text-xl mt-3 text-gray-600 font-medium">
          Software Engineer & Tech Enthusiast
        </p>
        <p className="text-base sm:text-lg mt-3 text-gray-500 text-center max-w-lg mx-auto leading-relaxed">
          Building modern web applications with React, Next.js, and TypeScript. Passionate about creating innovative solutions and learning new technologies.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <a
            href="/about"
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-600"
          >
            About Me
          </a>
          <a
            href="#contact"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
          >
            Get In Touch
          </a>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mt-8">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gray-100 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110 shadow-md"
            aria-label="Twitter"
          >
            <FaTwitter size={24} />
          </a>
          <a
            href="https://linkedin.com/in/chamba-nanang"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gray-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110 shadow-md"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-300 hover:scale-110 shadow-md"
            aria-label="GitHub"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </main>
  );
}
