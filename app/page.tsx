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
        className="glassmorphism p-4 sm:p-8 rounded-lg shadow-lg text-center relative"
        onClick={() => {
          if (isNavOpen) {
            setIsNavOpen(false);
          }
        }}
      >
        {!isNavOpen && (
          <button
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white"
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
          className="rounded-full mx-auto floating w-32 h-32 sm:w-40 sm:h-40"
        />
        <h1 className="text-3xl sm:text-4xl font-bold mt-4">Chamba Nanang</h1>
        <p className="text-base sm:text-lg mt-2 text-center max-w-md sm:max-w-xl">
          I am a software engineer, tech enthusiast, and lifelong learner.
        </p>
        <div className="flex justify-center space-x-4 mt-4 social-icons">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FaTwitter size={24} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={24} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </main>
  );
}
