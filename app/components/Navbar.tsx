"use client";

import { useState } from "react";

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = ["Home", "About", "Projects", "Contact"];

const Navbar = ({ isOpen, onClose }: NavbarProps) => {
  const [activeItem, setActiveItem] = useState("Home");

  return (
    <div
      className={`fixed inset-0 z-30 flex items-center justify-center transition-all duration-700 ease-in-out ${
        isOpen ? "opacity-100 navbar-glass" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <ul className="text-center" onClick={(e) => e.stopPropagation()}>
        {navItems.map((item, index) => (
          <li
            key={item}
            className={`transition-all duration-700 ease-in-out ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: `${isOpen ? index * 200 : 0}ms` }}
          >
            <a
              href={`#${item.toLowerCase()}`}
              onClick={() => {
                setActiveItem(item);
                onClose();
              }}
              className={`text-4xl sm:text-6xl font-extrabold transition-all duration-300 transform hover:scale-110 ${
                activeItem === item
                  ? "text-black scale-110"
                  : "text-white hover:text-black"
              }`}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navbar;
