
import React, { useState, useEffect, useRef } from 'react';
import {
  Check, ChevronDown, Image as ImageIcon, LogOut, Moon, Sun,
  Sparkles, UploadCloud, XCircle, Sofa, PaintRoller
} from 'lucide-react';
import { generateInteriorDesign } from '../geminiService';

// --- STYLES & ANIMATIONS ---
const styles = `
  .font-cairo {
    font-family: "Cairo", system-ui, -apple-system, sans-serif;
  }
  .glass {
    background-color: rgba(var(--surface-rgb), 0.55);
    backdrop-filter: blur(12px);
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-scale-in { animation: scale-in 0.2s ease-out both; }

  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { animation: fade-in-up 0.35s ease-out both; }

  .bg-orbs {
    position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .orb {
    position: absolute; border-radius: 9999px; filter: blur(18px);
    opacity: 0.32; transform-origin: center;
    animation: floaty 22s ease-in-out infinite;
  }
  .orb--1 {
    width: 420px; height: 420px; left: -120px; top: -80px;
    background: radial-gradient(circle at 30% 30%, var(--modern-sky), transparent 60%);
    animation-duration: 28s;
  }
  .orb--2 {
    width: 320px; height: 320px; right: -120px; top: 20%;
    background: radial-gradient(circle at 70% 40%, var(--modern-indigo), transparent 55%);
    animation-duration: 24s; animation-delay: -5s;
  }
  .orb--3 {
    width: 520px; height: 520px; left: 12%; bottom: -220px;
    background: radial-gradient(circle at 40% 60%, var(--modern-teal), transparent 65%);
    animation-duration: 30s; animation-delay: -11s;
  }
  .orb--4 {
    width: 380px; height: 380px; right: 8%; bottom: -160px;
    background: radial-gradient(circle at 50% 50%, var(--modern-rose), transparent 60%);
    animation-duration: 26s; animation-delay: -7s;
  }
  @keyframes floaty {
    0% { transform: translate3d(0,0,0) scale(1); }
    50% { transform: translate3d(0,-20px,0) scale(1.04) rotate(1deg); }
    100% { transform: translate3d(0,0,0) scale(1); }
  }
  .btn-gradient {
    background-image: linear-gradient(90deg, var(--modern-teal), var(--modern-indigo));
    color: white;
  }
  .btn-gradient:hover { filter: brightness(1.05); }
  .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(var(--border-rgb), 0.25); border-radius: 999px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.25); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
`;

// --- UTILS ---
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] || "";
      resolve({ data: base64, mimeType: file.type });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

const cls = (...xs: (string | boolean | undefined | null)[]) => xs.filter(Boolean).join(" ");

// --- COMPONENTS ---

const Pill = ({ active, children, onClick, disabled }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cls(
      "px-3 py-1.5 text-sm rounded-full border transition-all",
      active
        ? "text-white border-transparent btn-gradient"
        : "text-[var(--text-strong)] border-[rgba(var(--border-rgb),0.6)] bg-white/40 hover:bg-white/60",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

const Swatch = ({ label, color, active, onClick, disabled }: any) => (
  <button
    type="button"
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={cls(
      "w-10 h-10 rounded-full border transition relative",
      "border-[rgba(var(--border-rgb),0.7)] hover:scale-105 active:scale-95",
      active && "ring-2 ring-white/80"
    )}
    style={{ background: color }}
  >
    {active && (
      <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
    )}
  </button>
);

const SectionTitle = ({ children }: any) => (
  <h3 className="text-sm font-bold text-[var(--text-strong)] mb-2 tracking-wide">
    {children}
  </h3>
);

const LoadingSpinner = ({ minimal }: { minimal?: boolean }) =>
  minimal ? (
    <div className="flex items-center justify-center gap-1">
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: "-0.2s" }} />
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: "-0.1s" }} />
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
    </div>
  ) : (
    <div className="flex items-center justify-center gap-2">
      <span className="w-3 h-3 rounded-full bg-white/90 animate-ping" />
      <span className="w-3 h-3 rounded-full bg-white/90 animate-ping" style={{ animationDelay: "0.1s" }} />
      <span className="w-3 h-3 rounded-full bg-white/90 animate-ping" style={{ animationDelay: "0.2s" }} />
    </div>
  );

const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Makeover preview" className="max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white/90 rounded-full p-1.5 hover:scale-105 active:scale-95 transition"
          aria-label="Close"
          title="Close"
        >
          <XCircle className="w-8 h-8 text-[var(--text-strong)]" />
        </button>
      </div>
    </div>
  );
};

const EditedImageCard = ({ original, result, onZoom }: any) => {
  // Safely check if newImage exists before creating URL
  const hasImage = result?.newImage?.data && result?.newImage?.mimeType;
  const editedUrl = hasImage
    ? `data:${result.newImage.mimeType};base64,${result.newImage.data}`
    : null;

  return (
    <div className="glass border border-[rgba(var(--border-rgb),0.6)] rounded-2xl p-6 shadow-xl animate-fade-in-up">
      <h2 className="text-xl font-black mb-5 text-[var(--text-strong)]">AI Design Recommendations</h2>

      {hasImage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2 text-[var(--text-strong)]">Original</h3>
            <img
              src={original}
              alt="Original room"
              className="w-full rounded-xl border border-[rgba(var(--border-rgb),0.6)] object-cover cursor-zoom-in"
              onClick={() => onZoom(original)}
            />
          </div>
          <div>
            <h3 className="font-bold mb-2 text-[var(--text-strong)]">Edited (Makeover)</h3>
            <img
              src={editedUrl!}
              alt="Edited room"
              className="w-full rounded-xl border border-[rgba(var(--border-rgb),0.6)] object-contain bg-white/40 cursor-zoom-in"
              onClick={() => onZoom(editedUrl)}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2 text-[var(--text-strong)]">Your Room</h3>
            <img
              src={original}
              alt="Original room"
              className="w-full rounded-xl border border-[rgba(var(--border-rgb),0.6)] object-cover cursor-zoom-in"
              onClick={() => onZoom(original)}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="bg-gradient-to-br from-indigo-500/10 to-teal-500/10 border border-indigo-500/20 rounded-xl p-6">
              <h3 className="font-bold mb-3 text-[var(--text-strong)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Design Vision Generated
              </h3>
              <p className="text-sm text-[var(--text-soft)] italic">
                AI image generation requires a specialized model. Below are your personalized design recommendations.
              </p>
            </div>
          </div>
        </div>
      )}

      {result?.responseText && (
        <div className="mt-5 border-t border-[rgba(var(--border-rgb),0.5)] pt-4">
          <h4 className="font-bold mb-3 text-[var(--text-strong)]">Design Recommendations</h4>
          <div className="prose prose-sm max-w-none text-[var(--text-soft)] whitespace-pre-wrap">
            {result.responseText}
          </div>
        </div>
      )}
    </div>
  );
};

const UploadImage = ({ preview, onAdd, onRemove, disabled }: any) => {
  const [state, setState] = useState("idle");
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setState("loading");
    if (f.size > 10 * 1024 * 1024) {
      alert("The image '" + f.name + "' is too large. Please choose an image under 10MB.");
      setState("idle");
      e.target.value = "";
      return;
    }
    try {
      const data = await fileToBase64(f);
      onAdd(f, data);
    } catch {
      alert("A problem occurred while preparing the image.");
    } finally {
      setState("idle");
      e.target.value = "";
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setState("loading");
    if (f.size > 10 * 1024 * 1024) {
      alert("The image '" + f.name + "' is too large. Please choose an image under 10MB.");
      setState("idle");
      return;
    }
    try {
      const data = await fileToBase64(f);
      onAdd(f, data);
    } catch {
      alert("A problem occurred while preparing the image.");
    } finally {
      setState("idle");
    }
  };

  return (
    <div>
      <SectionTitle>0) Upload Room Image</SectionTitle>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-40 h-40 object-cover rounded-xl border border-[rgba(var(--border-rgb),0.7)]"
          />
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="absolute -top-3 -right-3 bg-white/90 rounded-full p-1.5 shadow hover:scale-105 active:scale-95 transition"
            title="Remove image"
            aria-label="Remove image"
          >
            <XCircle className="w-6 h-6 text-[var(--text-strong)]" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); !disabled && setState("over"); }}
          onDragLeave={(e) => { e.preventDefault(); setState("idle"); }}
          onDrop={onDrop}
          className={cls(
            "flex items-center justify-center w-full h-28 rounded-xl border-2 border-dashed transition cursor-pointer glass",
            state === "over" ? "border-white/80" : "border-[rgba(var(--border-rgb),0.7)]"
          )}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onChange}
            disabled={disabled}
          />
          {state === "loading" ? (
            <LoadingSpinner minimal />
          ) : (
            <div className="text-sm flex items-center gap-2 text-[var(--text-strong)]">
              <ImageIcon className="w-5 h-5" />
              <span>Click or drag a room image here</span>
            </div>
          )}
        </label>
      )}
    </div>
  );
};

// --- LOGIC HELPERS ---
const paletteMap: Record<string, string> = {
  "Teal/Indigo": "a refined teal-to-indigo palette for headings, accents, and CTA",
  "Sky/Indigo": "a calm sky-to-indigo palette with modern contrast",
  "Indigo/Amber": "a premium indigo-to-amber palette with warm accents",
  "Teal/Rose": "a fresh teal-to-rose palette with contemporary energy",
  "Sky/Amber": "a friendly sky-to-amber palette for approachable spaces",
};

function buildInteriorPrompt({
  roomType,
  furnitureStyle,
  wallColor,
  flooring,
  curtains,
  decorList,
  paletteDesc,
  titleText,
  taglineText,
  ctaText,
}: any) {
  return `
You are a senior interior CGI artist and staging designer.
Take the provided room photo and generate a photorealistic "after" makeover render at high resolution.
Tasks:
1) Swap furniture to the "${furnitureStyle}" style appropriate for a "${roomType}".
2) Change wall color to "${wallColor}" with even, realistic paint finish and proper shadows.
3) Update flooring to "${flooring}" and add matching baseboards as needed.
4) Curtains: "${curtains}" with natural folds and light behavior.
5) Add decorative items: ${decorList && decorList.length ? decorList.join(", ") : "no additional decor"} in a tasteful layout.
6) Preserve perspective, windows, and architectural features; keep scale and lighting realistic.

Color & Brand: Use "${paletteDesc}" for subtle accents (pillows, throws, art hues, UI labels if any).
Typography overlays (optional): Title "${titleText || ""}", Tagline "${taglineText || ""}", CTA button text "${ctaText || "Save Design"}" — keep overlays minimal and tasteful, with crisp edges and light shadow.

Overall: ultra-clean, magazine-quality render with balanced contrast, soft natural light, accurate materials (PBR-like), tidy space, no artifacts.
`;
}

// --- MAIN COMPONENT ---
interface InteriorDesignerProps {
  userProfile?: any; // Pass user profile to check usage
  onIncrementUsage?: () => void; // Callback to update usage in parent state if needed
}

const InteriorDesigner: React.FC<InteriorDesignerProps> = ({ userProfile, onIncrementUsage }) => {
  // Theme state for inner logic
  const [theme, setTheme] = useState("light");

  // Images
  const [images, setImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Interior selections
  const [roomType, setRoomType] = useState("Living Room");
  const [furnitureStyle, setFurnitureStyle] = useState("Modern");
  const [wallColor, setWallColor] = useState("Warm White");
  const [customColor, setCustomColor] = useState("");
  const [flooring, setFlooring] = useState("Light Wood");
  const [curtains, setCurtains] = useState("Sheer White");
  const [decorItems, setDecorItems] = useState<string[]>(["Indoor Plants"]);
  const [overlayTitle, setOverlayTitle] = useState("Serene Minimal Living");
  const [overlayTagline, setOverlayTagline] = useState("Calm • Airy • Functional");
  const [overlayCta, setOverlayCta] = useState("Save Design");
  const [brandPalette, setBrandPalette] = useState("Teal/Indigo");

  // Flow
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [editedImageResult, setEditedImageResult] = useState<any>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const toggleDecor = (item: string) => {
    setDecorItems((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const handleAdd = (file: File, data: { data: string; mimeType: string }) => {
    setImages([{ ...data }]);
    const url = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  };

  const handleRemove = () => {
    setImages([]);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || images.length === 0) return;

    // --- USAGE CAP ENFORCEMENT ---
    const isPro = userProfile?.plan === 'PRO';
    if (isPro) {
      const usage = userProfile.usageMetadata?.visual_sow_generated_count || 0;
      if (usage >= 50) {
        alert("You have reached your limit of 50 Visual SOW generations per month. Please upgrade to PRO MAX for unlimited access.");
        return;
      }
    }
    // -----------------------------

    setIsLoading(true);
    setError(null);
    setHasSubmitted(true);
    setEditedImageResult(null);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    const activeWallColor = customColor || wallColor;

    const prompt = buildInteriorPrompt({
      roomType,
      furnitureStyle,
      wallColor: activeWallColor,
      flooring,
      curtains,
      decorList: decorItems,
      paletteDesc: paletteMap[brandPalette] || paletteMap["Teal/Indigo"],
      titleText: overlayTitle,
      taglineText: overlayTagline,
      ctaText: overlayCta,
    });

    try {
      const result = await generateInteriorDesign(images, prompt);
      setEditedImageResult(result);

      // Increment Usage
      if (onIncrementUsage) onIncrementUsage();

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again shortly.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (isLoading)
      return <div className="grid place-items-center min-h-[360px]"><LoadingSpinner /></div>;
    if (error)
      return <div className="glass rounded-xl border border-[rgba(var(--border-rgb),0.7)] p-4 text-red-700 bg-white/60">{error}</div>;
    if (!hasSubmitted)
      return (
        <div className="glass rounded-xl border border-[rgba(var(--border-rgb),0.7)] p-8 text-center text-[var(--text-soft)]">
          <Sparkles className="w-10 h-10 mx-auto mb-3" />
          <p>Upload a room photo, choose makeover options, and generate a photorealistic redesign.</p>
        </div>
      );
    if (!editedImageResult)
      return <div className="glass rounded-xl border border-[rgba(var(--border-rgb),0.7)] p-8 text-center text-[var(--text-soft)]">No result yet. Try another image.</div>;

    return <EditedImageCard original={imagePreview} result={editedImageResult} onZoom={setModalImage} />;
  };

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Styles wrapper for local variables
  const containerStyle = {
    "--modern-teal": "#00b3a4",
    "--modern-indigo": "#6366f1",
    "--modern-amber": "#f59e0b",
    "--modern-rose": "#f43f5e",
    "--modern-sky": "#38bdf8",
    "--text-strong": theme === 'dark' ? "#f3f4f6" : "#0b1220",
    "--text-soft": theme === 'dark' ? "#a3a6ad" : "#6b7280",
    "--surface-rgb": theme === 'dark' ? "23, 25, 33" : "255, 255, 255",
    "--border-rgb": theme === 'dark' ? "60, 65, 75" : "229, 231, 235",
    "--bg-grad-start": theme === 'dark' ? "#0b1020" : "#0ea5e9",
    "--bg-grad-end": theme === 'dark' ? "#0b1b2b" : "#6366f1",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen relative font-cairo" style={containerStyle}>
      <style>{styles}</style>

      {/* Background Orbs */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          background: `linear-gradient(145deg, var(--bg-grad-start) 0%, var(--bg-grad-end) 100%)`,
          backgroundAttachment: 'fixed'
        }}
      >
        <span className="orb orb--1"></span>
        <span className="orb orb--2"></span>
        <span className="orb orb--3"></span>
        <span className="orb orb--4"></span>
      </div>

      <div className="relative z-10 p-6 md:p-12">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[rgba(var(--border-rgb),0.5)]/60 backdrop-blur-xl rounded-2xl mb-8">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-lg text-[var(--text-strong)]">
              <Sofa className="w-6 h-6" />
              <span>AI Interior Design – Room Makeover</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full glass border border-[rgba(var(--border-rgb),0.6)] hover:scale-[1.02] active:scale-95 transition text-[var(--text-strong)]"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full grid lg:grid-cols-5 gap-6 items-start">
          {/* Left Column Controls */}
          <aside className="lg:col-span-2 lg:sticky lg:top-24 self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar">
            <div className="glass rounded-2xl border border-[rgba(var(--border-rgb),0.6)] p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-white/40 pb-3 text-[var(--text-strong)]">
                <PaintRoller className="w-5 h-5" />
                <h2 className="text-sm font-bold tracking-wide">Makeover Settings</h2>
              </div>

              <UploadImage preview={imagePreview} onAdd={handleAdd} onRemove={handleRemove} disabled={isLoading} />

              <div>
                <SectionTitle>1) Room Type</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {["Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office", "Dining Room"].map(o => (
                    <Pill key={o} active={roomType === o} onClick={() => setRoomType(o)} disabled={isLoading}>{o}</Pill>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>2) Furniture Style</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {["Modern", "Minimalist", "Scandinavian", "Industrial", "Vintage", "Bohemian"].map(o => (
                    <Pill key={o} active={furnitureStyle === o} onClick={() => setFurnitureStyle(o)} disabled={isLoading}>{o}</Pill>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>3) Wall Color</SectionTitle>
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { key: "Warm White", color: "#F7F5F2" },
                    { key: "Cool Grey", color: "#D4D8DD" },
                    { key: "Sage Green", color: "#A7B9A8" },
                    { key: "Navy", color: "#0F2A43" },
                    { key: "Sand Beige", color: "#D9C7A4" },
                    { key: "Charcoal", color: "#2E2F34" },
                  ].map(s => (
                    <Swatch key={s.key} label={s.key} color={s.color} active={wallColor === s.key} onClick={() => { setWallColor(s.key); setCustomColor(""); }} disabled={isLoading} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Custom Color (e.g. #FF5733 or 'Dusty Rose')"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        if (e.target.value) setWallColor("Custom");
                      }}
                      disabled={isLoading}
                      className="w-full px-3 py-2 text-sm rounded-lg glass border border-[rgba(var(--border-rgb),0.7)] outline-none focus:ring-2 focus:ring-white/40 text-[var(--text-strong)] placeholder:text-[var(--text-soft)]"
                    />
                  </div>
                  {customColor && (
                    <div className="w-10 h-10 rounded-lg border border-[rgba(var(--border-rgb),0.7)] shadow-sm" style={{ background: customColor }} />
                  )}
                </div>
              </div>

              <div>
                <SectionTitle>4) Flooring</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {["Light Wood", "Dark Wood", "Concrete", "Marble", "Patterned Tile", "Carpet"].map(o => (
                    <Pill key={o} active={flooring === o} onClick={() => setFlooring(o)} disabled={isLoading}>{o}</Pill>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>5) Curtains</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {["Sheer White", "Blackout Dark", "Linen Beige", "Velvet Emerald", "None"].map(o => (
                    <Pill key={o} active={curtains === o} onClick={() => setCurtains(o)} disabled={isLoading}>{o}</Pill>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>6) Decorative Items</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {["Indoor Plants", "Floor Lamp", "Wall Art", "Throw Pillows", "Rug", "Books", "Vases"].map(o => (
                    <Pill key={o} active={decorItems.includes(o)} onClick={() => toggleDecor(o)} disabled={isLoading}>{o}</Pill>
                  ))}
                </div>
              </div>

              {/* Overlay Text Inputs */}
              <div>
                <SectionTitle>7) Overlay Text (optional)</SectionTitle>
                <div className="grid grid-cols-1 gap-3">
                  <input type="text" placeholder="Project Name" value={overlayTitle} onChange={e => setOverlayTitle(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 rounded-lg glass border border-[rgba(var(--border-rgb),0.7)] outline-none focus:ring-2 focus:ring-white/40 text-[var(--text-strong)]" />
                  <input type="text" placeholder="Tagline" value={overlayTagline} onChange={e => setOverlayTagline(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 rounded-lg glass border border-[rgba(var(--border-rgb),0.7)] outline-none focus:ring-2 focus:ring-white/40 text-[var(--text-strong)]" />
                  <input type="text" placeholder="CTA Label" value={overlayCta} onChange={e => setOverlayCta(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 rounded-lg glass border border-[rgba(var(--border-rgb),0.7)] outline-none focus:ring-2 focus:ring-white/40 text-[var(--text-strong)]" />
                </div>
              </div>

              {/* Brand Palette */}
              <div>
                <SectionTitle>8) Brand Palette</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "Teal/Indigo", from: "var(--modern-teal)", to: "var(--modern-indigo)" },
                    { key: "Sky/Indigo", from: "var(--modern-sky)", to: "var(--modern-indigo)" },
                    { key: "Indigo/Amber", from: "var(--modern-indigo)", to: "var(--modern-amber)" },
                    { key: "Teal/Rose", from: "var(--modern-teal)", to: "var(--modern-rose)" },
                    { key: "Sky/Amber", from: "var(--modern-sky)", to: "var(--modern-amber)" },
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setBrandPalette(p.key)}
                      disabled={isLoading}
                      className={cls(
                        "relative w-10 h-10 rounded-full border border-[rgba(var(--border-rgb),0.7)] transition hover:scale-105 active:scale-95",
                        brandPalette === p.key && "ring-2 ring-white/70"
                      )}
                      style={{ backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      title={p.key}
                    >
                      {brandPalette === p.key && <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || images.length === 0}
                  className={cls(
                    "w-full btn-gradient px-5 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition",
                    isLoading || images.length === 0 ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl"
                  )}
                >
                  {isLoading ? "Generating..." : "Transform Image"}
                </button>

                {hasSubmitted && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasSubmitted(false);
                      setEditedImageResult(null);
                      setImages([]);
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImagePreview(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full px-5 py-3 rounded-xl font-bold border border-[rgba(var(--border-rgb),0.6)] text-[var(--text-strong)] hover:bg-white/10 active:scale-95 transition"
                  >
                    Start Over / New Image
                  </button>
                )}
              </form>
            </div>
          </aside>

          {/* Right Column Results */}
          <section className="lg:col-span-3 space-y-6" ref={resultsRef}>
            {renderResults()}
          </section>
        </main>
      </div>

      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}
    </div>
  );
};

export default InteriorDesigner;
