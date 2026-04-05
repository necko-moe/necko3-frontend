export interface ExportCardLabels {
  scanToPay: string;
  invoice: string;
  address: string;
  created: string;
  expires: string;
}

export interface ExportCardParams {
  theme: "light" | "dark";
  qrImageUrl: string;
  amount: string;
  token: string;
  network: string;
  invoiceId: string;
  address: string;
  createdFormatted: string;
  expiresFormatted: string;
  expiresRelative: string | null;
  paymentLink: string;
  labels: ExportCardLabels;
}

const SANS =
  "'Geist Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO =
  "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Fira Code', Consolas, monospace";

interface Palette {
  bg: string;
  text: string;
  muted: string;
  primary: string;
  primaryFg: string;
  divider: string;
}

const LIGHT: Palette = {
  bg: "#faf0e7",        // warm-cream  = --card
  text: "#40372e",      // warm-bark   = --card-foreground
  muted: "#9b9089",     // warm-stone  = --muted-foreground
  primary: "#2a526a",   // cool-deep   = --primary
  primaryFg: "#ffffff",
  divider: "#c6beb7",   // warm-sand   = --border
};

const DARK: Palette = {
  bg: "#1e1a16",        // warm-cream  = --card
  text: "#ede5dc",      // warm-bark   = --card-foreground
  muted: "#a09588",     // warm-stone  = --muted-foreground
  primary: "#9acad6",   // cool-deep   = --primary
  primaryFg: "#1e1a16", // warm-cream  = --primary-foreground
  divider: "#413a34",   // warm-sand   = --border
};

function esc(s: string): string {
  const el = document.createElement("span");
  el.textContent = s;
  return el.innerHTML;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const side = Math.floor((max - 1) / 2);
  return `${value.slice(0, side)}\u2026${value.slice(-side)}`;
}

function infoRow(
  c: Palette,
  label: string,
  value: string,
  opts?: { mono?: boolean; sub?: string },
): string {
  const ff = opts?.mono ? MONO : SANS;
  const sub = opts?.sub
    ? `<div style="font-size:11px;color:${c.muted};margin-top:1px">${esc(opts.sub)}</div>`
    : "";
  return `
    <div style="display:flex;align-items:baseline;gap:12px">
      <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${c.muted};width:72px;flex-shrink:0">${esc(label)}</span>
      <div style="display:flex;flex-direction:column;min-width:0;flex:1">
        <span style="font-size:13px;font-family:${ff};color:${c.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(value)}</span>
        ${sub}
      </div>
    </div>`;
}

export function buildExportCard(p: ExportCardParams): HTMLDivElement {
  const c = p.theme === "dark" ? DARK : LIGHT;
  const wrapper = document.createElement("div");

  wrapper.innerHTML = `
<div style="width:480px;background-color:${c.bg};font-family:${SANS};color:${c.text};padding:40px 48px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center">

  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
    <div style="width:28px;height:28px;border-radius:6px;background-color:${c.primary};color:${c.primaryFg};font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1;font-family:${SANS}">N3</div>
    <span style="font-size:18px;font-weight:600;letter-spacing:-0.02em;color:${c.text}">necko3</span>
  </div>

  <div style="width:280px;height:280px;border-radius:12px;overflow:hidden;flex-shrink:0"><img src="${p.qrImageUrl}" width="280" height="280" style="display:block" /></div>

  <p style="font-size:13px;color:${c.muted};margin:20px 0 4px">${esc(p.labels.scanToPay)}</p>
  <p style="font-size:28px;font-weight:700;letter-spacing:-0.02em;margin:0;line-height:1.2;color:${c.text}">${esc(p.amount)} ${esc(p.token)}</p>
  <p style="font-size:14px;color:${c.muted};margin:4px 0 0">${esc(p.network)}</p>

  <div style="width:100%;height:1px;background-color:${c.divider};margin:20px 0;opacity:0.6"></div>

  <div style="width:100%;display:flex;flex-direction:column;gap:10px">
    ${infoRow(c, p.labels.invoice, truncate(p.invoiceId, 32), { mono: true })}
    ${infoRow(c, p.labels.address, truncate(p.address, 32), { mono: true })}
    ${infoRow(c, p.labels.created, p.createdFormatted)}
    ${infoRow(c, p.labels.expires, p.expiresFormatted, { sub: p.expiresRelative ?? undefined })}
  </div>

  <p style="font-size:11px;font-family:${MONO};color:${c.muted};margin:20px 0 0;text-align:center;word-break:break-all;line-height:1.5">${esc(p.paymentLink)}</p>

</div>`;

  return wrapper.firstElementChild as HTMLDivElement;
}
