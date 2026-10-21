import React from "react";
import {
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PlantGuide, StepKind } from "../types";
import { mix, shade } from "./colors";

type Palette = PlantGuide["palette"];

/* ---------------------------------------------------------------- helpers */

const SOIL = "#5A3D29";
const SOIL_WET = "#3A2618";
const WATER = "#4FB3EE";
const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const ci = (
  f: number,
  input: [number, number],
  output: [number, number],
  easing?: (t: number) => number,
) =>
  interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const useSpring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (delay: number, config?: Parameters<typeof spring>[0]["config"]) =>
    spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 120, ...config } });
};

const Sparkle: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number; rotate?: number }> = ({
  x,
  y,
  r,
  color,
  opacity = 1,
  rotate = 0,
}) => (
  <path
    transform={`translate(${x} ${y}) rotate(${rotate}) scale(${r})`}
    d="M0 -1 C 0.12 -0.12 0.12 -0.12 1 0 C 0.12 0.12 0.12 0.12 0 1 C -0.12 0.12 -0.12 0.12 -1 0 C -0.12 -0.12 -0.12 -0.12 0 -1 Z"
    fill={color}
    opacity={opacity}
  />
);

const Drop: React.FC<{ x: number; y: number; s: number; color?: string; opacity?: number }> = ({
  x,
  y,
  s,
  color = WATER,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <path d="M0 -14 C 6 -5 10 0 10 5 A 10 10 0 0 1 -10 5 C -10 0 -6 -5 0 -14 Z" fill={color} />
    <ellipse cx={-3.5} cy={4} rx={2.2} ry={3.5} fill="#fff" opacity={0.7} />
  </g>
);

const LEAF_D = "M0 0 C -14 -8 -18 -34 0 -48 C 18 -34 14 -8 0 0 Z";

/** A small sprout in a pot. (x, y) = centre of the pot opening. */
const MiniPlant: React.FC<{
  x: number;
  y: number;
  w: number;
  palette: Palette;
  grow: number;
  soil?: string;
  children?: React.ReactNode;
  leafBoost?: number;
}> = ({ x, y, w, palette, grow, soil = SOIL, children, leafBoost = 0 }) => {
  const frame = useCurrentFrame();
  const h = w * 0.62;
  const stemLen = w * 0.75 * grow;
  const leaf = shade(palette.leaf, leafBoost);
  const sway = Math.sin(frame / 14) * 4;
  const leaves = [
    { at: 0.45, a: -58, s: 0.9 },
    { at: 0.45, a: 58, s: 0.9 },
    { at: 0.8, a: -42, s: 1.05 },
    { at: 0.8, a: 42, s: 1.05 },
    { at: 1, a: 0, s: 0.9 },
  ];
  const scale = w / 150;
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={w / 2 - 2} ry={w * 0.08} fill={soil} />
      {children}
      <g transform={`translate(${x} ${y}) rotate(${sway * 0.4})`}>
        <path
          d={`M0 4 Q ${-6 * scale} ${-stemLen * 0.5} 0 ${-stemLen}`}
          stroke={shade(palette.leaf, -0.25)}
          strokeWidth={6 * scale}
          fill="none"
          strokeLinecap="round"
        />
        {leaves.map((l, i) => {
          const s = ci(grow, [l.at * 0.7, l.at], [0, l.s]) * scale * 1.5;
          return (
            <g
              key={i}
              transform={`translate(0 ${-stemLen * l.at}) rotate(${l.a + Math.sin(frame / 12 + i) * 5}) scale(${s})`}
            >
              <path d={LEAF_D} fill={shade(leaf, (i % 2) * 0.08)} />
              <path d="M0 -3 L0 -40" stroke={shade(leaf, 0.25)} strokeWidth={2} />
            </g>
          );
        })}
      </g>
      <path
        d={`M${x - w / 2} ${y + 8} L${x + w / 2} ${y + 8} L${x + w * 0.38} ${y + h} Q ${x + w * 0.37} ${y + h + 6} ${x + w * 0.33} ${y + h + 6} L${x - w * 0.33} ${y + h + 6} Q ${x - w * 0.37} ${y + h + 6} ${x - w * 0.38} ${y + h} Z`}
        fill={palette.pot}
      />
      <rect x={x - w / 2 - 8} y={y - 4} width={w + 16} height={h * 0.24} rx={8} fill={shade(palette.pot, 0.08)} />
      <path
        d={`M${x - w * 0.3} ${y + h * 0.35} L${x - w * 0.26} ${y + h * 0.85}`}
        stroke="#fff"
        strokeOpacity={0.2}
        strokeWidth={8 * scale}
        strokeLinecap="round"
      />
    </g>
  );
};

/* ---------------------------------------------------------------- WATER */

const WaterMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const canIn = sp(0);
  const tilt = ci(f, [12, 28], [0, 28], Easing.out(Easing.cubic)) + (f > 28 ? Math.sin((f - 28) / 5) * 1.5 : 0);
  const potIn = sp(6);
  const wet = ci(f, [40, 110], [0, 1]);
  const soilTop = 292;
  const drops: React.ReactNode[] = [];
  for (let k = 0; k < 22; k++) {
    const spawn = 28 + k * 4;
    const age = f - spawn;
    const x0 = 258 + (random(`wx${k}`) - 0.5) * 14;
    if (age >= 0 && age < 16) {
      const t = age / 16;
      drops.push(
        <Drop key={`d${k}`} x={x0 + t * 10} y={168 + (soilTop - 168) * t * t} s={0.75 + random(`ws${k}`) * 0.35} />,
      );
    } else if (age >= 16 && age < 28) {
      const t = (age - 16) / 12;
      drops.push(
        <ellipse
          key={`s${k}`}
          cx={x0 + 10}
          cy={soilTop + 2}
          rx={6 + t * 22}
          ry={2 + t * 5}
          fill="none"
          stroke={WATER}
          strokeWidth={3}
          opacity={(1 - t) * 0.8}
        />,
      );
    }
  }
  const accent = palette.accent;
  return (
    <g>
      <g transform={`translate(0 ${(1 - potIn) * 120})`} opacity={potIn}>
        <MiniPlant
          x={268}
          y={soilTop}
          w={160}
          palette={palette}
          grow={ci(f, [20, 115], [0.35, 1], Easing.out(Easing.quad))}
          soil={mix(SOIL, SOIL_WET, wet)}
          leafBoost={wet * 0.08}
        >
          {wet > 0 && (
            <ellipse cx={268} cy={soilTop + 2} rx={60 * wet} ry={8 * wet} fill={WATER} opacity={0.25} />
          )}
        </MiniPlant>
      </g>
      {drops}
      <g transform={`translate(${(1 - canIn) * -220} ${(1 - canIn) * -40}) rotate(${tilt} 130 130)`}>
        <path d="M86 98 C 86 50 166 50 166 98" stroke={shade(accent, -0.25)} strokeWidth={13} fill="none" strokeLinecap="round" />
        <polygon points="184,146 252,92 266,106 192,174" fill={shade(accent, -0.12)} />
        <ellipse cx={261} cy={98} rx={10} ry={18} transform="rotate(-40 261 98)" fill={shade(accent, -0.25)} />
        <rect x={58} y={92} width={136} height={92} rx={20} fill={accent} />
        <rect x={58} y={118} width={136} height={16} fill={shade(accent, 0.25)} />
        <rect x={70} y={100} width={18} height={70} rx={9} fill="#fff" opacity={0.2} />
        <circle cx={126} cy={152} r={4} fill={shade(accent, -0.35)} opacity={0.5} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- LIGHT */

const LightMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const sunIn = sp(0, { damping: 10 });
  const beam = ci(f, [18, 40], [0, 1]);
  const blink = f % 50 < 4 ? 0.15 : 1;
  const sunCx = 200;
  const sunCy = 116;
  return (
    <g>
      <defs>
        <linearGradient id="light-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54A" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFD54A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`168,170 232,170 330,390 70,390`} fill="url(#light-beam)" opacity={beam} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t = ((f * 0.8 + random(`m${i}`) * 100) % 100) / 100;
        const x = 120 + random(`mx${i}`) * 160 + Math.sin(f / 10 + i) * 6;
        const y = 200 + t * 160;
        return <circle key={i} cx={x} cy={y} r={2.5 + random(`mr${i}`) * 2.5} fill="#FFE58A" opacity={beam * (1 - Math.abs(t - 0.5) * 2) * 0.9} />;
      })}
      <MiniPlant x={200} y={318} w={112} palette={palette} grow={ci(f, [15, 110], [0.45, 1])} leafBoost={beam * 0.12} />
      <g transform={`translate(${sunCx} ${sunCy}) scale(${sunIn})`}>
        <circle r={92 + Math.sin(f / 6) * 6} fill="#FFD54A" opacity={0.22} />
        <g transform={`rotate(${f * 1.4})`}>
          {Array.from({ length: 12 }).map((_, i) => {
            const len = 22 + Math.sin(f / 5 + i * 1.3) * 6;
            return (
              <rect
                key={i}
                x={-6}
                y={-70 - len - 8}
                width={12}
                height={len}
                rx={6}
                fill={i % 2 ? "#FFB627" : "#FFD54A"}
                transform={`rotate(${i * 30})`}
              />
            );
          })}
        </g>
        <circle r={58} fill="#FFCB3C" />
        <circle r={58} fill="none" stroke="#F5A623" strokeWidth={5} />
        <ellipse cx={-18} cy={-8} rx={5.5} ry={7 * blink} fill="#6B3E00" />
        <ellipse cx={18} cy={-8} rx={5.5} ry={7 * blink} fill="#6B3E00" />
        <circle cx={-32} cy={10} r={8} fill="#FF8A65" opacity={0.45} />
        <circle cx={32} cy={10} r={8} fill="#FF8A65" opacity={0.45} />
        <path d="M-15 12 Q 0 26 15 12" stroke="#6B3E00" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- SOIL */

const SoilMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const potIn = sp(0);
  const layers = [
    { top: 298, bottom: 352, fill: "#9AA2A6", delay: 8, label: "drainage", kind: "pebble" },
    { top: 222, bottom: 300, fill: "#A3744B", delay: 30, label: "airy mix", kind: "perlite" },
    { top: 152, bottom: 224, fill: SOIL, delay: 52, label: "rich soil", kind: "speck" },
  ] as const;
  const sprout = sp(84, { damping: 9 });
  return (
    <g transform={`translate(0 ${(1 - potIn) * 60})`} opacity={potIn}>
      <defs>
        <clipPath id="soil-pot">
          <polygon points="76,-80 252,-80 252,112 236,350 92,350 76,112" />
        </clipPath>
      </defs>
      <g clipPath="url(#soil-pot)">
        {layers.map((l, i) => {
          const s = sp(l.delay, { damping: 12, stiffness: 110 });
          const dy = (1 - s) * -320;
          const items: React.ReactNode[] = [];
          const n = l.kind === "pebble" ? 16 : 26;
          for (let k = 0; k < n; k++) {
            const x = 80 + random(`${l.kind}x${k}`) * 170;
            const y = l.top + 8 + random(`${l.kind}y${k}`) * (l.bottom - l.top - 10);
            if (l.kind === "pebble") {
              items.push(
                <ellipse key={k} cx={x} cy={y} rx={8 + random(`pr${k}`) * 6} ry={6 + random(`pq${k}`) * 4} fill={shade("#8A9296", (random(`pc${k}`) - 0.5) * 0.4)} />,
              );
            } else if (l.kind === "perlite") {
              items.push(<circle key={k} cx={x} cy={y} r={2.5 + random(`lr${k}`) * 3} fill={k % 4 === 0 ? "#6B4426" : "#F4F1EA"} />);
            } else {
              items.push(<circle key={k} cx={x} cy={y} r={1.5 + random(`sr${k}`) * 2.5} fill={k % 3 === 0 ? "#7A5638" : "#2E1E12"} />);
            }
          }
          return (
            <g key={i} transform={`translate(0 ${dy})`}>
              <path
                d={`M60 ${l.bottom + 4} L60 ${l.top} C 110 ${l.top - 9} 180 ${l.top + 9} 270 ${l.top - 2} L270 ${l.bottom + 4} Z`}
                fill={l.fill}
              />
              {items}
            </g>
          );
        })}
      </g>
      {/* glass pot outline */}
      <polygon points="76,112 252,112 236,350 92,350" fill="#fff" opacity={0.12} />
      <path d="M76 112 L92 350 L236 350 L252 112" stroke={palette.pot} strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x={64} y={100} width={200} height={20} rx={10} fill={palette.pot} />
      <path d="M100 140 L110 320" stroke="#fff" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
      {layers.map((l, i) => {
        const o = ci(f, [l.delay + 12, l.delay + 22], [0, 1]);
        const y = (l.top + l.bottom) / 2;
        return (
          <g key={`lbl${i}`} opacity={o} transform={`translate(${(1 - o) * 16} 0)`}>
            <line x1={250 - ((y - 112) / 238) * 16} y1={y} x2={272} y2={y} stroke={palette.pot} strokeWidth={3} strokeDasharray="4 4" />
            <text x={278} y={y + 8} fontFamily={FONT} fontWeight={800} fontSize={23} fill={shade(palette.pot, -0.35)}>
              {l.label}
            </text>
          </g>
        );
      })}
      <g transform={`translate(164 ${150}) scale(${sprout})`}>
        <path d="M0 0 Q -4 -30 2 -52" stroke={shade(palette.leaf, -0.2)} strokeWidth={6} fill="none" strokeLinecap="round" />
        <g transform={`translate(2 -48) rotate(${-55 + Math.sin(f / 10) * 5}) scale(1.1)`}>
          <path d={LEAF_D} fill={palette.leaf} />
        </g>
        <g transform={`translate(2 -48) rotate(${50 + Math.sin(f / 10 + 1) * 5}) scale(0.9)`}>
          <path d={LEAF_D} fill={shade(palette.leaf, 0.1)} />
        </g>
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- HUMIDITY */

const HumidityMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const bottleIn = sp(0);
  const leafIn = sp(6, { damping: 11 });
  const bursts = [18, 46, 74, 102];
  const squeeze = bursts.reduce((acc, b) => acc + ci(f, [b - 4, b], [0, 1]) * ci(f, [b, b + 6], [1, 0]), 0);
  const particles: React.ReactNode[] = [];
  bursts.forEach((b, bi) => {
    for (let k = 0; k < 16; k++) {
      const age = f - b - random(`hd${bi}-${k}`) * 4;
      if (age < 0 || age > 42) continue;
      const t = age / 42;
      const ang = ((-38 + random(`ha${bi}-${k}`) * 70) * Math.PI) / 180;
      const dist = (130 + random(`hr${bi}-${k}`) * 150) * Easing.out(Easing.cubic)(t);
      particles.push(
        <circle
          key={`${bi}-${k}`}
          cx={134 + Math.cos(ang) * dist}
          cy={128 + Math.sin(ang) * dist - t * 20}
          r={(3 + random(`hs${bi}-${k}`) * 6) * (0.6 + t * 0.8)}
          fill="#8FD3F7"
          opacity={(1 - t) * 0.85}
        />,
      );
    }
  });
  const ambient = Array.from({ length: 12 }).map((_, i) => {
    const t = ((f * 0.6 + random(`am${i}`) * 120) % 120) / 120;
    return (
      <circle
        key={`a${i}`}
        cx={150 + random(`ax${i}`) * 240 + Math.sin(f / 15 + i) * 10}
        cy={380 - t * 340}
        r={10 + random(`ar${i}`) * 16}
        fill="#CDEBFB"
        opacity={Math.sin(t * Math.PI) * 0.45}
      />
    );
  });
  const beads = [
    [-6, -60, 0],
    [24, -110, 1],
    [-28, -130, 2],
    [10, -160, 3],
    [-40, -86, 4],
    [34, -66, 5],
    [-10, -190, 6],
  ];
  const sway = Math.sin(f / 18) * 3;
  return (
    <g>
      {ambient}
      <g transform={`translate(292 380) rotate(${sway})`}>
        <path d="M0 0 Q 10 -60 -6 -120" stroke={shade(palette.leaf, -0.25)} strokeWidth={8} fill="none" strokeLinecap="round" />
        <g transform={`translate(-6 -118) rotate(-18) scale(${leafIn})`}>
          <path d="M0 0 C -80 -30 -90 -170 0 -230 C 90 -170 80 -30 0 0 Z" fill={palette.leaf} />
          <path d="M0 -4 L0 -215" stroke={shade(palette.leaf, 0.2)} strokeWidth={4} />
          {[-1, 1].map((s) =>
            [50, 95, 140, 180].map((y) => (
              <path key={`${s}${y}`} d={`M0 ${-y} Q ${s * 30} ${-y - 10} ${s * 52} ${-y - 30}`} stroke={shade(palette.leaf, 0.15)} strokeWidth={3} fill="none" />
            )),
          )}
          {beads.map(([x, y, i]) => {
            const s = sp(34 + i * 10, { damping: 9 });
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <circle r={7 + (i % 3) * 2} fill="#E9F7FF" opacity={0.85} />
                <circle cx={-2.5} cy={-2.5} r={2.5} fill="#fff" />
              </g>
            );
          })}
        </g>
      </g>
      {particles}
      <g transform={`translate(${(1 - bottleIn) * -200} 0)`}>
        <rect x={38} y={176} width={78} height={170} rx={20} fill={palette.accent} />
        <rect x={50} y={220} width={54} height={70} rx={10} fill="#fff" opacity={0.85} />
        <Drop x={77} y={258} s={1.4} />
        <rect x={60} y={146} width={34} height={34} rx={6} fill={shade(palette.accent, -0.25)} />
        <path d="M46 112 L118 112 L126 128 L118 148 L46 148 Z" fill="#EEF2F3" stroke="#B9C4C9" strokeWidth={3} />
        <rect x={120} y={122} width={16} height={12} rx={3} fill="#B9C4C9" />
        <path
          d="M70 148 C 62 168 50 180 36 184"
          stroke="#EEF2F3"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(${squeeze * -18} 70 148)`}
        />
        <rect x={48} y={186} width={10} height={140} rx={5} fill="#fff" opacity={0.25} />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- FERTILIZE */

const FertilizeMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const bagIn = sp(0);
  const tilt = ci(f, [6, 22], [0, 40], Easing.out(Easing.back(1.6))) + (f > 22 && f < 100 ? Math.sin(f / 3) * 2 : 0);
  const potIn = sp(4);
  const growPulse = sp(70, { damping: 7, stiffness: 80 });
  const pelletColors = [palette.accent, "#7FB8E6", "#F7F3E8"];
  const pellets: React.ReactNode[] = [];
  for (let k = 0; k < 24; k++) {
    const spawn = 22 + k * 3;
    const age = f - spawn;
    if (age < 0) continue;
    const startX = 178 + random(`fx${k}`) * 10;
    const endX = 205 + random(`fe${k}`) * 90;
    const endY = 282 + random(`fy${k}`) * 8;
    const x = ci(age, [0, 20], [startX, endX]);
    const y = ci(age, [0, 20], [118, endY], Easing.bounce);
    pellets.push(
      <g key={k}>
        <circle cx={x} cy={y} r={6} fill={pelletColors[k % 3]} stroke={shade(pelletColors[k % 3], -0.3)} strokeWidth={1.5} />
        <circle cx={x - 2} cy={y - 2} r={1.8} fill="#fff" opacity={0.7} />
      </g>,
    );
  }
  const sparkles = [
    [180, 150, 0],
    [330, 170, 1],
    [300, 100, 2],
    [205, 95, 3],
  ].map(([x, y, i]) => {
    const s = ci(f, [85 + i * 6, 95 + i * 6], [0, 1]) * (0.7 + Math.sin(f / 4 + i) * 0.3);
    return <Sparkle key={i} x={x} y={y} r={16 * s} color="#FFC93C" rotate={f * 2} />;
  });
  return (
    <g>
      <g transform={`translate(0 ${(1 - potIn) * 120})`} opacity={potIn}>
        <MiniPlant
          x={250}
          y={282}
          w={170}
          palette={palette}
          grow={0.6 + growPulse * 0.42}
          leafBoost={growPulse * 0.1}
        >
          {pellets}
        </MiniPlant>
      </g>
      {sparkles}
      <g transform={`translate(${(1 - bagIn) * -220} 0) rotate(${tilt} 110 125)`}>
        <path d="M58 78 L162 78 L174 184 Q 112 200 46 184 Z" fill="#DDBB82" />
        <path d="M58 78 L162 78 L158 98 L62 98 Z" fill="#C49A5C" />
        <path d="M58 78 L70 62 L84 78 L98 62 L112 78 L126 62 L140 78 L154 62 L162 78" fill="#DDBB82" stroke="#C49A5C" strokeWidth={3} strokeLinejoin="round" />
        <rect x={74} y={112} width={76} height={56} rx={10} fill="#fff" opacity={0.92} />
        <text x={112} y={148} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill={shade(palette.accent, -0.2)}>
          NPK
        </text>
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- PRUNE */

const Blade: React.FC = () => (
  <g>
    <path d="M6 -7 L-122 -3 Q -132 2 -120 7 L6 9 Z" fill="#D5DEE3" stroke="#8C9AA2" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M10 -2 L36 -20" stroke="#4A5359" strokeWidth={8} strokeLinecap="round" />
  </g>
);

const PruneMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const plantIn = sp(0);
  const SNIP = 58;
  const approach = ci(f, [10, 40], [0, 1], Easing.out(Easing.cubic));
  const open =
    f < SNIP - 6
      ? 22 + Math.sin(f / 4) * 4
      : f < SNIP
        ? ci(f, [SNIP - 6, SNIP], [22, 0], Easing.in(Easing.quad))
        : ci(f, [SNIP + 8, SNIP + 20], [0, 18]);
  const leave = ci(f, [SNIP + 16, SNIP + 40], [0, 1], Easing.in(Easing.cubic));
  const fallT = Math.max(0, f - SNIP);
  const fallY = fallT * fallT * 0.09;
  const fallX = Math.sin(fallT / 5) * 18;
  const fallRot = fallT * 4;
  const fallOpacity = ci(fallT, [30, 50], [1, 0]);
  const cut = { x: 246, y: 186 };
  const burst = ci(f, [SNIP, SNIP + 12], [0, 1]);
  const leaf = palette.leaf;
  const sway = Math.sin(f / 16) * 2;
  const mainLeaves = [
    { x: 166, y: 302, a: -60, s: 1.5 },
    { x: 172, y: 240, a: 55, s: 1.6 },
    { x: 162, y: 160, a: -50, s: 1.7 },
    { x: 162, y: 96, a: 8, s: 1.6 },
  ];
  return (
    <g>
      <g transform={`translate(0 ${(1 - plantIn) * 100}) rotate(${sway} 170 360)`} opacity={plantIn}>
        <path d="M170 360 C 164 300 182 230 162 92" stroke={shade(leaf, -0.25)} strokeWidth={9} fill="none" strokeLinecap="round" />
        {/* remaining petiole stub */}
        <path d={`M174 222 Q 210 196 ${f < SNIP ? cut.x : cut.x - 14} ${f < SNIP ? cut.y : cut.y + 6}`} stroke={shade(leaf, -0.25)} strokeWidth={6} fill="none" strokeLinecap="round" />
        {mainLeaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a + Math.sin(f / 12 + i) * 4}) scale(${l.s})`}>
            <path d={LEAF_D} fill={shade(leaf, (i % 2) * 0.08)} />
            <path d="M0 -3 L0 -40" stroke={shade(leaf, 0.25)} strokeWidth={2} />
          </g>
        ))}
        {/* yellowing leaf that gets cut */}
        <g transform={`translate(${cut.x + (f >= SNIP ? fallX : 0)} ${cut.y + (f >= SNIP ? fallY : 0)}) rotate(${70 + (f >= SNIP ? fallRot : 0)})`} opacity={fallOpacity}>
          <path d="M0 0 L0 -10" stroke="#B49A3A" strokeWidth={5} />
          <g transform="translate(0 -8) scale(1.7)">
            <path d={LEAF_D} fill="#E3C653" />
            <path d="M0 -3 L0 -40" stroke="#B49A3A" strokeWidth={2} />
            <circle cx={-5} cy={-28} r={4} fill="#A9782F" opacity={0.6} />
            <circle cx={5} cy={-16} r={3} fill="#A9782F" opacity={0.6} />
          </g>
        </g>
      </g>
      {/* pot */}
      <path d="M112 354 L228 354 L216 400 L124 400 Z" fill={palette.pot} />
      <rect x={104} y={344} width={132} height={18} rx={8} fill={shade(palette.pot, 0.08)} />
      {/* snip burst */}
      {burst > 0 && burst < 1 &&
        [0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1={cut.x + Math.cos((a * Math.PI) / 180) * (14 + burst * 10)}
            y1={cut.y + Math.sin((a * Math.PI) / 180) * (14 + burst * 10)}
            x2={cut.x + Math.cos((a * Math.PI) / 180) * (24 + burst * 22)}
            y2={cut.y + Math.sin((a * Math.PI) / 180) * (24 + burst * 22)}
            stroke={palette.accent}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={1 - burst}
          />
        ))}
      {f >= SNIP && f < SNIP + 22 && (
        <text
          x={cut.x - 70}
          y={cut.y - 44}
          fontFamily={FONT}
          fontWeight={900}
          fontSize={34}
          fill={palette.accent}
          transform={`rotate(-12 ${cut.x - 70} ${cut.y - 44})`}
          opacity={ci(f, [SNIP + 14, SNIP + 22], [1, 0])}
        >
          snip!
        </text>
      )}
      {/* scissors */}
      <g transform={`translate(${cut.x + 74 + (1 - approach) * 200 + leave * 120} ${cut.y + leave * -40})`} opacity={Math.min(approach * 2, 1 - leave)}>
        <g transform={`rotate(${-open})`}>
          <Blade />
          <circle cx={46} cy={-28} r={17} fill="none" stroke={palette.accent} strokeWidth={10} />
        </g>
        <g transform={`rotate(${open}) scale(1 -1)`}>
          <Blade />
          <circle cx={46} cy={-28} r={17} fill="none" stroke={shade(palette.accent, -0.15)} strokeWidth={10} />
        </g>
        <circle r={6} fill="#4A5359" />
        <circle r={2.5} fill="#D5DEE3" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- REPOT */

const PotShape: React.FC<{ x: number; y: number; w: number; h: number; color: string }> = ({ x, y, w, h, color }) => (
  <g>
    <path d={`M${x - w / 2} ${y + 10} L${x + w / 2} ${y + 10} L${x + w * 0.38} ${y + h} L${x - w * 0.38} ${y + h} Z`} fill={color} />
    <rect x={x - w / 2 - 8} y={y - 4} width={w + 16} height={h * 0.2 + 6} rx={8} fill={shade(color, 0.08)} />
    <path d={`M${x - w * 0.3} ${y + h * 0.35} L${x - w * 0.26} ${y + h * 0.82}`} stroke="#fff" strokeOpacity={0.2} strokeWidth={8} strokeLinecap="round" />
  </g>
);

const RepotMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const intro = sp(0);
  const lift = ci(f, [26, 48], [0, 1], Easing.inOut(Easing.cubic));
  const swap = ci(f, [44, 66], [0, 1], Easing.inOut(Easing.cubic));
  const lower = sp(68, { damping: 12 });
  const grow = sp(92, { damping: 8, stiffness: 90 });
  const smallY = 292;
  const bigY = 236;
  // base of the plant (top of root ball)
  const baseY = smallY - lift * 140 + lower * (bigY + 8 - (smallY - 140));
  const baseX = 200;
  const wiggle = lift > 0 && lower < 0.5 ? Math.sin(f / 2.5) * 3 * (1 - swap * 0.5) : 0;
  const leaf = palette.leaf;
  const plantScale = 1 + grow * 0.25;
  const rootGrow = 1 + grow * 0.25;
  const sparkle = ci(f, [96, 106], [0, 1]) * ci(f, [118, 130], [1, 0]);
  return (
    <g opacity={intro}>
      {/* plant + root ball */}
      <g transform={`translate(${baseX} ${baseY}) rotate(${wiggle}) scale(${plantScale})`}>
        <g>
          {[-34, -12, 12, 34, -24, 22].map((a, i) => (
            <path key={i} d={`M${a * 0.6} 30 Q ${a * 0.9} ${50 + (i % 3) * 10} ${a * 1.1} ${62 * rootGrow + (i % 2) * 10}`} stroke="#C9A27A" strokeWidth={4} fill="none" strokeLinecap="round" />
          ))}
          <ellipse cx={0} cy={22} rx={44} ry={30} fill={SOIL} />
          <ellipse cx={-10} cy={14} rx={16} ry={6} fill="#7A5638" opacity={0.7} />
        </g>
        <path d="M0 0 L0 -90" stroke={shade(leaf, -0.25)} strokeWidth={7} strokeLinecap="round" />
        {[
          { a: -55, y: -40, s: 1.4 },
          { a: 55, y: -48, s: 1.4 },
          { a: -35, y: -78, s: 1.6 },
          { a: 35, y: -84, s: 1.6 },
          { a: 0, y: -90, s: 1.5 },
        ].map((l, i) => (
          <g key={i} transform={`translate(0 ${l.y}) rotate(${l.a + Math.sin(f / 10 + i) * 5}) scale(${l.s})`}>
            <path d={LEAF_D} fill={shade(leaf, (i % 2) * 0.08)} />
            <path d="M0 -3 L0 -40" stroke={shade(leaf, 0.25)} strokeWidth={2} />
          </g>
        ))}
      </g>
      {/* small pot slides away */}
      <g transform={`translate(${-swap * 170} 0)`} opacity={1 - swap}>
        <PotShape x={200} y={smallY} w={112} h={92} color={shade(palette.pot, 0.15)} />
      </g>
      {/* big pot slides in */}
      <g transform={`translate(${(1 - swap) * 170} 0)`} opacity={swap}>
        <ellipse cx={200} cy={bigY + 14} rx={90} ry={12} fill={SOIL} opacity={lower} />
        <PotShape x={200} y={bigY} w={196} h={150} color={palette.pot} />
      </g>
      {/* up arrow during lift */}
      <g opacity={ci(f, [26, 32], [0, 1]) * ci(f, [56, 64], [1, 0])} transform={`translate(330 ${210 - lift * 30})`}>
        <path d="M0 40 L0 -10 M-16 6 L0 -12 L16 6" stroke={palette.accent} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Sparkle x={100} y={170} r={18 * sparkle} color="#FFC93C" rotate={f * 3} />
      <Sparkle x={310} y={140} r={14 * sparkle} color="#FFC93C" rotate={-f * 3} />
      <Sparkle x={290} y={60} r={10 * sparkle} color={palette.accent} rotate={f * 3} />
    </g>
  );
};

/* ---------------------------------------------------------------- PESTS */

const Bug: React.FC<{ t: number }> = ({ t }) => {
  const leg = Math.sin(t * 1.2) * 12;
  return (
    <g>
      {[-1, 1].map((side) =>
        [-12, 0, 12].map((y, i) => (
          <line
            key={`${side}${y}`}
            x1={side * 14}
            y1={y}
            x2={side * 32}
            y2={y + (i - 1) * 8 + (i % 2 === 0 ? leg : -leg) * side * 0.5}
            stroke="#3A1E16"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )),
      )}
      <path d="M-6 -30 Q -14 -48 -22 -50 M6 -30 Q 14 -48 22 -50" stroke="#3A1E16" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-26} r={12} fill="#3A1E16" />
      <ellipse cx={0} cy={4} rx={22} ry={26} fill="#C8432B" />
      <path d="M0 -20 L0 30" stroke="#3A1E16" strokeWidth={3} />
      <circle cx={-10} cy={-4} r={5} fill="#3A1E16" />
      <circle cx={11} cy={6} r={5} fill="#3A1E16" />
      <circle cx={-8} cy={16} r={4} fill="#3A1E16" />
      <circle cx={-5} cy={-28} r={3.5} fill="#fff" />
      <circle cx={5} cy={-28} r={3.5} fill="#fff" />
      <circle cx={-5} cy={-27} r={1.6} fill="#000" />
      <circle cx={5} cy={-27} r={1.6} fill="#000" />
      <ellipse cx={-8} cy={-6} rx={6} ry={3} fill="#fff" opacity={0.3} />
    </g>
  );
};

const PestsMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const leafIn = sp(0);
  const walk = ci(f, [8, 46], [0, 1], Easing.inOut(Easing.quad));
  const bugX = 120 + walk * 90;
  const bugY = 270 - walk * 70;
  const ban = ci(f, [48, 62], [0, 1], Easing.out(Easing.cubic));
  const shake = f > 50 && f < 70 ? Math.sin(f * 2.2) * 4 : 0;
  const wipe = ci(f, [72, 96], [0, 1], Easing.inOut(Easing.quad));
  const bugGone = ci(f, [80, 92], [1, 0]);
  const clean = ci(f, [98, 110], [0, 1]);
  const banOpacity = ci(f, [74, 86], [1, 0]);
  return (
    <g>
      <g transform={`translate(200 360) rotate(-28) scale(${leafIn})`}>
        <path d="M0 0 L0 -40" stroke={shade(palette.leaf, -0.25)} strokeWidth={9} strokeLinecap="round" />
        <path d="M0 -30 C -130 -60 -130 -260 0 -340 C 130 -260 130 -60 0 -30 Z" fill={palette.leaf} />
        <path d="M0 -34 L0 -320" stroke={shade(palette.leaf, 0.2)} strokeWidth={5} />
        {[90, 150, 210, 260].map((y) =>
          [-1, 1].map((s) => (
            <path key={`${y}${s}`} d={`M0 ${-y} Q ${s * 40} ${-y - 16} ${s * 74} ${-y - 44}`} stroke={shade(palette.leaf, 0.15)} strokeWidth={3.5} fill="none" />
          )),
        )}
        {/* little bite marks / spots that get wiped */}
        {[
          [-40, -140],
          [30, -200],
          [-20, -250],
          [44, -120],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7} fill="#C9B458" opacity={0.8 * (1 - clean)} />
        ))}
      </g>
      <g transform={`translate(${bugX + shake} ${bugY}) rotate(${50 - walk * 10}) scale(${0.95 * bugGone + 0.001})`} opacity={bugGone}>
        <Bug t={f} />
      </g>
      {/* ban symbol */}
      <g transform={`translate(${210} ${200})`} opacity={banOpacity}>
        <circle r={62} fill="none" stroke="#E5484D" strokeWidth={13} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ban} transform="rotate(-90)" />
        <line x1={-44} y1={-44} x2={-44 + 88 * ci(f, [56, 66], [0, 1])} y2={-44 + 88 * ci(f, [56, 66], [0, 1])} stroke="#E5484D" strokeWidth={13} strokeLinecap="round" />
      </g>
      {/* wiping cloth */}
      {wipe > 0 && wipe < 1 && (
        <g transform={`translate(${60 + wipe * 280} ${300 - wipe * 210}) rotate(-20)`}>
          <rect x={-46} y={-30} width={92} height={60} rx={16} fill={palette.accent} />
          <path d="M-30 -12 L30 -12 M-30 4 L30 4" stroke="#fff" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={-60 - i * 18} cy={20 + i * 6} r={5 - i} fill="#E9F7FF" opacity={0.8 - i * 0.2} />
          ))}
        </g>
      )}
      {[
        [150, 170, 0],
        [270, 120, 1],
        [235, 260, 2],
      ].map(([x, y, i]) => (
        <Sparkle key={i} x={x} y={y} r={(14 + i * 4) * clean * (0.8 + Math.sin(f / 4 + i) * 0.2)} color="#FFFFFF" rotate={f * 2} />
      ))}
      <g opacity={clean} transform={`translate(330 330) scale(${sp(100, { damping: 9 })})`}>
        <circle r={34} fill="#2FA36B" />
        <path d="M-15 0 L-4 12 L16 -12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- TEMPERATURE */

const TemperatureMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const tubeIn = sp(0);
  const fill = sp(14, { damping: 7, stiffness: 50 });
  const top = 60;
  const bottom = 300;
  const zone = { from: 0.48, to: 0.72 };
  const level = Math.min(1.05, 0.08 + fill * 0.52) + Math.sin(f / 8) * 0.008;
  const levelY = bottom - (bottom - top) * level;
  const inZone = level >= zone.from && level <= zone.to;
  const zoneGlow = inZone ? ci(f, [40, 55], [0, 1]) : 0;
  const mercury = "#E8543F";
  const check = sp(58, { damping: 9 });
  return (
    <g>
      {/* snowflake (cold) */}
      <g transform={`translate(88 300) rotate(${f * 1.2}) scale(${sp(10)})`} opacity={0.9}>
        {[0, 60, 120].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1={0} y1={-34} x2={0} y2={34} stroke="#7FC4EC" strokeWidth={7} strokeLinecap="round" />
            <path d="M-10 -26 L0 -16 L10 -26 M-10 26 L0 16 L10 26" stroke="#7FC4EC" strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* heat (sun) */}
      <g transform={`translate(312 90) scale(${sp(18)})`}>
        <g transform={`rotate(${-f * 1.5})`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={-4} y={-48} width={8} height={16} rx={4} fill="#FFB627" transform={`rotate(${i * 45})`} />
          ))}
        </g>
        <circle r={26} fill="#FFCB3C" />
      </g>
      <g transform={`translate(0 ${(1 - tubeIn) * 80})`} opacity={tubeIn}>
        {/* comfort zone band */}
        <rect
          x={238}
          y={bottom - (bottom - top) * zone.to}
          width={22 + zoneGlow * 8}
          height={(bottom - top) * (zone.to - zone.from)}
          rx={8}
          fill="#3DBE7A"
          opacity={0.35 + zoneGlow * 0.5}
        />
        {/* tube */}
        <rect x={168} y={top - 30} width={64} height={bottom - top + 60} rx={32} fill="#FFFFFF" stroke={shade(palette.pot, -0.1)} strokeWidth={6} />
        <circle cx={200} cy={bottom + 46} r={50} fill="#FFFFFF" stroke={shade(palette.pot, -0.1)} strokeWidth={6} />
        <rect x={171} y={bottom} width={58} height={20} fill="#FFFFFF" />
        {/* mercury */}
        <rect x={186} y={levelY} width={28} height={bottom - levelY + 30} rx={14} fill={mercury} />
        <circle cx={200} cy={bottom + 46} r={36} fill={mercury} />
        <ellipse cx={188} cy={bottom + 34} rx={9} ry={12} fill="#fff" opacity={0.4} />
        <rect x={180} y={top - 10} width={7} height={bottom - top} rx={3.5} fill="#fff" opacity={0.6} />
        {/* ticks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const y = bottom - ((bottom - top) * i) / 8;
          return <line key={i} x1={i % 2 ? 150 : 140} y1={y} x2={164} y2={y} stroke={shade(palette.pot, -0.2)} strokeWidth={4} strokeLinecap="round" />;
        })}
      </g>
      <g transform={`translate(300 ${bottom - (bottom - top) * ((zone.from + zone.to) / 2)}) scale(${check * zoneGlow})`}>
        <circle r={28} fill="#2FA36B" />
        <path d="M-12 0 L-3 10 L13 -10" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- PROPAGATE */

const PropagateMotif: React.FC<{ palette: Palette }> = ({ palette }) => {
  const f = useCurrentFrame();
  const sp = useSpring();
  const glassIn = sp(0);
  const cuttingIn = sp(10, { damping: 12 });
  const waterTop = 196;
  const wave = (x: number) => Math.sin(x / 22 + f / 6) * 4;
  let wavePath = `M122 ${waterTop + wave(122)}`;
  for (let x = 130; x <= 278; x += 8) wavePath += ` L${x} ${waterTop + wave(x)}`;
  wavePath += ` L262 372 L138 372 Z`;
  const node = { x: 204, y: 284 };
  const roots = [
    { d: `M${node.x} ${node.y} C 190 310 170 330 160 356`, delay: 30 },
    { d: `M${node.x} ${node.y} C 210 316 206 336 214 362`, delay: 40 },
    { d: `M${node.x} ${node.y} C 226 300 244 322 240 350`, delay: 52 },
    { d: `M${node.x} ${node.y} C 196 300 182 306 172 320`, delay: 64 },
    { d: `M${node.x} ${node.y} C 222 296 238 300 248 312`, delay: 72 },
  ];
  const newLeaf = sp(92, { damping: 9 });
  const bubbles = Array.from({ length: 9 }).map((_, i) => {
    const period = 50 + random(`bp${i}`) * 30;
    const t = ((f + random(`bo${i}`) * period) % period) / period;
    const x = 145 + random(`bx${i}`) * 110 + Math.sin(f / 8 + i) * 4;
    const y = 360 - t * (360 - waterTop - 8);
    return <circle key={i} cx={x} cy={y} r={3 + random(`br${i}`) * 4} fill="none" stroke="#fff" strokeWidth={2} opacity={0.8 * Math.sin(t * Math.PI)} />;
  });
  const sway = Math.sin(f / 18) * 2;
  return (
    <g transform={`translate(0 ${(1 - glassIn) * 80})`} opacity={glassIn}>
      <defs>
        <clipPath id="prop-glass">
          <path d="M118 140 L282 140 L264 372 Q 262 380 254 380 L146 380 Q 138 380 136 372 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#prop-glass)">
        <path d={wavePath} fill="#9FD8F5" opacity={0.75} />
        {bubbles}
      </g>
      {/* cutting */}
      <g transform={`translate(0 ${(1 - cuttingIn) * -140}) rotate(${sway} 200 140)`} opacity={cuttingIn}>
        <path d={`M196 60 C 200 120 194 200 ${node.x} ${node.y}`} stroke={shade(palette.leaf, -0.25)} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={node.x} cy={node.y} r={6} fill={shade(palette.leaf, -0.3)} />
        {roots.map((r, i) => {
          const g = ci(f, [r.delay, r.delay + 40], [0, 1], Easing.out(Easing.quad));
          return <path key={i} d={r.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} stroke="#F2E6CF" strokeWidth={5 - i * 0.5} fill="none" strokeLinecap="round" />;
        })}
        {[
          { x: 197, y: 92, a: -62, s: 2.0 },
          { x: 197, y: 70, a: 48, s: 2.2 },
        ].map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a + Math.sin(f / 12 + i) * 4}) scale(${l.s})`}>
            <path d={LEAF_D} fill={shade(palette.leaf, i * 0.08)} />
            <path d="M0 -3 L0 -40" stroke={shade(palette.leaf, 0.25)} strokeWidth={2} />
          </g>
        ))}
        <g transform={`translate(196 62) rotate(${-8 + Math.sin(f / 10) * 4}) scale(${newLeaf * 1.1})`}>
          <path d={LEAF_D} fill={shade(palette.leaf, 0.22)} />
        </g>
      </g>
      {/* glass */}
      <path d="M118 140 L282 140 L264 372 Q 262 380 254 380 L146 380 Q 138 380 136 372 Z" fill="#ffffff" opacity={0.18} />
      <path d="M118 140 L136 372 Q 138 380 146 380 L254 380 Q 262 380 264 372 L282 140" stroke="#CFEAF6" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={200} cy={140} rx={82} ry={8} fill="none" stroke="#CFEAF6" strokeWidth={5} />
      <path d="M138 170 L150 350" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
      <Sparkle x={300} y={250} r={14 * ci(f, [100, 110], [0, 1])} color="#FFC93C" rotate={f * 3} />
      <Sparkle x={100} y={210} r={10 * ci(f, [104, 114], [0, 1])} color="#FFC93C" rotate={-f * 3} />
    </g>
  );
};

/* ---------------------------------------------------------------- export */

const MOTIFS: Record<StepKind, React.FC<{ palette: Palette }>> = {
  water: WaterMotif,
  light: LightMotif,
  soil: SoilMotif,
  humidity: HumidityMotif,
  fertilize: FertilizeMotif,
  prune: PruneMotif,
  repot: RepotMotif,
  pests: PestsMotif,
  temperature: TemperatureMotif,
  propagate: PropagateMotif,
};

export const STEP_LABELS: Record<StepKind, string> = {
  water: "Watering",
  light: "Light",
  soil: "Soil",
  humidity: "Humidity",
  fertilize: "Feeding",
  prune: "Pruning",
  repot: "Repotting",
  pests: "Pests",
  temperature: "Temperature",
  propagate: "Propagation",
};

export type StepMotifProps = {
  kind: StepKind;
  palette: Palette;
  /** Rendered size in px (square). */
  size?: number;
  style?: React.CSSProperties;
};

/** Animated SVG motif for a care step. Animation is driven by the parent Sequence's frame. */
export const StepMotif: React.FC<StepMotifProps> = ({ kind, palette, size = 560, style }) => {
  const Motif = MOTIFS[kind] ?? WaterMotif;
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ overflow: "visible", ...style }}>
      <Motif palette={palette} />
    </svg>
  );
};
