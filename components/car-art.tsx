export function CarArt({
  brand,
  variant = 0,
  hero = false,
}: {
  brand: string;
  variant?: number;
  hero?: boolean;
}) {
  const color = hero
    ? "#bec9d2"
    : brand === "BMW"
      ? "#9baab7"
      : brand === "Mercedes"
        ? "#6d7e8b"
        : brand === "Jaguar"
          ? "#37635b"
          : "#aaa8a0";
  return (
    <svg
      viewBox="0 0 700 320"
      className={hero ? "hero-car" : "car-art"}
      role="img"
      aria-label={`Ilustracja samochodu ${brand}; nie jest zdjęciem oferty`}
    >
      <defs>
        <linearGradient
          id={`paint-${brand}-${variant}-${hero}`}
          x1="0"
          y1="0"
          x2="0.3"
          y2="1"
        >
          <stop stopColor={color} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor="#24303a" />
        </linearGradient>
        <linearGradient
          id={`glass-${brand}-${variant}-${hero}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop stopColor="#76929d" />
          <stop offset="1" stopColor="#111d28" />
        </linearGradient>
      </defs>
      <ellipse cx="355" cy="263" rx="276" ry="22" fill="#000" opacity=".5" />
      <path
        d="M77 211 91 178 207 151 281 97 Q300 84 346 88 L438 94 Q460 96 484 118 L540 161 604 177 Q626 184 631 211 L630 235 608 246 96 247 70 234Z"
        fill={`url(#paint-${brand}-${variant}-${hero})`}
        stroke="#bfd0db"
        strokeOpacity=".28"
        strokeWidth="2"
      />
      <path
        d="m225 151 64-46q13-9 35-8l41 1-2 54Z"
        fill={`url(#glass-${brand}-${variant}-${hero})`}
      />
      <path
        d="m375 99 58 5q19 3 34 18l44 34-137-4Z"
        fill={`url(#glass-${brand}-${variant}-${hero})`}
      />
      <path
        d="m362 159-1 76m162-72 9 68m-309-71-19 65m17-8 321 1"
        fill="none"
        stroke="#101b25"
        strokeOpacity=".7"
        strokeWidth="2"
      />
      <path
        d="m93 180 116-19 313 4 79 17M107 204l466 0"
        fill="none"
        stroke="#fff"
        strokeOpacity=".25"
        strokeWidth="2"
      />
      <path d="m79 210 42-3-3 18-45-2m519-28 34 8 4 13-42-7" fill="#e1f4ef" />
      <path
        d="m333 168 15 0m144 4h16"
        stroke="#c1ced4"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {[178, 548].map((x) => (
        <g key={x}>
          <circle cx={x} cy="238" r="46" fill="#0a0d11" />
          <circle
            cx={x}
            cy="238"
            r="31"
            fill="#647580"
            stroke="#aab7bf"
            strokeWidth="3"
          />
          <circle cx={x} cy="238" r="22" fill="#18232b" />
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={i}
              d={`M${x} 211 L${x + 5} 233 ${x + 24} 247 ${x + 1} 243Z`}
              fill="#aab6be"
              transform={`rotate(${i * 72} ${x} 238)`}
            />
          ))}
          <circle cx={x} cy="238" r="7" fill="#b7c5cc" />
        </g>
      ))}
      <path d="M269 152q-17-18-28-8l2 13Z" fill={color} />
    </svg>
  );
}
