import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Per-gift-category colourway. Mum/Mom = blush pink (per "The Nesta Petit" reference).
const COLORWAYS: Record<string, { base: string; blob: string; brand: string }> = {
  mom: { base: "#f7dcdb", blob: "#e9a8a8", brand: "#8c6e58" },
  mum: { base: "#f7dcdb", blob: "#e9a8a8", brand: "#8c6e58" },
  baby: { base: "#d7e7f1", blob: "#a8c6dc", brand: "#5f7d92" },
  complete: { base: "#e2eadd", blob: "#bcd0b1", brand: "#6d8060" },
  "complete-set": { base: "#e2eadd", blob: "#bcd0b1", brand: "#6d8060" },
};
const DEFAULT = COLORWAYS.mom;

// Per-size scale so a bigger box visibly reads bigger in the viewport.
const SIZE_SCALE: Record<string, number> = {
  small: 0.82,
  medium: 1.0,
  large: 1.18,
};

// ---- canvas texture helpers (no external assets needed) ----
function blobField(ctx: CanvasRenderingContext2D, color: string, seed: number) {
  ctx.fillStyle = color;
  const rnd = (n: number) => Math.abs(Math.sin(seed * 9.13 + n * 2.7)) ;
  for (let i = 0; i < 5; i++) {
    const cx = rnd(i) * 512;
    const cy = rnd(i + 0.5) * 512;
    const r = 70 + rnd(i + 1) * 90;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 6) {
      const rr = r * (0.75 + rnd(i + a) * 0.4);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      a === 0 ? ctx.moveTo(x, y) : ctx.quadraticCurveTo(cx, cy, x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function panelTexture(opts: {
  base: string; blob: string; brand: string; seed: number;
  title?: string; subtitle?: string; italicTop?: string;
}): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = opts.base; ctx.fillRect(0, 0, 512, 512);
  blobField(ctx, opts.blob, opts.seed);
  ctx.fillStyle = opts.brand;
  ctx.textAlign = "center";
  if (opts.italicTop) {
    ctx.font = "italic 44px Georgia, serif";
    ctx.fillText(opts.italicTop, 256, 250);
  }
  if (opts.title) {
    ctx.font = "700 64px Arial, sans-serif";
    ctx.fillText(opts.title, 256, opts.subtitle ? 280 : 300);
  }
  if (opts.subtitle) {
    ctx.font = "600 26px Arial, sans-serif";
    ctx.fillText(opts.subtitle, 256, 330);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

function labelTexture(name: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f3ead9"; ctx.fillRect(0, 0, 256, 320); // cream tissue
  ctx.strokeStyle = "#d8c9ad"; ctx.lineWidth = 6; ctx.strokeRect(6, 6, 244, 308);
  ctx.fillStyle = "#8c6e58";
  ctx.textAlign = "center";
  ctx.font = "700 22px Arial, sans-serif";
  const words = name.split(" ");
  let line = "", y = 150;
  const lines: string[] = [];
  for (const w of words) {
    if ((line + w).length > 14) { lines.push(line.trim()); line = w + " "; }
    else line += w + " ";
  }
  lines.push(line.trim());
  y = 160 - (lines.length - 1) * 16;
  lines.slice(0, 4).forEach((l) => { ctx.fillText(l, 128, y); y += 32; });
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

interface GiftBox3DProps {
  categorySlug?: string;
  sizeSlug?: string;
  items?: { name: string; imageUrl?: string }[];
}

// A single rounded product box. Wraps the product image as its texture; if there's
// no image (or it fails to load — e.g. CORS), it falls back to a label of the full name.
function ContentBox({
  name,
  imageUrl,
  args,
  radius,
  position,
  rotation,
}: {
  name: string;
  imageUrl?: string;
  args: [number, number, number];
  radius: number;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const [tex, setTex] = useState<THREE.Texture>(() => labelTexture(name));
  useEffect(() => {
    if (!imageUrl) {
      setTex(labelTexture(name));
      return;
    }
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      imageUrl,
      (t) => {
        if (active) setTex(t);
      },
      undefined,
      () => {
        if (active) setTex(labelTexture(name)); // blocked/404 → show the full name instead
      },
    );
    return () => {
      active = false;
    };
  }, [imageUrl, name]);

  return (
    <RoundedBox args={args} radius={radius} smoothness={4} position={position} rotation={rotation}>
      <meshStandardMaterial map={tex} color="#ffffff" roughness={0.8} />
    </RoundedBox>
  );
}

function Box({ categorySlug, sizeSlug, items = [] }: GiftBox3DProps) {
  const colors = (categorySlug && COLORWAYS[categorySlug]) || DEFAULT;
  const scale = (sizeSlug && SIZE_SCALE[sizeSlug]) || 1;
  const lidRef = useRef<THREE.Group>(null);
  // Box opens by default (lifts the lid to reveal contents); tap/click toggles it.
  const [open, setOpen] = useState(true);

  const { wall, lidTop, frontFace } = useMemo(() => ({
    wall: panelTexture({ ...colors, seed: 1 }),
    lidTop: panelTexture({ ...colors, seed: 2, title: "nesta", subtitle: "every stage of motherhood" }),
    frontFace: panelTexture({ ...colors, seed: 3, italicTop: "flip me over for", title: "FUN" }),
  }), [colors]);

  const contents = items.slice(0, 9);
  // Pack contents into a grid that fills the box footprint, so the box never looks scanty:
  // few items => fewer, larger boxes; more items => a denser grid. Always fills the space.
  const count = contents.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = 1.5 / cols;
  const cellD = 1.5 / rows;
  const itemW = cellW * 0.84;
  const itemD = cellD * 0.84;

  // Open: the lid flies up and out of view entirely. Closed: it settles back on the box.
  useFrame(() => {
    if (!lidRef.current) return;
    const l = lidRef.current;
    const targetY = open ? 9 : 1.55;
    const targetZ = open ? -2 : 0;
    const targetTilt = open ? 0.7 : 0.06;
    l.position.y += (targetY - l.position.y) * 0.1;
    l.position.z += (targetZ - l.position.z) * 0.1;
    l.rotation.z += (targetTilt - l.rotation.z) * 0.1;
  });

  const innerColor = new THREE.Color(colors.base).lerp(new THREE.Color("#ffffff"), 0.5).getStyle();

  return (
    <group
      position={[0, -0.6, 0]}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* Open base: bottom + 4 walls */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2, 0.16, 2]} />
        <meshStandardMaterial color={colors.base} roughness={0.9} />
      </mesh>
      {/* front wall carries the "flip me over for FUN" panel */}
      <mesh position={[0, 0.6, 1.0]}>
        <boxGeometry args={[2, 1.05, 0.1]} />
        <meshStandardMaterial map={frontFace} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, -1.0]}>
        <boxGeometry args={[2, 1.05, 0.1]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[-1.0, 0.6, 0]}>
        <boxGeometry args={[0.1, 1.05, 2]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[1.0, 0.6, 0]}>
        <boxGeometry args={[0.1, 1.05, 2]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      {/* inner liner so the open interior reads as cream tissue */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.8, 0.95, 1.8]} />
        <meshStandardMaterial color={innerColor} roughness={1} side={THREE.BackSide} />
      </mesh>

      {/* Contents packed into a grid that fills the box footprint — image-wrapped rounded boxes */}
      {contents.map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * cellW;
        const z = (row - (rows - 1) / 2) * cellD;
        const h = 0.72 + (i % 2 === 0 ? 0.06 : -0.04); // slight height variation for a packed look
        return (
          <ContentBox
            key={i}
            name={item.name}
            imageUrl={item.imageUrl}
            args={[itemW, h, itemD]}
            radius={Math.min(itemW, itemD) * 0.16}
            position={[x, 0.16 + h / 2, z]}
            rotation={[0, i % 2 === 0 ? 0.06 : -0.06, 0]}
          />
        );
      })}

      {/* Lift-off lid */}
      <group ref={lidRef} position={[0, 1.55, 0]}>
        <mesh>
          <boxGeometry args={[2.18, 0.42, 2.18]} />
          <meshStandardMaterial map={lidTop} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

export function GiftBox3D({ categorySlug, sizeSlug, items }: GiftBox3DProps) {
  return (
    <Canvas camera={{ position: [3.2, 2.6, 3.6], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} />
      <Box categorySlug={categorySlug} sizeSlug={sizeSlug} items={items} />
      <ContactShadows position={[0, -0.62, 0]} opacity={0.35} scale={6} blur={2.4} far={3} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={7.5}
        target={[0, 0.2, 0]}
        minPolarAngle={0.3}
        maxPolarAngle={1.45}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}

export default GiftBox3D;
