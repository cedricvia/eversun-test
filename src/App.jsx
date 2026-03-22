// ─── Indicateur de connexion réseau ────────────────────────────────────────
function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 9999,
        background: "#DC2626",
        color: "#fff",
        textAlign: "center",
        fontWeight: 600,
        fontSize: 13,
        padding: "7px 0",
        letterSpacing: ".03em",
        boxShadow: "0 2px 8px #DC262633",
      }}
      role="status"
      aria-live="assertive"
    >
      ⚠️ Hors ligne : certaines actions seront désactivées
    </div>
  );
}

// ─── Message de validation/erreur ─────────────────────────────────────────
function Message({ type = "info", children }) {
  const colors = {
    info: { bg: "#EFF6FF", color: "#2563EB", border: "#3B82F6" },
    success: { bg: "#F0FDF4", color: "#16A34A", border: "#16A34A" },
    error: { bg: "#FEF2F2", color: "#DC2626", border: "#DC2626" },
    warning: { bg: "#FFFBEB", color: "#B45309", border: "#F59E0B" },
  };
  const c = colors[type] || colors.info;
  return (
    <div
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 7,
        padding: "10px 14px",
        margin: "10px 0",
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
      role={type === "error" ? "alert" : "status"}
    >
      {type === "success" && <span>✓</span>}
      {type === "error" && <span>⛔</span>}
      {type === "warning" && <span>⚠️</span>}
      {type === "info" && <span>ℹ️</span>}
      <span>{children}</span>
    </div>
  );
}
// ─── Loader universel ──────────────────────────────────────────────────────
function Loader({ visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255,255,255,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
      }}
      aria-label="Chargement en cours"
      role="status"
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "5px solid #eee",
          borderTop: "5px solid var(--accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}

// ─── Bouton Retour en haut ─────────────────────────────────────────────────
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      style={{
        position: "fixed",
        right: 24,
        bottom: 90,
        zIndex: 9001,
        background: "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: 24,
        width: 44,
        height: 44,
        boxShadow: "0 2px 8px rgba(0,0,0,.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        cursor: "pointer",
        transition: "background .15s",
      }}
      tabIndex={0}
    >
      ↑
    </button>
  );
}
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  createContext,
  useContext,
} from "react";
import { useApiData } from "./useApiData";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  /* ── Light theme ── */
  :root{
    --bg:#F4F3F0;--surface:#FAFAF8;--card:#fff;
    --border:rgba(0,0,0,.07);--border-em:rgba(0,0,0,.13);
    --text:#111110;--muted:#6B6A65;--hint:#A8A79F;
    --accent:#E85D24;--accent-s:rgba(232,93,36,.1);--accent-b:rgba(232,93,36,.22);
    --green:#16A34A;--green-s:#F0FDF4;
    --sidebar:230px;--r:10px;--rs:7px;
    --sh:0 1px 2px rgba(0,0,0,.05),0 1px 5px rgba(0,0,0,.04);
    --sh-md:0 3px 12px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.05);
    --toast-bg:#1A1A1A;
  }
  /* ── Dark theme ── */
  :root[data-theme=dark]{
    --bg:#111110;--surface:#1A1A18;--card:#1F1F1D;
    --border:rgba(255,255,255,.07);--border-em:rgba(255,255,255,.13);
    --text:#F0EFE8;--muted:#9B9A93;--hint:#6B6A65;
    --accent:#F97239;--accent-s:rgba(249,114,57,.13);--accent-b:rgba(249,114,57,.25);
    --green:#22C55E;--green-s:rgba(34,197,94,.12);
    --sh:0 1px 3px rgba(0,0,0,.3),0 1px 6px rgba(0,0,0,.2);
    --sh-md:0 4px 16px rgba(0,0,0,.4),0 1px 4px rgba(0,0,0,.3);
    --toast-bg:#2A2A28;
  }

  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);
    font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;transition:background .2s,color .2s}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(128,128,128,.2);border-radius:4px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(128,128,128,.35)}

  /* ── Animations ── */
  @keyframes pgIn   {from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes modIn  {from{opacity:0;transform:scale(.975) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes ovIn   {from{opacity:0}to{opacity:1}}
  @keyframes expIn  {from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
  @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(20px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pg    {animation:pgIn  .18s cubic-bezier(.22,1,.36,1) both}
  .mod   {animation:modIn .16s cubic-bezier(.22,1,.36,1) both}
  .ov    {animation:ovIn  .12s ease both}
  .expand{animation:expIn .2s ease both}

  /* ── Toast ── */
  .toast{position:fixed;bottom:24px;right:24px;z-index:9000;
    display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .toast-item{display:flex;align-items:center;gap:10px;
    background:var(--toast-bg);color:#fff;
    border-radius:10px;padding:11px 16px;
    font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,.25);min-width:240px;max-width:340px;
    pointer-events:all;
    animation:toastIn .2s cubic-bezier(.22,1,.36,1) both}
  .toast-item.out{animation:toastOut .18s ease forwards}

  /* ── Focus rings ── */
  :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

  /* ── Misc ── */
  select option{background:var(--card);color:var(--text)}
  input[type="date"]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;filter:var(--date-icon-filter,none)}
  input[type="date"][readonly]::-webkit-calendar-picker-indicator{display:none}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}

  /* ── Smooth field/card transitions ── */
  input,select,textarea{transition:border-color .12s,box-shadow .12s,background .15s}
  .card-row{transition:background .1s}

  /* ── Print styles ── */
  @media print{
    aside,.toast,button{display:none!important}
    main{padding:0!important}
    .pg{animation:none!important}
  }

  /* ── Reduced motion ── */
  @media(prefers-reduced-motion:reduce){
    *{animation-duration:.01ms!important;transition-duration:.01ms!important}
  }

  /* ── Keyboard shortcut hint ── */
  .kbd{display:inline-flex;align-items:center;justify-content:center;
    background:var(--surface);border:1px solid var(--border-em);
    border-radius:4px;padding:1px 5px;font-size:10px;
    font-family:'DM Mono',monospace;color:var(--muted);line-height:1.4}
`;

// ─── Toast system ────────────────────────────────────────────────────────────
const ToastCtx = createContext(() => {});
let toastId = 0;
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 200);
    }, 3000);
  }, []);
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const colors = { success: "#16A34A", error: "#DC2626", info: "#3B82F6" };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item${t.out ? " out" : ""}`}
            style={{
              borderLeft: `4px solid ${t.type === "error" ? "#DC2626" : t.type === "info" ? "#3B82F6" : "#16A34A"}`,
              boxShadow:
                t.type === "error"
                  ? "0 2px 12px #DC262633"
                  : t.type === "info"
                    ? "0 2px 12px #3B82F633"
                    : "0 2px 12px #16A34A33",
              minWidth: 260,
              fontWeight: 600,
              letterSpacing: ".01em",
              outline: t.out ? "none" : "2px solid var(--accent)",
            }}
            role="alert"
            tabIndex={0}
            aria-live="assertive"
          >
            <span style={{ fontSize: 18, marginRight: 6 }}>
              {icons[t.type] || "ℹ"}
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ─── Theme context ────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: false, toggle: () => {} });
function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("evs_theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    try {
      localStorage.setItem("evs_theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  const toggle = useCallback(() => setDark((d) => !d), []);
  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>
  );
}
const useTheme = () => useContext(ThemeCtx);

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = [
  "Attente document",
  "Déclaration Préalable",
  "PV Chantier",
  "Consuel",
  "Raccordement",
  "DAACT",
];
const SDOT = {
  "Attente document": "#F59E0B",
  "Déclaration Préalable": "#3B82F6",
  "PV Chantier": "#0EA5E9",
  Consuel: "#8B5CF6",
  Raccordement: "#16A34A",
  DAACT: "#EF4444",
};
const PV_STATUTS = ["En attente", "Signé", "Réserves", "Refusé"];
const DP_S = ["En cours d'instruction", "Accord Favorable", "ABF", "Refus"];
const DP_C = {
  "En cours d'instruction": "#3B82F6",
  "Accord Favorable": "#16A34A",
  ABF: "#B45309",
  Refus: "#DC2626",
};
const CONS_S = [
  "À Faire",
  "En cours de traitement",
  "Avis de visite",
  "Consuel Visé",
];
const CONS_C = {
  "À Faire": "#A8A79F",
  "En cours de traitement": "#3B82F6",
  "Avis de visite": "#8B5CF6",
  "Consuel Visé": "#16A34A",
};
const NAV = [
  { id: "clients", label: "Clients", icon: "users" },
  { id: "declaration", label: "Déclaration Préalable", icon: "file" },
  { id: "installation", label: "Date d'installation", icon: "tool" },
  { id: "consuel", label: "Consuel", icon: "check" },
  { id: "raccordement", label: "Raccordement", icon: "zap" },
  { id: "daact", label: "DAACT", icon: "building" },
  { id: "finalise", label: "Dossier finalisé", icon: "star" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const PATHS = {
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  tool: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z",
  trash:
    "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  x: "M18 6 6 18M6 6l12 12",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  chevD: "M6 9l6 6 6-6",
  chevU: "M18 15l-6-6-6 6",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  clip: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
  sun: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
};
const Ico = memo(({ n, size = 16, sw = 1.5 }) => {
  const isStar = n === "star";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={isStar ? "currentColor" : "none"}
      stroke={isStar ? "none" : "currentColor"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {n === "sun" ? (
        <>
          <circle cx="12" cy="12" r="5" />
          <path d={PATHS.sun} />
        </>
      ) : (
        <path d={PATHS[n] || ""} />
      )}
    </svg>
  );
});

// ─── Utilities ────────────────────────────────────────────────────────────────
function getClientId(client) {
  return client._id || client.id;
}

function useLS(key, init) {
  const [v, set] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch {
      return init;
    }
  });
  // Debounced write — don't hammer localStorage on every keystroke
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch (e) {
        console.warn("localStorage full:", e);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [key, v]);
  return [v, set];
}

// Sanitise: strip HTML tags, trim whitespace, limit length
const sanitise = (s, max = 200) =>
  String(s || "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);

// Validate email loosely
const validEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Validate phone: digits, spaces, dashes, +, parens
const validPhone = (p) =>
  !p || /^[0-9\s\-\+\(\)]{7,20}$/.test(p.replace(/\s/g, ""));

function genDos(clients) {
  const max = clients.reduce(
    (m, c) => Math.max(m, parseInt(c.dossier?.replace("DOS-EV-", "")) || 0),
    0,
  );
  return `DOS-EV-${String(max + 1).padStart(4, "0")}`;
}
function addMonths(d, n) {
  if (!d) return "";
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x.toISOString().split("T")[0];
}
function addDays(d, n) {
  if (!d) return "";
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().split("T")[0];
}
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// ─── Primitives ───────────────────────────────────────────────────────────────
const Badge = memo(({ stage, small }) => {
  const dot = SDOT[stage] || "#888";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 20,
        background: dot + "14",
        border: `1px solid ${dot}26`,
        fontSize: small ? 11 : 12,
        fontWeight: 500,
        color: dot,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      {stage}
    </span>
  );
});

const iBase = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border-em)",
  borderRadius: "var(--rs)",
  padding: "7px 10px",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  transition: "border-color .12s,box-shadow .12s",
  fontFamily: "'DM Sans',sans-serif",
};

function Inp({ error, ...p }) {
  const style = {
    ...iBase,
    ...(p.style || {}),
    ...(error ? { borderColor: "#DC2626" } : {}),
  };
  return (
    <div style={{ position: "relative" }}>
      <input
        {...p}
        style={style}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px var(--accent-s)";
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#DC2626" : "var(--border-em)";
          e.target.style.boxShadow = "none";
        }}
      />
      {error && (
        <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 3 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function Sel({ children, error, ...p }) {
  return (
    <div>
      <select
        {...p}
        style={{
          ...iBase,
          cursor: "pointer",
          ...(p.style || {}),
          ...(error ? { borderColor: "#DC2626" } : {}),
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px var(--accent-s)";
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#DC2626" : "var(--border-em)";
          e.target.style.boxShadow = "none";
        }}
      >
        {children}
      </select>
      {error && (
        <div style={{ fontSize: 10.5, color: "#DC2626", marginTop: 3 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function Fld({ label, required, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--muted)",
          marginBottom: 4,
          letterSpacing: ".04em",
          textTransform: "uppercase",
          display: "flex",
          gap: 4,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const Btn = memo(({ v = "primary", ico, children, ...p }) => {
  const S = {
    primary: {
      bg: "var(--accent)",
      color: "#fff",
      border: "none",
      sh: "0 1px 3px rgba(232,93,36,.28)",
    },
    ghost: {
      bg: "var(--card)",
      color: "var(--text)",
      border: "1px solid var(--border-em)",
      sh: "var(--sh)",
    },
    danger: {
      bg: "#FEF2F2",
      color: "#DC2626",
      border: "1px solid rgba(220,38,38,.15)",
      sh: "none",
    },
    icon: {
      bg: "transparent",
      color: "var(--muted)",
      border: "none",
      sh: "none",
    },
  };
  const s = S[v] || S.primary;
  const isIcon = v === "icon";
  return (
    <button
      {...p}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: "var(--rs)",
        padding: isIcon ? "4px" : "8px 14px",
        fontSize: isIcon ? 13 : 13,
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: s.sh,
        transition: "filter .1s,background .1s",
        fontFamily: "'DM Sans',sans-serif",
        lineHeight: 1,
        ...(p.style || {}),
      }}
      onMouseEnter={(e) => {
        if (v === "primary") e.currentTarget.style.filter = "brightness(1.07)";
        else if (!isIcon) e.currentTarget.style.background = "var(--bg)";
        else e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "";
        e.currentTarget.style.background = s.bg;
        if (isIcon) e.currentTarget.style.color = "var(--muted)";
      }}
    >
      {ico && <Ico n={ico} size={13} />}
      {children}
    </button>
  );
});

function Modal({ title, onClose, w = 520, children }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const onSaveProp = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") closeRef.current();
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && onSaveProp.current) {
        e.preventDefault();
        onSaveProp.current();
      }
    };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div
      className="ov"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15,15,14,.38)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="mod"
        style={{
          background: "var(--card)",
          borderRadius: 12,
          width: "100%",
          maxWidth: w,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,.16),0 4px 16px rgba(0,0,0,.06)",
          border: "1px solid var(--border-em)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px 20px 13px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
              padding: 4,
              borderRadius: 6,
              transition: "background .1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Ico n="x" />
          </button>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>{children}</div>
        <div
          style={{
            padding: "0 20px 12px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <span className="kbd">Ctrl+S</span>
          <span style={{ fontSize: 10, color: "var(--hint)", marginLeft: 4 }}>
            Enregistrer
          </span>
          <span style={{ margin: "0 8px", color: "var(--border-em)" }}>·</span>
          <span className="kbd">Esc</span>
          <span style={{ fontSize: 10, color: "var(--hint)", marginLeft: 4 }}>
            Fermer
          </span>
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, msg, sub }) {
  return (
    <div
      style={{ textAlign: "center", padding: "60px 0", color: "var(--hint)" }}
    >
      <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.38 }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
        {msg}
      </div>
      {sub && <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onClose, danger = true }) {
  return (
    <Modal title={title} onClose={onClose} w={400}>
      <p
        style={{
          color: "var(--muted)",
          fontSize: 13.5,
          lineHeight: 1.65,
          marginBottom: 18,
        }}
      >
        {message}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn v="ghost" onClick={onClose}>
          Annuler
        </Btn>
        <Btn
          v={danger ? "danger" : "primary"}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirmer
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
const Checkbox = memo(({ checked, indeterminate, onChange, size = 16 }) => {
  const active = checked || indeterminate;
  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === " " || e.key === "Enter") && onChange(!checked)
      }
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        flexShrink: 0,
        border: `1.5px solid ${active ? "var(--accent)" : "var(--border-em)"}`,
        background: active ? "var(--accent)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all .1s",
        outline: "none",
      }}
    >
      {checked && (
        <svg
          width={10}
          height={10}
          viewBox="0 0 10 10"
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 5l2.5 2.5L8 2.5" />
        </svg>
      )}
      {!checked && indeterminate && (
        <div
          style={{ width: 8, height: 1.5, background: "#fff", borderRadius: 1 }}
        />
      )}
    </div>
  );
});

// ─── CardHeader ───────────────────────────────────────────────────────────────
const CardHeader = memo(
  ({
    client,
    dot,
    dirty,
    open,
    onToggle,
    onSave,
    onViewClient,
    extraBadge,
  }) => {
    const ini = (
      (client.nom[0] || "") + (client.prenom[0] || "")
    ).toUpperCase();
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          height: 50,
          borderBottom: open ? "1px solid var(--border)" : "none",
          cursor: "pointer",
          userSelect: "none",
          background: "var(--card)",
        }}
        onClick={onToggle}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            flexShrink: 0,
            background: `${dot}16`,
            color: dot,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            marginRight: 10,
          }}
        >
          {ini}
        </div>
        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 7,
              flexWrap: "nowrap",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {client.nom} {client.prenom}
            </span>
            {extraBadge}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--hint)",
              marginTop: 1,
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {client.dossier}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Badge stage={client.stage} small />
          {dirty && (
            <button
              onClick={onSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(232,93,36,.22)",
                whiteSpace: "nowrap",
                transition: "filter .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.07)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
            >
              <Ico n="save" size={11} />
              Enregistrer
            </button>
          )}
          <button
            onClick={() => onViewClient(client)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "1px solid var(--border-em)",
              borderRadius: 6,
              padding: "4px 9px",
              fontSize: 11,
              color: "var(--muted)",
              cursor: "pointer",
              transition: "background .1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Ico n="edit" size={11} />
            Fiche
          </button>
          <span style={{ color: "var(--hint)", display: "flex" }}>
            <Ico n={open ? "chevU" : "chevD"} size={13} />
          </span>
        </div>
      </div>
    );
  },
);

// ─── ClientDetail modal ───────────────────────────────────────────────────────
function ClientDetail({ client, onSave, onClose }) {
  const [f, setF] = useState({ ...client });
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const ini = ((f.nom[0] || "") + (f.prenom[0] || "")).toUpperCase() || "?";

  const set = useCallback(
    (k, transform = (v) => v) =>
      (e) => {
        const val = transform(sanitise(e.target.value));
        setF((p) => {
          const next = { ...p, [k]: val };
          if (k === "pvStatut" && val === "Signé") next.stage = "Consuel";
          return next;
        });
        setDirty(true);
        setErrors((er) => ({ ...er, [k]: "" }));
      },
    [],
  );

  const validate = () => {
    const e = {};
    if (!f.nom?.trim()) e.nom = "Nom requis";
    if (f.email && !validEmail(f.email)) e.email = "E-mail invalide";
    if (f.tel && !validPhone(f.tel)) e.tel = "Téléphone invalide";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = useCallback(() => {
    if (!validate()) return;
    onSave(f);
    toast(`${f.nom} ${f.prenom} enregistré`);
    onClose();
  }, [f, onSave, toast, onClose]);

  // Ctrl+S to save
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleSave]);

  const pvDot =
    {
      "En attente": "#F59E0B",
      Signé: "#16A34A",
      Réserves: "#EF4444",
      Refusé: "#DC2626",
    }[f.pvStatut || ""] || "#888";

  return (
    <Modal title="Fiche client" onClose={onClose} w={500}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            background: "var(--accent-s)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: ".02em",
          }}
        >
          {ini}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {f.nom || "—"} {f.prenom}
          </div>
          <div
            style={{
              marginTop: 5,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Badge stage={f.stage} small />
            {dirty && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  fontWeight: 500,
                }}
              >
                ● Non enregistré
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 11,
            color: "var(--hint)",
            flexShrink: 0,
          }}
        >
          {f.dossier}
        </div>
      </div>

      {/* Fields */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 14px",
        }}
      >
        <Fld label="Nom" required>
          <Inp
            value={f.nom || ""}
            onChange={set("nom")}
            placeholder="Dupont"
            error={errors.nom}
            autoComplete="family-name"
          />
        </Fld>
        <Fld label="Prénom">
          <Inp
            value={f.prenom || ""}
            onChange={set("prenom")}
            placeholder="Jean"
            autoComplete="given-name"
          />
        </Fld>
      </div>
      <Fld label="Stade">
        <Sel
          value={f.stage || ""}
          onChange={(e) => {
            setF((p) => ({ ...p, stage: e.target.value }));
            setDirty(true);
          }}
        >
          {STAGES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Sel>
      </Fld>
      <Fld label="E-mail">
        <Inp
          type="email"
          value={f.email || ""}
          onChange={set("email")}
          placeholder="jean@exemple.fr"
          error={errors.email}
          autoComplete="email"
        />
      </Fld>
      <Fld label="Téléphone">
        <Inp
          value={f.tel || ""}
          onChange={set("tel")}
          placeholder="06 00 00 00 00"
          error={errors.tel}
          autoComplete="tel"
        />
      </Fld>
      <Fld label="Adresse">
        <Inp
          value={f.adresse || ""}
          onChange={set("adresse")}
          placeholder="12 rue du Soleil, 75001 Paris"
          autoComplete="street-address"
        />
      </Fld>

      {/* PV Chantier */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600 }}>PV Chantier</span>
          {f.pvStatut && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 20,
                background: pvDot + "18",
                border: `1px solid ${pvDot}26`,
                color: pvDot,
              }}
            >
              {f.pvStatut}
            </span>
          )}
          {f.pvStatut === "Signé" && (
            <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 500 }}>
              ✓ Auto → Consuel
            </span>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Fld label="Statut PV">
            <Sel
              value={f.pvStatut || ""}
              onChange={(e) => {
                const v = e.target.value;
                setF((p) => {
                  const n = { ...p, pvStatut: v };
                  if (v === "Signé") n.stage = "Consuel";
                  return n;
                });
                setDirty(true);
              }}
            >
              <option value="">— Sélectionner —</option>
              {PV_STATUTS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Sel>
          </Fld>
          <Fld label="Date PV">
            <Inp type="date" value={f.pvDate || ""} onChange={set("pvDate")} />
          </Fld>
        </div>
        <Fld label="Observations">
          <Inp
            value={f.pvNote || ""}
            onChange={set("pvNote", (v) => v.slice(0, 500))}
            placeholder="Remarques sur le chantier…"
          />
        </Fld>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          paddingTop: 8,
        }}
      >
        <Btn v="ghost" onClick={onClose}>
          Annuler
        </Btn>
        <Btn
          onClick={handleSave}
          style={{ opacity: dirty ? 1 : 0.5, transition: "opacity .15s" }}
        >
          Enregistrer
        </Btn>
      </div>
    </Modal>
  );
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────
const StatsRow = memo(({ clients }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
      gap: 8,
      marginBottom: 20,
    }}
  >
    {[...STAGES, null].map((s, i) => {
      const isTotal = s === null;
      const n = isTotal
        ? clients.length
        : clients.filter((c) => c.stage === s).length;
      const dot = isTotal ? "var(--accent)" : SDOT[s] || "#888";
      return (
        <div
          key={i}
          style={{
            background: "var(--card)",
            borderRadius: "var(--r)",
            border: "1px solid var(--border)",
            borderTop: `2px solid ${dot}`,
            padding: "11px 13px",
            boxShadow: "var(--sh)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: isTotal ? "var(--accent)" : "var(--text)",
              letterSpacing: "-.02em",
            }}
          >
            {n}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--muted)",
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {isTotal ? "Total" : s}
          </div>
        </div>
      );
    })}
  </div>
));

// ─── Google Sheets import ─────────────────────────────────────────────────────
function parseSheetPaste(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const rows = lines.map((l) => l.split("\t").map((c) => c.trim()));
  const firstLower = rows[0].map((c) => c.toLowerCase());
  const headerKeys = [
    "nom",
    "prénom",
    "prenom",
    "e-mail",
    "email",
    "téléphone",
    "telephone",
    "adresse",
    "stade",
  ];
  const isHeader = firstLower.some((c) => headerKeys.includes(c));
  let dataRows = isHeader ? rows.slice(1) : rows;
  let colMap = { nom: 0, prenom: 1, email: 2, tel: 3, adresse: 4, stage: 5 };
  if (isHeader) {
    const h = rows[0].map((c) =>
      c
        .toLowerCase()
        .replace(/é/g, "e")
        .replace("prénom", "prenom")
        .replace("téléphone", "tel")
        .replace("telephone", "tel")
        .replace("e-mail", "email")
        .replace("stade", "stage"),
    );
    colMap = {};
    h.forEach((col, i) => {
      if (col.includes("nom") && !col.includes("pre")) colMap.nom = i;
      else if (col.includes("pre")) colMap.prenom = i;
      else if (col.includes("mail")) colMap.email = i;
      else if (col.includes("tel")) colMap.tel = i;
      else if (col.includes("adresse")) colMap.adresse = i;
      else if (col.includes("stage") || col.includes("stade")) colMap.stage = i;
    });
  }
  const get = (row, key) => sanitise(row[colMap[key]] || "");
  return dataRows
    .filter((row) => row.some((c) => c))
    .map((row) => ({
      nom: get(row, "nom"),
      prenom: get(row, "prenom"),
      email: get(row, "email"),
      tel: get(row, "tel"),
      adresse: get(row, "adresse"),
      stage: STAGES.includes(get(row, "stage"))
        ? get(row, "stage")
        : "Attente document",
    }))
    .filter((r) => r.nom || r.prenom);
}

function PasteImportModal({ clients, onImport, onClose }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    navigator.clipboard
      ?.readText?.()
      .then((t) => {
        if (t?.includes("\t")) setText(t);
      })
      .catch(() => {});
  }, []);

  const handleParse = () => {
    setError("");
    if (!text.trim()) {
      setError("Collez d'abord vos données.");
      return;
    }
    const rows = parseSheetPaste(text);
    if (!rows.length) {
      setError("Aucune ligne valide détectée.");
      return;
    }
    setPreview(rows);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    setError("");
    
    try {
      const base = clients.length;
      const newC = preview.map((r, i) => ({
        ...r,
        dossier: `DOS-EV-${String(base + i + 1).padStart(4, "0")}`,
      }));
      
      console.log("Importing clients:", newC);
      
      // Importer chaque client via l'API
      let successCount = 0;
      for (let i = 0; i < newC.length; i++) {
        try {
          const client = newC[i];
          console.log(`Importing client ${i + 1}/${newC.length}:`, client);
          await onImport(client);
          successCount++;
        } catch (clientErr) {
          console.error(`Error importing client ${i + 1}:`, clientErr);
          throw new Error(`Erreur lors de l'importation du client ${i + 1}: ${clientErr.message}`);
        }
      }
      
      toast(
        `${successCount} client${successCount > 1 ? "s" : ""} importé${successCount > 1 ? "s" : ""} avec succès`,
      );
      onClose();
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message || "Erreur lors de l'importation. Veuillez réessayer.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal title="Importer depuis Google Sheets" onClose={onClose} w={600}>
      {!preview ? (
        <>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--rs)",
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📋</span>Comment importer
            </div>
            <ol
              style={{
                paddingLeft: 16,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {[
                "Dans Google Sheets, sélectionnez vos colonnes",
                "Copiez (Ctrl+C)",
                "Collez ci-dessous (Ctrl+V)",
              ].map((s, i) => (
                <li key={i} style={{ fontSize: 12, color: "var(--muted)" }}>
                  {s}
                </li>
              ))}
            </ol>
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "var(--card)",
                borderRadius: 6,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                Colonnes reconnues
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[
                  "Nom",
                  "Prénom",
                  "E-mail",
                  "Téléphone",
                  "Adresse",
                  "Stade",
                ].map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: "var(--accent-s)",
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Fld label="Données copiées">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Collez ici vos données…"}
              style={{
                width: "100%",
                minHeight: 110,
                background: "var(--surface)",
                border: "1px solid var(--border-em)",
                borderRadius: "var(--rs)",
                padding: "9px 11px",
                fontSize: 12,
                color: "var(--text)",
                outline: "none",
                resize: "vertical",
                fontFamily: "'DM Mono',monospace",
                lineHeight: 1.6,
                transition: "border-color .12s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-em)")}
              autoFocus
            />
          </Fld>
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#DC2626",
                marginBottom: 8,
                padding: "7px 10px",
                background: "#FEF2F2",
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              paddingTop: 4,
            }}
          >
            <Btn v="ghost" onClick={onClose}>
              Annuler
            </Btn>
            <Btn ico="clip" onClick={handleParse}>
              Analyser
            </Btn>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {preview.length} client{preview.length > 1 ? "s" : ""} détecté
              {preview.length > 1 ? "s" : ""}
            </div>
            <button
              onClick={() => setPreview(null)}
              style={{
                fontSize: 12,
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Modifier
            </button>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--rs)",
              overflow: "hidden",
              marginBottom: 16,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {["Nom", "Prénom", "E-mail", "Téléphone", "Stade"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "7px 10px",
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom:
                        i < preview.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td style={{ padding: "7px 10px", fontWeight: 500 }}>
                      {r.nom || "—"}
                    </td>
                    <td style={{ padding: "7px 10px" }}>{r.prenom || "—"}</td>
                    <td style={{ padding: "7px 10px", color: "var(--muted)" }}>
                      {r.email || "—"}
                    </td>
                    <td style={{ padding: "7px 10px", color: "var(--muted)" }}>
                      {r.tel || "—"}
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <Badge stage={r.stage} small />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--muted)",
              marginBottom: 14,
              padding: "8px 12px",
              background: "var(--green-s)",
              borderRadius: 6,
              border: "1px solid #16A34A22",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
            Numéros de dossier attribués automatiquement.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={onClose}>
              Annuler
            </Btn>
            <Btn ico="upload" onClick={handleImport} disabled={importing}>
              {importing ? 'Importation...' : `Importer ${preview.length} client${preview.length > 1 ? "s" : ""}`}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Bulk edit modal ──────────────────────────────────────────────────────────
function BulkEditModal({ ids, clients, onSave, onClose }) {
  const selected = useMemo(
    () => clients.filter((c) => ids.includes(getClientId(c))),
    [ids, clients],
  );
  const [stage, setStage] = useState("");
  const hasChange = !!stage;
  const ini = (c) => ((c.nom[0] || "") + (c.prenom[0] || "")).toUpperCase();

  return (
    <Modal
      title={`Modifier ${ids.length} client${ids.length > 1 ? "s" : ""}`}
      onClose={onClose}
      w={460}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          marginBottom: 16,
          padding: "10px 12px",
          background: "var(--surface)",
          borderRadius: "var(--rs)",
          border: "1px solid var(--border)",
        }}
      >
        {selected.map((c) => (
          <span
            key={getClientId(c)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px 3px 4px",
              borderRadius: 20,
              background: "var(--card)",
              border: "1px solid var(--border-em)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--accent-s)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {ini(c)}
            </span>
            {c.nom} {c.prenom}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        Seuls les champs remplis seront modifiés.
      </p>
      <Fld label="Changer le stade">
        <Sel value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">— Ne pas modifier —</option>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Sel>
      </Fld>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          paddingTop: 6,
        }}
      >
        <Btn v="ghost" onClick={onClose}>
          Annuler
        </Btn>
        <Btn
          onClick={() => {
            if (hasChange) {
              onSave(ids, { ...(stage ? { stage } : {}) });
              onClose();
            }
          }}
          style={{ opacity: hasChange ? 1 : 0.45, transition: "opacity .15s" }}
        >
          Appliquer à {ids.length} client{ids.length > 1 ? "s" : ""}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── Clients section ──────────────────────────────────────────────────────────
function ClientsSection({ clients, setClients, addClient, onView, clientActions }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [pasteModal, setPasteModal] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkEdit, setBulkEdit] = useState(false);
  const [bulkDel, setBulkDel] = useState(false);
  const [sortBy, setSortBy] = useState("dossier"); // dossier | nom | stage
  const toast = useToast();

  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    const lq = debouncedQ.toLowerCase().trim();
    let list = lq
      ? clients.filter((c) =>
          `${c.nom} ${c.prenom} ${c.dossier} ${c.email} ${c.tel}`
            .toLowerCase()
            .includes(lq),
        )
      : [...clients];
    if (sortBy === "nom")
      list.sort((a, b) =>
        `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`),
      );
    if (sortBy === "stage")
      list.sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage));
    if (sortBy === "dossier")
      list.sort((a, b) => a.dossier.localeCompare(b.dossier));
    return list;
  }, [clients, debouncedQ, sortBy]);

  const allSel = useMemo(
    () => filtered.length > 0 && filtered.every((c) => selected.has(getClientId(c))),
    [filtered, selected],
  );
  const someSel = useMemo(
    () => filtered.some((c) => selected.has(getClientId(c))) && !allSel,
    [filtered, selected, allSel],
  );
  const selIds = useMemo(
    () => [...selected].filter((id) => clients.find((c) => getClientId(c) === id)),
    [selected, clients],
  );

  const toggleOne = useCallback(
    (id, v) =>
      setSelected((s) => {
        const n = new Set(s);
        v ? n.add(id) : n.delete(id);
        return n;
      }),
    [],
  );
  const toggleAll = useCallback(
    (v) =>
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach((c) => (v ? n.add(getClientId(c)) : n.delete(getClientId(c))));
        return n;
      }),
    [filtered],
  );
  const clearSel = useCallback(() => setSelected(new Set()), []);

  const save = useCallback(
    async (form) => {
      const isNew = modal === "new";
      if (isNew) {
        await addClient(form);
      } else {
        try {
          const id = getClientId(modal);
          await clientActions.updateClient(id, form);
          toast(`${form.nom} ${form.prenom} mis à jour`);
        } catch {
          toast("Erreur lors de la modification", "error");
        }
      }
      setModal(null);
    },
    [modal, addClient, clientActions],
  );

  const applyBulk = useCallback(
    (ids, patch) => {
      setClients((cs) =>
        cs.map((c) => (ids.includes(getClientId(c)) ? { ...c, ...patch } : c)),
      );
      toast(`${ids.length} client${ids.length > 1 ? "s" : ""} mis à jour`);
      clearSel();
    },
    [clearSel],
  );

  return (
    <div>
      <StatsRow clients={clients} />

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--hint)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Ico n="search" />
          </span>
          <Inp
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, dossier, email…"
            style={{ paddingLeft: 34, fontSize: 13 }}
            aria-label="Rechercher"
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Effacer la recherche"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--hint)",
                display: "flex",
                padding: 2,
                borderRadius: 4,
                transition: "color .1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--hint)")
              }
            >
              <Ico n="x" size={14} />
            </button>
          )}
        </div>
        {/* Sort */}
        <div
          style={{
            display: "flex",
            border: "1px solid var(--border-em)",
            borderRadius: "var(--rs)",
            overflow: "hidden",
            boxShadow: "var(--sh)",
            flexShrink: 0,
          }}
        >
          {[
            ["dossier", "N°"],
            ["nom", "Nom"],
            ["stage", "Stade"],
          ].map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              style={{
                padding: "7px 11px",
                background: sortBy === k ? "var(--accent-s)" : "var(--card)",
                color: sortBy === k ? "var(--accent)" : "var(--muted)",
                border: "none",
                borderRight:
                  k !== "stage" ? "1px solid var(--border-em)" : "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: sortBy === k ? 600 : 400,
                fontFamily: "'DM Sans',sans-serif",
                transition: "background .1s,color .1s",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
        <Btn v="ghost" ico="clip" onClick={() => setPasteModal(true)}>
          Importer
        </Btn>
        <Btn ico="plus" onClick={() => setModal("new")}>
          Nouveau
        </Btn>
      </div>

      {/* Bulk bar */}
      {selIds.length > 0 && (
        <div
          className="expand"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 14px",
            marginBottom: 10,
            background: "var(--text)",
            borderRadius: "var(--r)",
            boxShadow: "var(--sh-md)",
          }}
        >
          <span
            style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", flex: 1 }}
          >
            {selIds.length} sélectionné{selIds.length > 1 ? "s" : ""}
          </span>
          {[
            {
              label: "Modifier",
              fn: () => setBulkEdit(true),
              bg: "rgba(255,255,255,.12)",
              hv: "rgba(255,255,255,.2)",
            },
            {
              label: "Supprimer",
              fn: () => setBulkDel(true),
              bg: "rgba(220,38,38,.2)",
              hv: "rgba(220,38,38,.35)",
              c: "#ff8080",
            },
          ].map((b) => (
            <button
              key={b.label}
              onClick={b.fn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: b.bg,
                color: b.c || "#fff",
                border: `1px solid ${b.c ? "rgba(220,38,38,.3)" : "rgba(255,255,255,.2)"}`,
                borderRadius: 6,
                padding: "5px 11px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = b.hv)}
              onMouseLeave={(e) => (e.currentTarget.style.background = b.bg)}
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={clearSel}
            aria-label="Désélectionner"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,.5)",
              cursor: "pointer",
              display: "flex",
              padding: 4,
              borderRadius: 4,
              transition: "color .1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,.5)")
            }
          >
            <Ico n="x" size={14} />
          </button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Empty
          icon="👥"
          msg={
            q
              ? "Aucun résultat pour cette recherche"
              : "Aucun client enregistré"
          }
          sub={
            q ? "Essayez un autre terme" : "Créez votre premier dossier client"
          }
        />
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            boxShadow: "var(--sh)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 14px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <Checkbox
              checked={allSel}
              indeterminate={someSel}
              onChange={toggleAll}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".05em",
                flex: 1,
              }}
            >
              {filtered.length} client{filtered.length !== 1 ? "s" : ""}
              {selIds.length > 0 && (
                <span style={{ color: "var(--accent)", marginLeft: 6 }}>
                  · {selIds.length} sélectionné{selIds.length > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
          {/* Rows */}
          {filtered.map((c, i) => {
            const ini = ((c.nom[0] || "") + (c.prenom[0] || "")).toUpperCase();
            const isSel = selected.has(getClientId(c));
            return (
              <div
                key={getClientId(c)}
                onClick={() => onView(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  borderBottom:
                    i < filtered.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  background: isSel ? "rgba(232,93,36,.04)" : "var(--card)",
                  cursor: "pointer",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => {
                  if (!isSel) e.currentTarget.style.background = "var(--bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSel
                    ? "rgba(232,93,36,.04)"
                    : "var(--card)";
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSel}
                    onChange={(v) => toggleOne(getClientId(c), v)}
                  />
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: isSel ? "var(--accent-s)" : "var(--surface)",
                    color: isSel ? "var(--accent)" : "var(--muted)",
                    border: `1px solid ${isSel ? "var(--accent-b)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 600,
                    transition: "all .1s",
                  }}
                >
                  {ini || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.nom} {c.prenom}
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 11,
                      marginTop: 1,
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 10.5,
                      }}
                    >
                      {c.dossier}
                    </span>
                    {c.email && (
                      <>
                        <span style={{ opacity: 0.3 }}>·</span>
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge stage={c.stage} small />
                <div
                  style={{ display: "flex", gap: 3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Btn
                    v="icon"
                    onClick={() => setModal(c)}
                    aria-label="Modifier"
                  >
                    <Ico n="edit" size={14} />
                  </Btn>
                  <Btn
                    v="icon"
                    style={{ color: "#DC2626" }}
                    onClick={() => setDel(c)}
                    aria-label="Supprimer"
                  >
                    <Ico n="trash" size={14} />
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal && (
        <Modal
          title={
            modal === "new"
              ? "Nouveau client"
              : `Modifier — ${modal.nom} ${modal.prenom}`
          }
          onClose={() => setModal(null)}
        >
          <ClientForm
            initial={modal === "new" ? null : modal}
            clients={clients}
            onSave={save}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {del && (
        <ConfirmModal
          title="Supprimer le dossier"
          message={
            <>
              Supprimer définitivement <strong>{del.dossier}</strong> —{" "}
              {del.nom} {del.prenom} ? Cette action est irréversible.
            </>
          }
          onConfirm={async () => {
            try {
              await clientActions.deleteClient(getClientId(del));
              toast(`${del.nom} ${del.prenom} supprimé`, "error");
            } catch {
              toast("Erreur lors de la suppression", "error");
            }
          }}
          onClose={() => setDel(null)}
        />
      )}
      {bulkEdit && (
        <BulkEditModal
          ids={selIds}
          clients={clients}
          onSave={applyBulk}
          onClose={() => setBulkEdit(false)}
        />
      )}
      {bulkDel && (
        <ConfirmModal
          title="Supprimer la sélection"
          message={
            <>
              Supprimer <strong>{selIds.length} clients</strong> sélectionnés ?
              Action irréversible.
            </>
          }
          onConfirm={async () => {
            try {
              await Promise.all(
                selIds.map((c) => clientActions.deleteClient(getClientId(c)))
              );
              toast(`${selIds.length} dossier${selIds.length > 1 ? "s" : ""} supprimé${selIds.length > 1 ? "s" : ""}`, "error");
              clearSel();
            } catch {
              toast("Erreur lors de la suppression multiple", "error");
            }
          }}
          onClose={() => setBulkDel(false)}
        />
      )}
      {pasteModal && (
        <PasteImportModal
          clients={clients}
          onImport={addClient}
          onClose={() => setPasteModal(false)}
        />
      )}
    </div>
  );
}

function ClientForm({ initial, clients, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [f, setF] = useState(
    initial?.id
      ? initial
      : {
          dossier: genDos(clients),
          nom: "",
          prenom: "",
          email: "",
          tel: "",
          adresse: "",
          stage: "Attente document",
        },
  );
  const [errors, setErrors] = useState({});
  const s = (k) => (e) => {
    setF((p) => ({ ...p, [k]: sanitise(e.target.value) }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!f.nom?.trim()) e.nom = "Nom requis";
    if (f.email && !validEmail(f.email)) e.email = "E-mail invalide";
    if (f.tel && !validPhone(f.tel)) e.tel = "Téléphone invalide";
    // Duplicate email check (excluding self)
    if (f.email) {
      const dup = clients.find((c) => c.email === f.email && c.id !== f.id);
      if (dup) e.email = `E-mail déjà utilisé (${dup.dossier})`;
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(f);
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 14px",
        }}
      >
        <Fld label="N° Dossier">
          <Inp
            value={f.dossier}
            disabled
            style={{
              opacity: 0.5,
              fontFamily: "'DM Mono',monospace",
              fontSize: 12,
            }}
          />
        </Fld>
        <Fld label="Stade">
          <Sel value={f.stage} onChange={s("stage")}>
            {STAGES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Sel>
        </Fld>
        <Fld label="Nom" required>
          <Inp
            value={f.nom || ""}
            onChange={s("nom")}
            placeholder="Dupont"
            error={errors.nom}
            autoFocus
          />
        </Fld>
        <Fld label="Prénom">
          <Inp
            value={f.prenom || ""}
            onChange={s("prenom")}
            placeholder="Jean"
          />
        </Fld>
      </div>
      <Fld label="E-mail">
        <Inp
          type="email"
          value={f.email || ""}
          onChange={s("email")}
          placeholder="jean@exemple.fr"
          error={errors.email}
        />
      </Fld>
      <Fld label="Téléphone">
        <Inp
          value={f.tel || ""}
          onChange={s("tel")}
          placeholder="06 00 00 00 00"
          error={errors.tel}
        />
      </Fld>
      <Fld label="Adresse">
        <Inp
          value={f.adresse || ""}
          onChange={s("adresse")}
          placeholder="12 rue du Soleil, 75001 Paris"
        />
      </Fld>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          paddingTop: 4,
        }}
      >
        <Btn v="ghost" onClick={onClose}>
          Annuler
        </Btn>
        <Btn onClick={handleSave}>
          {isEdit ? "Enregistrer" : "Créer le dossier"}
        </Btn>
      </div>
    </>
  );
}

// ─── PanelCard (generic) ──────────────────────────────────────────────────────
function PanelCard({ client, record, fields, onSave, onViewClient, stageDot }) {
  const [f, setF] = useState(record || {});
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(true);
  const [savedAt, setSavedAt] = useState(null);
  const recStr = JSON.stringify(record);
  useEffect(() => {
    setF(record || {});
    setDirty(false);
  }, [recStr]);
  const toast = useToast();
  const set = useCallback(
    (k) => (e) => {
      setF((p) => ({ ...p, [k]: e.target.value }));
      setDirty(true);
    },
    [],
  );
  const dot = SDOT[client.stage] || stageDot || "#888";
  const handleSave = useCallback(() => {
    onSave(f);
    setDirty(false);
    setSavedAt(new Date());
    toast("Données enregistrées");
  }, [f, onSave, toast]);
  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${dirty ? "var(--accent-b)" : "var(--border)"}`,
        borderRadius: "var(--r)",
        boxShadow: "var(--sh)",
        overflow: "hidden",
        transition: "border-color .15s",
      }}
    >
      <CardHeader
        client={client}
        dot={dot}
        dirty={dirty}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onSave={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        onViewClient={onViewClient}
      />
      {open && (
        <div className="expand" style={{ padding: "13px 15px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))",
              gap: "0 12px",
            }}
          >
            {fields.map((field) => (
              <Fld key={field.key} label={field.label}>
                {field.type === "select" ? (
                  <Sel
                    value={f[field.key] || field.default || ""}
                    onChange={set(field.key)}
                  >
                    {!field.required && <option value="">—</option>}
                    {field.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Sel>
                ) : (
                  <Inp
                    type={field.type || "text"}
                    value={f[field.key] || ""}
                    onChange={set(field.key)}
                    placeholder={field.placeholder || ""}
                  />
                )}
              </Fld>
            ))}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "var(--hint)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {!dirty && (
              <>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: Object.values(f).some(Boolean)
                      ? "var(--green)"
                      : "var(--hint)",
                    display: "inline-block",
                  }}
                />
                {Object.values(f).some(Boolean)
                  ? "Données enregistrées"
                  : "Aucune donnée saisie"}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AutoPanel({
  clients,
  stageFilter,
  data,
  setData,
  fields,
  emptyMsg,
  onViewClient,
}) {
  const relevant = useMemo(
    () => (stageFilter ? clients.filter(stageFilter) : clients),
    [clients, stageFilter],
  );
  const getRecord = useCallback((id) => data[String(id)] || {}, [data]);
  const saveRecord = useCallback(
    (id, rec) => setData((d) => ({ ...d, [String(id)]: rec })),
    [setData],
  );
  if (!relevant.length)
    return <Empty icon="📭" msg={emptyMsg || "Aucun client à ce stade"} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {relevant.map((c) => (
        <PanelCard
          key={c.id}
          client={c}
          record={getRecord(c.id)}
          fields={fields}
          onSave={(rec) => saveRecord(c.id, rec)}
          onViewClient={onViewClient}
        />
      ))}
    </div>
  );
}

// ─── DP Section ───────────────────────────────────────────────────────────────
function DPCard({ client, record, onSave, onViewClient }) {
  const [f, setF] = useState(record || {});
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(true);
  const toast = useToast();
  const recStr = JSON.stringify(record);
  useEffect(() => {
    setF(record || {});
    setDirty(false);
  }, [recStr]);
  const dot = SDOT["Déclaration Préalable"];

  const set = useCallback(
    (k) => (e) => {
      const val = e.target.value;
      setF((p) => {
        const next = { ...p, [k]: val };
        const envoi = k === "dateEnvoi" ? val : p.dateEnvoi;
        const statut = k === "statut" ? val : p.statut;
        if (envoi)
          next.datePrev = addMonths(envoi, 1 + (statut === "ABF" ? 2 : 0));
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const handleSave = () => {
    onSave(f);
    setDirty(false);
    setSavedAt(new Date());
    toast("Déclaration enregistrée");
  };
  const sc = DP_C[f.statut] || "var(--muted)";
  const dpBadge = f.statut ? (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 20,
        background: sc + "18",
        color: sc,
        border: `1px solid ${sc}26`,
        whiteSpace: "nowrap",
      }}
    >
      {f.statut}
    </span>
  ) : null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${dirty ? "var(--accent-b)" : "var(--border)"}`,
        borderRadius: "var(--r)",
        boxShadow: "var(--sh)",
        overflow: "hidden",
        transition: "border-color .15s",
      }}
    >
      <CardHeader
        client={client}
        dot={dot}
        dirty={dirty}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onSave={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        onViewClient={onViewClient}
        extraBadge={dpBadge}
      />
      {open && (
        <div className="expand" style={{ padding: "13px 15px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))",
              gap: "0 12px",
            }}
          >
            <Fld label="N° DP">
              <Inp
                value={f.nDP || ""}
                onChange={set("nDP")}
                placeholder="DP 075 1xx xxxx x"
              />
            </Fld>
            <Fld label="Date d'envoi">
              <Inp
                type="date"
                value={f.dateEnvoi || ""}
                onChange={set("dateEnvoi")}
              />
            </Fld>
            <Fld label="Date prévisionnelle">
              <div style={{ position: "relative" }}>
                <Inp
                  type="date"
                  value={f.datePrev || ""}
                  readOnly
                  style={{
                    background: "var(--bg)",
                    color: f.datePrev ? "var(--text)" : "var(--hint)",
                    cursor: "not-allowed",
                    borderStyle: "dashed",
                  }}
                />
                {f.statut === "ABF" && f.datePrev && (
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#B45309",
                      background: "#FFFBEB",
                      padding: "1px 5px",
                      borderRadius: 4,
                      pointerEvents: "none",
                    }}
                  >
                    +2 mois ABF
                  </span>
                )}
              </div>
            </Fld>
            <Fld label="Statut">
              <Sel value={f.statut || ""} onChange={set("statut")}>
                <option value="">—</option>
                {DP_S.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Sel>
            </Fld>
          </div>
          {f.dateEnvoi && f.datePrev && (
            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: sc,
                  display: "inline-block",
                }}
              />
              Prévisionnelle calculée · {fmtDate(f.datePrev)}
              {f.statut === "ABF" && (
                <span style={{ color: "#B45309", fontWeight: 500 }}>
                  {" "}
                  — +2 mois ABF
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DPSection({ data, setData, clients, onViewClient }) {
  const relevant = useMemo(
    () => clients.filter((c) => c.stage === "Déclaration Préalable"),
    [clients],
  );
  if (!relevant.length)
    return <Empty icon="📭" msg="Aucun client en Déclaration Préalable" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {relevant.map((c) => (
        <DPCard
          key={c.id}
          client={c}
          record={data[String(c.id)] || {}}
          onSave={(rec) => setData((d) => ({ ...d, [String(c.id)]: rec }))}
          onViewClient={onViewClient}
        />
      ))}
    </div>
  );
}

// ─── Consuel Section ──────────────────────────────────────────────────────────
function ConsuelCard({ client, record, onSave, onViewClient }) {
  const [f, setF] = useState({ attestation: "Bleue", ...(record || {}) });
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(true);
  const toast = useToast();
  const recStr = JSON.stringify(record);
  useEffect(() => {
    setF({ attestation: "Bleue", ...(record || {}) });
    setDirty(false);
  }, [recStr]);
  const dot = SDOT["Consuel"];

  const set = useCallback(
    (k) => (e) => {
      const val = e.target.value;
      setF((p) => {
        const next = { ...p, [k]: val };
        const envoi = k === "dateEnvoi" ? val : p.dateEnvoi;
        const att = k === "attestation" ? val : p.attestation;
        if (envoi) next.datePrev = addDays(envoi, att === "Violette" ? 28 : 20);
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const handleSave = () => {
    onSave(f);
    setDirty(false);
    setSavedAt(new Date());
    toast("Consuel enregistré");
  };
  const sc = CONS_C[f.statut] || "var(--muted)";
  const ac = f.attestation === "Violette" ? "#7C3AED" : "#1D4ED8";
  const ab = f.attestation === "Violette" ? "#F5F3FF" : "#EFF6FF";

  const extra = (
    <>
      {f.statut && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 20,
            background: sc + "18",
            color: sc,
            border: `1px solid ${sc}26`,
            whiteSpace: "nowrap",
          }}
        >
          {f.statut}
        </span>
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 20,
          background: ab,
          color: ac,
          whiteSpace: "nowrap",
        }}
      >
        {f.attestation || "Bleue"}
      </span>
    </>
  );

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${dirty ? "var(--accent-b)" : "var(--border)"}`,
        borderRadius: "var(--r)",
        boxShadow: "var(--sh)",
        overflow: "hidden",
        transition: "border-color .15s",
      }}
    >
      <CardHeader
        client={client}
        dot={dot}
        dirty={dirty}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onSave={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        onViewClient={onViewClient}
        extraBadge={extra}
      />
      {open && (
        <div className="expand" style={{ padding: "13px 15px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))",
              gap: "0 12px",
            }}
          >
            <Fld label="Statut">
              <Sel value={f.statut || ""} onChange={set("statut")}>
                <option value="">—</option>
                {CONS_S.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Sel>
            </Fld>
            <Fld label="Attestation">
              <Sel
                value={f.attestation || "Bleue"}
                onChange={set("attestation")}
              >
                <option>Bleue</option>
                <option>Violette</option>
              </Sel>
            </Fld>
            <Fld label="Date d'envoi">
              <Inp
                type="date"
                value={f.dateEnvoi || ""}
                onChange={set("dateEnvoi")}
              />
            </Fld>
            <Fld label="Date prévisionnelle">
              <div style={{ position: "relative" }}>
                <Inp
                  type="date"
                  value={f.datePrev || ""}
                  readOnly
                  style={{
                    background: "var(--bg)",
                    color: f.datePrev ? "var(--text)" : "var(--hint)",
                    cursor: "not-allowed",
                    borderStyle: "dashed",
                  }}
                />
                {f.datePrev && (
                  <span
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 600,
                      color: ac,
                      background: ab,
                      padding: "1px 5px",
                      borderRadius: 4,
                      pointerEvents: "none",
                    }}
                  >
                    {f.attestation === "Violette" ? "4 sem." : "20 j."}
                  </span>
                )}
              </div>
            </Fld>
            <Fld label="Date visite">
              <Inp
                type="date"
                value={f.dateVisite || ""}
                onChange={set("dateVisite")}
              />
            </Fld>
            <Fld label="Consuel visé">
              <Inp
                type="date"
                value={f.dateVise || ""}
                onChange={set("dateVise")}
              />
            </Fld>
          </div>
          {f.dateEnvoi && f.datePrev && (
            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: ac,
                  display: "inline-block",
                }}
              />
              Prévisionnelle calculée · {fmtDate(f.datePrev)}
              <span style={{ color: ac, fontWeight: 500 }}>
                {" "}
                —{" "}
                {f.attestation === "Violette"
                  ? "Violette (+4 sem.)"
                  : "Bleue (+20 j.)"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConsuelSection({ data, setData, clients, onViewClient }) {
  const relevant = useMemo(
    () =>
      clients.filter((c) => c.stage === "Consuel" || c.stage === "PV Chantier"),
    [clients],
  );
  if (!relevant.length)
    return <Empty icon="📭" msg="Aucun client au stade Consuel" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {relevant.map((c) => (
        <ConsuelCard
          key={c.id}
          client={c}
          record={data[String(c.id)] || {}}
          onSave={(rec) => setData((d) => ({ ...d, [String(c.id)]: rec }))}
          onViewClient={onViewClient}
        />
      ))}
    </div>
  );
}

// ─── Raccordement ─────────────────────────────────────────────────────────────
const RACC_FIELDS = [
  { key: "dateDemande", label: "Date de la demande", type: "date" },
  { key: "dateMES", label: "Mise en service", type: "date" },
  {
    key: "lien",
    label: "Lien",
    type: "select",
    options: ["MyLight 150", "Enedis"],
    default: "MyLight 150",
  },
];
function RaccordSection({ data, setData, clients, onViewClient }) {
  return (
    <AutoPanel
      clients={clients}
      stageFilter={(c) => c.stage === "Raccordement"}
      data={data}
      setData={setData}
      fields={RACC_FIELDS}
      emptyMsg="Aucun client au stade Raccordement"
      onViewClient={onViewClient}
    />
  );
}

// ─── DAACT ────────────────────────────────────────────────────────────────────
const DAACT_FIELDS = [
  { key: "dateEnvoi", label: "Date d'envoi", type: "date" },
  {
    key: "lienMairie",
    label: "Lien mairie",
    placeholder: "https://mairie.fr/...",
  },
];
function DAACTSection({ data, setData, clients, onViewClient }) {
  return (
    <AutoPanel
      clients={clients}
      stageFilter={(c) => c.stage === "DAACT"}
      data={data}
      setData={setData}
      fields={DAACT_FIELDS}
      emptyMsg="Aucun client au stade DAACT"
      onViewClient={onViewClient}
    />
  );
}

// ─── Installation (manual) ────────────────────────────────────────────────────
function InstallSection({ data, setData, clients, onViewClient }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ clientId: "", dateInstall: "" });
  const [formErr, setFormErr] = useState({});
  const [del, setDel] = useState(null);
  const entries = useMemo(
    () => Object.entries(data).map(([id, rec]) => ({ id, rec })),
    [data],
  );

  const save = () => {
    const e = {};
    if (!form.clientId) e.clientId = "Sélectionner un client";
    if (!form.dateInstall) e.dateInstall = "Date requise";
    setFormErr(e);
    if (Object.keys(e).length) return;
    setData((d) => ({
      ...d,
      [form.clientId]: { dateInstall: form.dateInstall },
    }));
    setForm({ clientId: "", dateInstall: "" });
    setModal(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 14,
        }}
      >
        <Btn ico="plus" onClick={() => setModal(true)}>
          Ajouter une installation
        </Btn>
      </div>
      {!entries.length ? (
        <Empty
          icon="🔧"
          msg="Aucune date d'installation saisie"
          sub="Saisie manuelle uniquement"
        />
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            boxShadow: "var(--sh)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Client", "Dossier", "Date d'installation", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "9px 14px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(({ id, rec }, i) => {
                const c = clients.find((x) => String(x.id) === String(id));
                return (
                  <tr
                    key={id}
                    style={{
                      borderBottom:
                        i < entries.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {c ? (
                        `${c.nom} ${c.prenom}`
                      ) : (
                        <span style={{ color: "var(--hint)" }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 12,
                        fontFamily: "'DM Mono',monospace",
                        color: "var(--muted)",
                      }}
                    >
                      {c?.dossier || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>
                      {fmtDate(rec.dateInstall)}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        {c && (
                          <Btn v="icon" onClick={() => onViewClient(c)}>
                            <Ico n="edit" size={14} />
                          </Btn>
                        )}
                        <Btn
                          v="icon"
                          style={{ color: "#DC2626" }}
                          onClick={() => setDel(id)}
                        >
                          <Ico n="trash" size={14} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal
          title="Nouvelle installation"
          onClose={() => setModal(false)}
          w={400}
        >
          <Fld label="Client" required>
            <Sel
              value={form.clientId}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientId: e.target.value }))
              }
              error={formErr.clientId}
            >
              <option value="">— Sélectionner —</option>
              {clients.map((c) => (
                <option key={getClientId(c)} value={getClientId(c)}>
                  {c.dossier} — {c.nom} {c.prenom}
                </option>
              ))}
            </Sel>
          </Fld>
          <Fld label="Date d'installation" required>
            <Inp
              type="date"
              value={form.dateInstall}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateInstall: e.target.value }))
              }
              error={formErr.dateInstall}
            />
          </Fld>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              paddingTop: 4,
            }}
          >
            <Btn v="ghost" onClick={() => setModal(false)}>
              Annuler
            </Btn>
            <Btn onClick={save}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
      {del && (
        <ConfirmModal
          title="Supprimer"
          message="Supprimer cette entrée d'installation ?"
          onConfirm={() =>
            setData((d) => {
              const n = { ...d };
              delete n[del];
              return n;
            })
          }
          onClose={() => setDel(null)}
        />
      )}
    </div>
  );
}

// ─── Finalisé ─────────────────────────────────────────────────────────────────
function FinalSection({ clients, onViewClient }) {
  const done = useMemo(
    () => clients.filter((c) => c.stage === "DAACT"),
    [clients],
  );
  if (!done.length)
    return (
      <Empty
        icon="🎉"
        msg="Aucun dossier finalisé"
        sub="Les dossiers au stade DAACT apparaîtront ici"
      />
    );
  return (
    <div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "14px 16px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "var(--sh)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {done.length} dossier{done.length > 1 ? "s" : ""} finalisé
            {done.length > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {/* pct et total doivent être définis */}
          </div>
        </div>
        {/* Progress bar */}
        <div
          style={{
            width: 160,
            height: 6,
            borderRadius: 3,
            background: "var(--bg)",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              background: "var(--green)",
              width: `0%`,
              transition: "width .4s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--green)",
            minWidth: 36,
            textAlign: "right",
          }}
        >
          0%
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {done.map((c) => (
          <div
            key={c.id}
            onClick={() => onViewClient(c)}
            style={{
              background: "var(--card)",
              border: "1px solid rgba(22,163,74,.18)",
              borderLeft: "3px solid var(--green)",
              borderRadius: "var(--r)",
              padding: "11px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              boxShadow: "var(--sh)",
              transition: "box-shadow .12s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "var(--sh-md)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "var(--sh)")
            }
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--green-s)",
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {((c.nom[0] || "") + (c.prenom[0] || "")).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                {c.nom} {c.prenom}
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 11,
                  fontFamily: "'DM Mono',monospace",
                  marginTop: 1,
                }}
              >
                {c.dossier}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--green)",
                fontWeight: 600,
                background: "var(--green-s)",
                padding: "3px 10px",
                borderRadius: 20,
                border: "1px solid rgba(22,163,74,.2)",
              }}
            >
              Finalisé
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
// ─── Dark mode toggle ────────────────────────────────────────────────────────
function DarkModeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Mode clair (Ctrl+Shift+D)" : "Mode sombre (Ctrl+Shift+D)"}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "var(--surface)",
        border: "1px solid var(--border-em)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--muted)",
        flexShrink: 0,
        transition: "background .12s,color .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface)";
        e.currentTarget.style.color = "var(--muted)";
      }}
    >
      {dark ? (
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function EversunApp() {
  // Hook useApiData pour les clients - DÉCLARÉ EN PREMIER
  const [clients, setClients, clientsLoading, clientsError, clientActions] = useApiData('evs_clients', []);

  // Charger les clients depuis l'API au montage
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/clients")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des clients");
        return res.json();
      })
      .then((data) => {
        setClients(data);
      })
      .catch(() => {
        toast("Impossible de charger les clients", "error");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Ajouter un client via l'API
  const addClient = async (client) => {
    setIsLoading(true);
    try {
      const saved = await clientActions.addClient(client);
      toast(`Dossier ${saved.dossier} créé`, "success");
    } catch (e) {
      toast("Erreur lors de l'ajout du client", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const [page, setPage] = useState("clients");
  const [mini, setMini] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewC, setViewC] = useState(null);
  const [dpData, setDpData] = useState({});
  const [consuelData, setConsuelData] = useState({});
  const [raccordData, setRaccordData] = useState({});
  const [daactData, setDaactData] = useState({});
  const [installData, setInstallData] = useState({});
  const { dark, toggle: toggleTheme } = useTheme();
  const toast = useToast();

  // Comptage des éléments par page pour le badge de navigation
  const counts = useMemo(
    () => ({
      clients: clients.length,
      declaration: clients.filter((c) => c.stage === "Déclaration Préalable")
        .length,
      installation: Object.keys(installData).length,
      consuel: clients.filter(
        (c) => c.stage === "Consuel" || c.stage === "PV Chantier",
      ).length,
      raccordement: clients.filter((c) => c.stage === "Raccordement").length,
      daact: clients.filter((c) => c.stage === "DAACT").length,
      finalise: clients.filter((c) => c.stage === "DAACT").length,
    }),
    [clients, installData],
  );

  // Navigation courante
  const curNav = useMemo(() => NAV.find((n) => n.id === page), [page]);

  // Date du jour formatée
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Gestion du détail client (fiche)
  const handleClientSave = useCallback(
    async (updated) => {
      try {
        const clientId = getClientId(updated);
        await clientActions.updateClient(clientId, updated);
        toast(`Client ${updated.nom} ${updated.prenom} mis à jour`, "success");
      } catch (err) {
        toast("Erreur lors de la mise à jour du client", "error");
        console.error("Update error:", err);
      }
    },
    [clientActions],
  );
  const handleClientClose = useCallback(() => setViewC(null), []);

  // Mapping des pages vers les sections/contenus
  const CONTENT = useMemo(
    () => ({
      clients: (
        <ClientsSection
          clients={clients}
          addClient={addClient}
          onView={setViewC}
          clientActions={clientActions}
        />
      ),
      declaration: (
        <DPSection
          data={dpData}
          setData={setDpData}
          clients={clients}
          onViewClient={setViewC}
        />
      ),
      installation: (
        <InstallSection
          data={installData}
          setData={setInstallData}
          clients={clients}
          onViewClient={setViewC}
        />
      ),
      consuel: (
        <ConsuelSection
          data={consuelData}
          setData={setConsuelData}
          clients={clients}
          onViewClient={setViewC}
        />
      ),
      raccordement: (
        <RaccordSection
          data={raccordData}
          setData={setRaccordData}
          clients={clients}
          onViewClient={setViewC}
        />
      ),
      daact: (
        <DAACTSection
          data={daactData}
          setData={setDaactData}
          clients={clients}
          onViewClient={setViewC}
        />
      ),
      finalise: <FinalSection clients={clients} onViewClient={setViewC} />,
    }),
    [clients, dpData, installData, consuelData, raccordData, daactData],
  );

  return (
    <>
      <style>{CSS}</style>
      <NetworkStatus />
      <Loader visible={isLoading} />
      <ScrollToTopButton />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: mini ? 52 : "var(--sidebar)",
            minWidth: mini ? 52 : "var(--sidebar)",
            background: "var(--card)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            transition:
              "width .2s cubic-bezier(.22,1,.36,1),min-width .2s cubic-bezier(.22,1,.36,1)",
            overflow: "hidden",
            zIndex: 10,
            maxWidth: "100vw",
          }}
          role="navigation"
          aria-label="Navigation principale"
        >
          {/* Logo */}
          <div
            style={{
              height: 54,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              padding: mini ? "0" : "0 14px",
              justifyContent: mini ? "center" : "flex-start",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  flexShrink: 0,
                  background:
                    "linear-gradient(140deg,#E85D24 10%,#FBBF24 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
                aria-hidden="true"
              >
                <Ico n="sun" size={14} sw={1.8} />
              </div>
              {!mini && (
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14.5,
                    letterSpacing: "-.025em",
                  }}
                >
                  Eversun
                </span>
              )}
            </div>
          </div>
          {/* Nav items */}
          <nav
            style={{
              flex: 1,
              padding: "8px 6px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {NAV.map((item) => {
              const active = page === item.id;
              const cnt = counts[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  title={mini ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: mini ? "9px 0" : "8px 10px",
                    justifyContent: mini ? "center" : "flex-start",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--accent-s)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    transition: "background .12s,color .12s",
                    fontFamily: "'DM Sans',sans-serif",
                    whiteSpace: "nowrap",
                    marginBottom: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--bg)";
                      e.currentTarget.style.color = "var(--text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = active
                      ? "var(--accent-s)"
                      : "transparent";
                    e.currentTarget.style.color = active
                      ? "var(--accent)"
                      : "var(--muted)";
                  }}
                >
                  <span
                    style={{ flexShrink: 0, display: "flex", color: "inherit" }}
                  >
                    <Ico n={item.icon} />
                  </span>
                  {!mini && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!mini && cnt > 0 && (
                    <span
                      style={{
                        background: active
                          ? "var(--accent)"
                          : "rgba(0,0,0,.08)",
                        color: active ? "#fff" : "var(--muted)",
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontSize: 11,
                        fontWeight: 600,
                        minWidth: 20,
                        textAlign: "center",
                        lineHeight: "18px",
                      }}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {/* Collapse */}
          <div
            style={{ padding: "8px 6px", borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setMini((m) => !m)}
              aria-label={mini ? "Développer le menu" : "Réduire le menu"}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: mini ? "9px" : "7px",
                borderRadius: 8,
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--hint)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all .12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <Ico n={mini ? "chevR" : "chevL"} size={14} />
              {!mini && <span>Réduire</span>}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
            maxWidth: "100vw",
          }}
        >
          <header
            style={{
              height: 54,
              flexShrink: 0,
              background: "var(--card)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              padding: "0 5vw",
              gap: 12,
              minWidth: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {curNav?.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--hint)", marginTop: 2 }}>
                {today}
              </div>
            </div>
            <DarkModeToggle />
            <span
              style={{
                background: "var(--accent-s)",
                color: "var(--accent)",
                border: "1px solid var(--accent-b)",
                borderRadius: 20,
                padding: "4px 11px",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {clients.length} dossier{clients.length !== 1 ? "s" : ""}
            </span>
          </header>
          <main
            key={page}
            className="pg"
            role="main"
            aria-label={curNav?.label}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "22px 4vw",
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
              {CONTENT[page]}
            </div>
          </main>
        </div>
      </div>

      {viewC && (
        <ClientDetail
          client={viewC}
          onSave={handleClientSave}
          onClose={handleClientClose}
        />
      )}
      <div
        style={{
          position: "fixed",
          bottom: 8,
          left: mini ? 62 : 8,
          fontSize: 9.5,
          color: "var(--border-em)",
          pointerEvents: "none",
          letterSpacing: ".04em",
          fontFamily: "'DM Mono',monospace",
          zIndex: 1,
          transition: "left .2s",
        }}
      >
        EVERSUN v2
      </div>
    </>
  );
}

export default function Eversun() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EversunApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
