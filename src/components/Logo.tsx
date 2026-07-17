import React from "react";

export default function Logo({ className = "w-10 h-10", light = false }: { className?: string; light?: boolean }) {
  const strokeColor = light ? "#ffffff" : "#000000";
  const fillColor = light ? "#ffffff" : "#000000";

  return (
    <svg
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon frame */}
      <polygon
        points="60,6 112,36 112,96 60,126 8,96 8,36"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinejoin="miter"
        fill="none"
      />
      
      {/* Monogram stylized letters: J, A, F in geometric architecture */}
      {/* Letter J (Left side) */}
      <path
        d="M 28 35 H 44 V 85 C 44 91 40 94 34 94 C 28 94 26 91 26 85 M 26 70 H 34"
        stroke={strokeColor}
        strokeWidth="6.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Letter A (Middle) */}
      <path
        d="M 60 30 L 48 95 M 60 30 L 72 95 M 51 72 H 69"
        stroke={strokeColor}
        strokeWidth="6.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Letter F (Right side) */}
      <path
        d="M 94 35 H 78 V 95 M 78 58 H 92 M 78 81 H 88"
        stroke={strokeColor}
        strokeWidth="6.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
