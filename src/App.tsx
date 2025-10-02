import React, { useEffect, useMemo, useRef, useState } from "react";

/* ===================== 共通ユーティリティ ===================== */
const NL = "\n";
const lines = (s: string) =>
  (s || "")
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);
const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const li = (arr: string[]) =>
  arr.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const arrayMove = <T,>(arr: T[], from: number, to: number) => {
  const copy = arr.slice();
  const f = clamp(from, 0, copy.length - 1);
  const t = clamp(to, 0, copy.length - 1);
  if (f === t) return copy;
  const [item] = copy.splice(f, 1);
  copy.splice(t, 0, item);
  return copy;
};

/* ===================== 型 ===================== */
type Theme = {
  bg: string;
  panel: string;
  ink: string;
  titleColor: string; // h1
  subtitleColor: string; // サブタイトル
  headingColor: string; // h2/h3/summary
  underlineColor: string; // 斜線
  tableAltRow: string; // 交互行背景
  tableAltInk: string; // 交互行文字
  nestedBg: string; // プルダウン中身
};

type Stat = { name: string; value: string };
type Child = { title: string; bodyText: string };
type PD = { title: string; children: Child[] };
type MiniSection = { title: string; itemsText: string };
type MemoPanel = { title: string; body: string };

type SavePayload = {
  title: string;
  subtitle: string;
  stats: Stat[];
  imageText: string;
  memoPanels: MemoPanel[];
  miniSections: MiniSection[];
  pulldowns: PD[];
  theme: Theme;
};
type SaveFile = {
  schema: "char-page-gen";
  version: number; // v1 or v2 (互換のため)
  payload: any;
};

const SCHEMA_VERSION = 2;

/* ===================== テーマプリセット（5種） ===================== */
const THEME_PRESETS: Record<string, Theme> = {
  /* 🐑 ふわふわ黒鼻羊（白黒逆転・紙っぽい） */
  FuzzyBlackSheep: {
    bg: "#f5f5f5",
    panel: "#ffffff",
    ink: "#0d0d0d",
    titleColor: "#111111",
    subtitleColor: "#333333",
    headingColor: "#000000",
    underlineColor: "#666666",
    tableAltRow: "rgba(0,0,0,0.8)",
    tableAltInk: "#ffffff",
    nestedBg: "#eeeeee",
  },

  /* 🐈 緑の目のキジトラ猫（アース＋エメラルド） */
  GreenEyedTabby: {
    bg: "#121614",
    panel: "#1e2723",
    ink: "#d9e6d5",
    titleColor: "#7fff94",
    subtitleColor: "#9ab59f",
    headingColor: "#b4e1b0",
    underlineColor: "#4ade80",
    tableAltRow: "rgba(126,163,138,0.25)",
    tableAltInk: "#e6f5e6",
    nestedBg: "#2b3630",
  },

  /* 🦈 深海のラブカ（濃紺＋深紅アクセント） */
  DeepseaFrilledShark: {
    bg: "#06080d",
    panel: "#101620",
    ink: "#e5ecf5",
    titleColor: "#ff6384",
    subtitleColor: "#9fb0c6",
    headingColor: "#e8a3b3",
    underlineColor: "#f87171",
    tableAltRow: "rgba(255,255,255,0.08)",
    tableAltInk: "#e9f0fa",
    nestedBg: "#19212f",
  },

  /* 🐇 お月見うさぎ（夜空の紫＋金色の月） */
  MoonViewingRabbit: {
    bg: "#1b1a28",
    panel: "#2a2838",
    ink: "#fdfcf7",
    titleColor: "#ffd966",
    subtitleColor: "#f0e9c8",
    headingColor: "#ffe79e",
    underlineColor: "#ffed4a",
    tableAltRow: "rgba(255,255,255,0.08)",
    tableAltInk: "#fff8dc",
    nestedBg: "#3c384a",
  },

  /* 🐦 いっぴきカラス（黒＋群青のひかり） */
  LoneCrow: {
    bg: "#0a0a0f",
    panel: "#15151d",
    ink: "#f1f1f1",
    titleColor: "#8c9eff",
    subtitleColor: "#b0b7d9",
    headingColor: "#c3caff",
    underlineColor: "#6366f1",
    tableAltRow: "rgba(140,158,255,0.15)",
    tableAltInk: "#e6e9ff",
    nestedBg: "#1e1e2a",
  },
};

/* ===================== 本体 ===================== */
export default function App() {
  /* ---------------- タイトル等 ---------------- */
  const [title, setTitle] = useState("タイトル");
  const [subtitle, setSubtitle] = useState("サブタイトル");

  /* ---------------- ステータス（配列：名前編集OK） ---------------- */
  /* ---------------- ステータス（配列：名前編集OK） ---------------- */
  const [stats, setStats] = useState<Stat[]>([
    { name: "年齢", value: "n" },
    { name: "性別", value: "n" },
    { name: "職業", value: "n" },
    { name: "身長", value: "n" },
    { name: "出身", value: "n" },
  ]);

  /* ---------------- 画像（改行区切り） ---------------- */
  const [imageText, setImageText] = useState(
    [
      "https://picsum.photos/seed/1/800/1200",
      "https://picsum.photos/seed/2/800/1200",
    ].join(NL)
  );
  const images = useMemo(() => lines(imageText), [imageText]);

  /* ---------------- 上段パネル（メモ）複数 ---------------- */
  const [memoPanels, setMemoPanels] = useState<MemoPanel[]>([
    { title: "上のパネル", body: "ここに自由にテキストを記述できます。" },
  ]);
  const addMemo = () =>
    setMemoPanels((prev) => [...prev, { title: "上のパネル", body: "" }]);
  const updateMemo = (i: number, patch: Partial<MemoPanel>) =>
    setMemoPanels((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
    );
  const removeMemo = (i: number) =>
    setMemoPanels((prev) => prev.filter((_, idx) => idx !== i));
  const moveMemo = (i: number, dir: -1 | 1) =>
    setMemoPanels((prev) => arrayMove(prev, i, i + dir));

  /* ---------------- 小タイトル（可変＋並べ替え） ---------------- */
  const [miniSections, setMiniSections] = useState<MiniSection[]>([
    { title: "小タイトルA", itemsText: "内容A1\n内容A2" },
    { title: "小タイトルB", itemsText: "内容B1\n内容B2" },
  ]);
  const addMini = () =>
    setMiniSections((prev) => [
      ...prev,
      { title: "小タイトル", itemsText: "" },
    ]);
  const updateMini = (i: number, patch: Partial<MiniSection>) =>
    setMiniSections((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
    );
  const removeMini = (i: number) =>
    setMiniSections((prev) => prev.filter((_, idx) => idx !== i));
  const moveMini = (i: number, dir: -1 | 1) =>
    setMiniSections((prev) => arrayMove(prev, i, i + dir));

  /* ---------------- プルダウン（外側→入れ子複数＋並べ替え） ---------------- */
  const [pulldowns, setPulldowns] = useState<PD[]>([
    {
      title: "プルダウン",
      children: [
        { title: "プルダウン", bodyText: "内容1\n内容2" },
        { title: "プルダウン", bodyText: "内容A\n内容B" },
      ],
    },
  ]);
  const addPulldown = () =>
    setPulldowns((prev) => [...prev, { title: "プルダウン", children: [] }]);
  const updatePulldown = (i: number, patch: Partial<PD>) =>
    setPulldowns((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );
  const removePulldown = (i: number) =>
    setPulldowns((prev) => prev.filter((_, idx) => idx !== i));
  const movePulldown = (i: number, dir: -1 | 1) =>
    setPulldowns((prev) => arrayMove(prev, i, i + dir));
  const addChild = (pi: number) =>
    setPulldowns((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? {
              ...p,
              children: [...p.children, { title: "プルダウン", bodyText: "" }],
            }
          : p
      )
    );
  const updateChild = (pi: number, ci: number, patch: Partial<Child>) =>
    setPulldowns((prev) =>
      prev.map((p, idx) => {
        if (idx !== pi) return p;
        const children = p.children.map((c, j) =>
          j === ci ? { ...c, ...patch } : c
        );
        return { ...p, children };
      })
    );
  const removeChild = (pi: number, ci: number) =>
    setPulldowns((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? { ...p, children: p.children.filter((_, j) => j !== ci) }
          : p
      )
    );
  const moveChild = (pi: number, ci: number, dir: -1 | 1) =>
    setPulldowns((prev) =>
      prev.map((p, idx) =>
        idx === pi ? { ...p, children: arrayMove(p.children, ci, ci + dir) } : p
      )
    );

  /* ---------------- テーマ（プリセット＋手動） ---------------- */
  const [theme, setTheme] = useState<Theme>(THEME_PRESETS.FuzzyBlackSheep);
  const [presetKey, setPresetKey] =
    useState<keyof typeof THEME_PRESETS>("FuzzyBlackSheep");
  const applyPreset = () => setTheme(THEME_PRESETS[presetKey]);

  /* ---------------- JSON 保存/読み込み（v1互換） ---------------- */
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildPayload = (): SavePayload => ({
    title,
    subtitle,
    stats,
    imageText,
    memoPanels,
    miniSections,
    pulldowns,
    theme,
  });

  const handleExportJSON = () => {
    const data: SaveFile = {
      schema: "char-page-gen",
      version: SCHEMA_VERSION,
      payload: buildPayload(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `char-page-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyLoadedPayload = (p: any) => {
    setTitle(p.title ?? "タイトル");
    setSubtitle(p.subtitle ?? "サブタイトル");

    // v1互換: Record<string,string> を配列に変換
    if (Array.isArray(p.stats)) {
      setStats(p.stats);
    } else if (p.stats && typeof p.stats === "object") {
      const arr: Stat[] = Object.entries(p.stats).map(([name, value]) => ({
        name,
        value: String(value ?? ""),
      }));
      setStats(arr);
    } else {
      setStats([]);
    }

    setImageText(p.imageText ?? "");

    if (Array.isArray(p.memoPanels)) {
      setMemoPanels(p.memoPanels);
    } else if (
      typeof p.memoTitle === "string" ||
      typeof p.memoBody === "string"
    ) {
      setMemoPanels([
        { title: p.memoTitle ?? "上のパネル", body: p.memoBody ?? "" },
      ]); // v1
    } else {
      setMemoPanels([{ title: "上のパネル", body: "" }]);
    }

    setMiniSections(Array.isArray(p.miniSections) ? p.miniSections : []);
    setPulldowns(Array.isArray(p.pulldowns) ? p.pulldowns : []);
    setTheme(p.theme ?? THEME_PRESETS.FuzzyBlackSheep);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SaveFile>;
      if (parsed?.schema !== "char-page-gen")
        throw new Error("スキーマ不一致です。");
      if (typeof parsed.version !== "number" || !parsed.payload)
        throw new Error("バージョン/ペイロードが不正です。");
      applyLoadedPayload(parsed.payload);
      alert("JSONを読み込みました！");
    } catch (err) {
      console.error(err);
      alert("読み込みに失敗しました。ファイル形式をご確認ください。");
    } finally {
      e.target.value = "";
    }
  };

  /* ---------------- 出力HTML（CSS/JS内蔵） ---------------- */
  const generatedHTML = useMemo(() => {
    const statsRows = stats
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(
            s.value
          )}</td></tr>`
      )
      .join("\n");

    const sliderImgs = images
      .map(
        (url, i) =>
          `<img class="mainimg${i === 0 ? " active" : ""}" src="${escapeHtml(
            url
          )}" alt="立ち絵${i + 1}">`
      )
      .join("\n");

    const miniHTML = miniSections
      .map(
        (ms) =>
          `<div><h3>${escapeHtml(ms.title)}</h3><ul>${li(
            lines(ms.itemsText)
          )}</ul></div>`
      )
      .join("\n");

    const memoHTML = memoPanels
      .map(
        (mp) =>
          `<section class="panel"><h2>${escapeHtml(
            mp.title
          )}</h2><p>${escapeHtml(mp.body)}</p></section>`
      )
      .join("\n");

    const pulldownHTML = pulldowns
      .map((pd) => {
        const children = (pd.children || [])
          .map(
            (ch) => `
        <details class="details nested">
          <summary><span class="caret">▼</span> ${escapeHtml(
            ch.title
          )}</summary>
          <div class="nested-content">
            <ul>${li(lines(ch.bodyText))}</ul>
          </div>
        </details>`
          )
          .join("\n");
        return `
      <details class="details">
        <summary><span class="caret">▼</span> ${escapeHtml(pd.title)}</summary>
${children}
      </details>`;
      })
      .join("\n");

    const EMBED_CSS = `
:root{
  --bg:${theme.bg}; --panel:${theme.panel}; --ink:${theme.ink};
  --title-color:${theme.titleColor}; --subtitle-color:${theme.subtitleColor};
  --heading-color:${theme.headingColor}; --underline-color:${theme.underlineColor};
  --table-alt:${theme.tableAltRow}; --table-alt-ink:${theme.tableAltInk};
  --nested-bg:${theme.nestedBg};
  --radius-xl:24px; --shadow:0 10px 30px rgba(0,0,0,.3);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,"Noto Sans JP","Hiragino Kaku Gothic ProN",Meiryo,Arial,sans-serif}
.container{max-width:1200px;margin:0 auto;padding:24px 16px 64px}

/* 見出し */
h1{font-size:clamp(32px,5vw,48px);margin:0 0 6px;font-weight:900;color:var(--title-color)}
.subtitle{font-weight:700;font-size:clamp(18px,2.5vw,24px);margin:0 0 20px;color:var(--subtitle-color)}
.underline{
  display:inline-block; padding-bottom:6px; padding-right:10px;
  background-image:repeating-linear-gradient(-45deg,var(--underline-color),var(--underline-color) 6px,transparent 6px,transparent 12px);
  background-repeat:repeat-x; background-size:12px 12px; background-position:0 100%;
}

/* レイアウト：表1 : 画像2 */
.grid-2{display:grid;gap:24px}
@media(min-width:1024px){ .grid-2{grid-template-columns:1fr 2fr} }

.card{background:var(--panel);border-radius:var(--radius-xl);box-shadow:var(--shadow);padding:24px}
.panel{background:var(--panel);color:var(--ink);border-radius:48px;box-shadow:var(--shadow);padding:24px;margin-top:40px}

/* パネル見出し色 */
.panel h2,.panel h3{color:var(--heading-color)}
.panel h3{margin:0 0 8px;font-size:22px;font-weight:900}

/* 表（固定値） */
table{width:220px;margin:auto;border-collapse:collapse;font-size:18px;color:var(--ink)}
thead th{background:var(--panel);padding:8px;text-align:left;border-bottom:1px solid #444}
tbody td{padding:8px;border-bottom:1px solid #333}
tbody tr:nth-child(odd){background: var(--table-alt); color: var(--table-alt-ink)}
.card table{margin-top:16px}

/* 画像スライダー */
.slider{position:relative;height:700px;display:flex;align-items:center;justify-content:center}
.mainimg{max-height:100%;max-width:100%;object-fit:contain;border-radius:18px;display:none}
.mainimg.active{display:block}
.navbtn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border:none;border-radius:9999px;color:#fff;background:rgba(0,0,0,.6);font-size:26px;cursor:pointer}
.navbtn.prev{left:8px}.navbtn.next{right:8px}
.thumbs{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);display:flex;gap:8px}
.thumb{width:60px;height:60px;border-radius:10px;overflow:hidden;border:3px solid transparent;cursor:pointer}
.thumb img{width:100%;height:100%;object-fit:cover}
.thumb.active{border-color:var(--title-color)}
@media(max-width:768px){ .slider{height:420px} }

/* 小タイトル 1:1 */
.panel-grid{display:grid;gap:24px}
@media(min-width:768px){ .panel-grid{grid-template-columns:1fr 1fr} }

/* プルダウン */
.details summary{cursor:pointer;list-style:none;display:flex;gap:10px;font-weight:900;font-size:20px;color:var(--heading-color)}
.details summary::-webkit-details-marker{display:none}
.caret{font-size:20px}
.details.nested{margin-left:20px;margin-top:12px}
.nested-content{margin-top:10px;background: var(--nested-bg);border-radius:16px;padding:12px;max-height:240px;overflow:auto}
`.trim();

    const EMBED_JS = `
(() => {
  const slider = document.getElementById('slider');
  if (!slider) return;
  const prev = slider.querySelector('.navbtn.prev');
  const next = slider.querySelector('.navbtn.next');
  const imgs = [...slider.querySelectorAll('.mainimg')];
  const thumbs = slider.querySelector('.thumbs');
  let idx = imgs.findIndex(img => img.classList.contains('active'));
  if (idx < 0) idx = 0;

  // サムネ生成
  imgs.forEach((img,i)=>{
    const b=document.createElement('button');
    b.className='thumb';
    b.innerHTML='<img alt="thumb'+(i+1)+'" src="'+img.src+'">';
    b.onclick=()=>{ idx=i; render(); };
    thumbs.appendChild(b);
  });

  function render(){
    imgs.forEach((el,i)=>el.classList.toggle('active', i===idx));
    [...thumbs.children].forEach((el,i)=>el.classList.toggle('active', i===idx));
  }
  prev?.addEventListener('click',()=>{ idx=(idx-1+imgs.length)%imgs.length; render(); });
  next?.addEventListener('click',()=>{ idx=(idx+1)%imgs.length; render(); });
  render();
})();
`.trim();

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>${EMBED_CSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1><span class="underline">${escapeHtml(title)}</span></h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
  </header>

  <section class="grid-2">
    <div class="card">
      <table>
        <thead><tr><th>項目</th><th>値</th></tr></thead>
        <tbody>
${statsRows}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="slider" id="slider">
        <button class="navbtn prev" aria-label="前へ">‹</button>
${sliderImgs}
        <button class="navbtn next" aria-label="次へ">›</button>
        <div class="thumbs" aria-label="表情差分"></div>
      </div>
    </div>
  </section>

${memoHTML}

  <section class="panel">
    <div class="panel-grid">
${miniHTML}
    </div>
  </section>

  <section class="panel">
${pulldownHTML}
  </section>
</div>
<script>${EMBED_JS}</script>
</body>
</html>`;
  }, [
    title,
    subtitle,
    stats,
    images,
    memoPanels,
    miniSections,
    pulldowns,
    theme,
  ]);

  /* ---------------- クリップボード/ダウンロード ---------------- */
  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(generatedHTML);
      alert("HTMLをコピーしました！");
    } catch {
      alert("コピー失敗");
    }
  };
  const downloadHTML = () => {
    const blob = new Blob([generatedHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- プレビュー倍率（保存） ---------------- */
  const [zoom, setZoom] = useState(0.5);
  useEffect(() => {
    const z = localStorage.getItem("previewZoom");
    if (z) setZoom(parseFloat(z));
  }, []);
  useEffect(() => {
    localStorage.setItem("previewZoom", String(zoom));
  }, [zoom]);

  /* ---------------- リアルタイムプレビュー（デバウンス） ---------------- */
  const [outTab, setOutTab] = useState<"preview" | "html">("preview");
  const [previewHTML, setPreviewHTML] = useState(generatedHTML);
  useEffect(() => {
    const t = setTimeout(() => setPreviewHTML(generatedHTML), 120);
    return () => clearTimeout(t);
  }, [generatedHTML]);

  /* ---------------- 折りたたみ状態（localStorage保存） ---------------- */
  const useOpen = (key: string, def = true) => {
    const [open, setOpen] = useState<boolean>(() =>
      localStorage.getItem(key) ?? ((def ? "1" : "0") as string)
        ? (localStorage.getItem(key) ?? (def ? "1" : "0")) !== "0"
        : def
    );
    useEffect(() => localStorage.setItem(key, open ? "1" : "0"), [key, open]);
    return { open, setOpen };
  };
  const titleOpen = useOpen("openTitle");
  const jsonOpen = useOpen("openJSON");
  const statsOpen = useOpen("openStats");
  const imagesOpen = useOpen("openImages");
  const memoOpen = useOpen("openMemo");
  const miniOpen = useOpen("openMini");
  const pdOpen = useOpen("openPD");
  const themeOpen = useOpen("openTheme");

  /* ===================== UI（Tailwind） ===================== */
  return (
    <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-2 gap-6 text-gray-100 bg-gray-900 min-h-screen">
      {/* 左：入力（全部折りたためる） */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center">
          <h2 className="text-xl font-bold">入力</h2>
          <span className="text-xs text-gray-400">
            (JSON保存/読み込み・プレビュー・並べ替え/折りたたみ対応)
          </span>
        </div>

        {/* JSON 保存/読み込み */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={jsonOpen.open}
              onClick={() => jsonOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={jsonOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {jsonOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">JSON 保存 / 読み込み</h3>
          </div>
          {jsonOpen.open && (
            <div className="px-3 pb-3 flex gap-2 flex-wrap">
              <button
                className="bg-emerald-600 px-3 py-1 rounded"
                onClick={handleExportJSON}
              >
                JSON保存
              </button>
              <button
                className="bg-sky-600 px-3 py-1 rounded"
                onClick={handleImportClick}
              >
                JSON読み込み
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          )}
        </section>

        {/* タイトル */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={titleOpen.open}
              onClick={() => titleOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={titleOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {titleOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">タイトル</h3>
          </div>
          {titleOpen.open && (
            <div className="px-3 pb-3">
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトル"
              />
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 mt-2"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="サブタイトル"
              />
            </div>
          )}
        </section>

        {/* ステータス（名前編集＋並べ替え＋削除＋追加） */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={statsOpen.open}
              onClick={() => statsOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={statsOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {statsOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">ステータス</h3>
            <span className="text-xs text-gray-400">（{stats.length} 件）</span>
            <div className="ml-auto">
              <button
                className="bg-green-600 px-3 py-1 rounded"
                onClick={() =>
                  setStats([...stats, { name: "NEW", value: "n" }])
                }
              >
                ＋ 追加
              </button>
            </div>
          </div>

          {statsOpen.open && (
            <div className="px-3 pb-3 space-y-2">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="w-36 bg-gray-700 rounded p-2"
                      value={s.name}
                      onChange={(e) => {
                        const c = [...stats];
                        c[i] = { ...c[i], name: e.target.value };
                        setStats(c);
                      }}
                      placeholder="項目名（例：STR）"
                    />
                    <input
                      className="w-24 bg-gray-700 rounded p-2"
                      value={s.value}
                      onChange={(e) => {
                        const c = [...stats];
                        c[i] = { ...c[i], value: e.target.value };
                        setStats(c);
                      }}
                      placeholder="値（例：n）"
                    />
                    <div className="ml-auto flex gap-2">
                      <button
                        className="px-2 py-1 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === 0}
                        onClick={() =>
                          setStats((prev) => arrayMove(prev, i, i - 1))
                        }
                      >
                        ↑
                      </button>
                      <button
                        className="px-2 py-1 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === stats.length - 1}
                        onClick={() =>
                          setStats((prev) => arrayMove(prev, i, i + 1))
                        }
                      >
                        ↓
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 rounded"
                        onClick={() =>
                          setStats(stats.filter((_, idx) => idx !== i))
                        }
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 画像URL（黒字） */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={imagesOpen.open}
              onClick={() => imagesOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={imagesOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {imagesOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">画像URL</h3>
          </div>
          {imagesOpen.open && (
            <div className="px-3 pb-3">
              <textarea
                className="w-full border rounded p-2 h-24 text-sm text-black bg-white"
                value={imageText}
                onChange={(e) => setImageText(e.target.value)}
                placeholder="1行に1つずつURLを入力"
              />
            </div>
          )}
        </section>

        {/* 上段パネル（メモ） */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={memoOpen.open}
              onClick={() => memoOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={memoOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {memoOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">上段パネル（メモ）</h3>
            <div className="ml-auto">
              <button
                className="bg-amber-600 px-3 py-1 rounded"
                onClick={addMemo}
              >
                ＋ パネル追加
              </button>
            </div>
          </div>

          {memoOpen.open && (
            <div className="px-3 pb-3 grid md:grid-cols-2 gap-3 mt-2">
              {memoPanels.map((mp, i) => (
                <details
                  key={i}
                  open
                  className="bg-gray-800 rounded border border-gray-600"
                >
                  <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                    <span className="font-semibold">
                      メモ #{i + 1}：{mp.title || "（無題）"}
                    </span>
                    <span className="flex gap-2">
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          moveMemo(i, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === memoPanels.length - 1}
                        onClick={(e) => {
                          e.preventDefault();
                          moveMemo(i, 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        className="px-2 py-0.5 bg-red-600 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          removeMemo(i);
                        }}
                      >
                        削除
                      </button>
                    </span>
                  </summary>
                  <div className="p-3 border-t border-gray-600">
                    <input
                      className="w-full bg-gray-700 rounded p-2 mb-2"
                      value={mp.title}
                      onChange={(e) => updateMemo(i, { title: e.target.value })}
                      placeholder="メモのタイトル"
                    />
                    <textarea
                      className="w-full h-24 bg-gray-700 rounded p-2"
                      value={mp.body}
                      onChange={(e) => updateMemo(i, { body: e.target.value })}
                      placeholder="メモ本文"
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        {/* 小タイトル */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={miniOpen.open}
              onClick={() => miniOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={miniOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {miniOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">小タイトルパネル</h3>
            <div className="ml-auto">
              <button
                className="bg-blue-600 px-3 py-1 rounded"
                onClick={addMini}
              >
                ＋ セクション追加
              </button>
            </div>
          </div>

          {miniOpen.open && (
            <div className="px-3 pb-3 grid md:grid-cols-2 gap-3 mt-2">
              {miniSections.map((ms, i) => (
                <details
                  key={i}
                  open
                  className="bg-gray-800 rounded border border-gray-600"
                >
                  <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                    <span className="font-semibold">
                      小タイトル #{i + 1}：{ms.title || "（無題）"}
                    </span>
                    <span className="flex gap-2">
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          moveMini(i, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === miniSections.length - 1}
                        onClick={(e) => {
                          e.preventDefault();
                          moveMini(i, 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        className="px-2 py-0.5 bg-red-600 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          removeMini(i);
                        }}
                      >
                        削除
                      </button>
                    </span>
                  </summary>
                  <div className="p-3 border-t border-gray-600">
                    <input
                      className="w-full bg-gray-700 rounded p-2 mb-2"
                      value={ms.title}
                      onChange={(e) => updateMini(i, { title: e.target.value })}
                      placeholder="小タイトル"
                    />
                    <textarea
                      className="w-full h-24 bg-gray-700 rounded p-2"
                      value={ms.itemsText}
                      onChange={(e) =>
                        updateMini(i, { itemsText: e.target.value })
                      }
                      placeholder="1行=1項目（出力時に<li>化）"
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        {/* プルダウン（外側／入れ子） */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={pdOpen.open}
              onClick={() => pdOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={pdOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {pdOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">プルダウン</h3>
            <div className="ml-auto">
              <button
                className="bg-green-600 px-3 py-1 rounded mb-2"
                onClick={addPulldown}
              >
                ＋ 外側プルダウン追加
              </button>
            </div>
          </div>

          {pdOpen.open && (
            <div className="px-3 pb-3">
              {pulldowns.map((pd, i) => (
                <details
                  key={i}
                  open
                  className="bg-gray-800 rounded mb-2 border border-gray-600"
                >
                  <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                    <span className="font-semibold">
                      外側 #{i + 1}：{pd.title || "（無題）"}
                    </span>
                    <span className="flex gap-2">
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          movePulldown(i, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        className="px-2 py-0.5 bg-gray-700 rounded disabled:opacity-40"
                        disabled={i === pulldowns.length - 1}
                        onClick={(e) => {
                          e.preventDefault();
                          movePulldown(i, 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        className="px-2 py-0.5 bg-red-600 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          removePulldown(i);
                        }}
                      >
                        削除
                      </button>
                    </span>
                  </summary>
                  <div className="p-3 border-t border-gray-600">
                    <input
                      className="w-full bg-gray-700 rounded p-2 mb-2"
                      value={pd.title}
                      onChange={(e) =>
                        updatePulldown(i, { title: e.target.value })
                      }
                      placeholder="プルダウン見出し"
                    />

                    <button
                      className="bg-indigo-600 px-3 py-1 rounded mb-2"
                      onClick={() => addChild(i)}
                    >
                      ＋ 入れ子追加
                    </button>

                    {pd.children.map((ch, ci) => (
                      <details
                        key={ci}
                        open
                        className="bg-gray-700 rounded mb-2 border border-gray-600"
                      >
                        <summary className="cursor-pointer select-none px-3 py-2 flex items-center justify-between">
                          <span>
                            子 #{ci + 1}：{ch.title || "（無題）"}
                          </span>
                          <span className="flex gap-2">
                            <button
                              className="px-2 py-0.5 bg-gray-600 rounded disabled:opacity-40"
                              disabled={ci === 0}
                              onClick={(e) => {
                                e.preventDefault();
                                moveChild(i, ci, -1);
                              }}
                            >
                              ↑
                            </button>
                            <button
                              className="px-2 py-0.5 bg-gray-600 rounded disabled:opacity-40"
                              disabled={ci === pd.children.length - 1}
                              onClick={(e) => {
                                e.preventDefault();
                                moveChild(i, ci, 1);
                              }}
                            >
                              ↓
                            </button>
                            <button
                              className="px-2 py-0.5 bg-red-500 rounded"
                              onClick={(e) => {
                                e.preventDefault();
                                removeChild(i, ci);
                              }}
                            >
                              削除
                            </button>
                          </span>
                        </summary>
                        <div className="p-3 border-t border-gray-600">
                          <input
                            className="w-full bg-gray-600 rounded p-2 mb-1"
                            value={ch.title}
                            onChange={(e) =>
                              updateChild(i, ci, { title: e.target.value })
                            }
                            placeholder="プルダウンの見出し"
                          />
                          <textarea
                            className="w-full h-28 bg-gray-600 rounded p-2"
                            value={ch.bodyText}
                            onChange={(e) =>
                              updateChild(i, ci, { bodyText: e.target.value })
                            }
                            placeholder="内容を行ごとに"
                          />
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        {/* テーマ（プリセット＋手動） */}
        <section className="bg-gray-800/40 border border-gray-700 rounded">
          <div className="flex items-center gap-3 px-3 py-2">
            <button
              type="button"
              aria-expanded={themeOpen.open}
              onClick={() => themeOpen.setOpen((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 border border-gray-600"
              title={themeOpen.open ? "折りたたむ" : "展開する"}
            >
              <span className="text-lg leading-none">
                {themeOpen.open ? "▾" : "▸"}
              </span>
            </button>
            <h3 className="font-semibold">テーマ</h3>
          </div>

          {themeOpen.open && (
            <div className="px-3 pb-3">
              <div className="flex gap-2 items-center mb-3">
                <select
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                  value={presetKey}
                  onChange={(e) =>
                    setPresetKey(e.target.value as keyof typeof THEME_PRESETS)
                  }
                >
                  {Object.keys(THEME_PRESETS).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <button
                  className="bg-pink-600 px-3 py-1 rounded"
                  onClick={applyPreset}
                >
                  プリセット適用
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {(
                  [
                    ["背景（--bg）", "bg"],
                    ["パネル（--panel）", "panel"],
                    ["文字色（--ink）", "ink"],
                    ["タイトル色（--title-color）", "titleColor"],
                    ["サブタイトル色（--subtitle-color）", "subtitleColor"],
                    ["見出し色（h2/h3/summary）", "headingColor"],
                    ["アンダーライン色（--underline-color）", "underlineColor"],
                    ["表交互行背景（--table-alt）", "tableAltRow"],
                    ["表交互行文字（--table-alt-ink）", "tableAltInk"],
                    ["プルダウン中身色（--nested-bg）", "nestedBg"],
                  ] as const
                ).map(([label, key]) => (
                  <label key={key} className="text-xs text-gray-300">
                    {label}
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        className="w-10 h-10 p-0 bg-transparent border border-gray-600 rounded"
                        value={theme[key]}
                        onChange={(e) =>
                          setTheme((prev) => ({
                            ...prev,
                            [key]: e.target.value || prev[key],
                          }))
                        }
                      />
                      <input
                        className="flex-1 bg-gray-800 border border-gray-600 rounded p-2"
                        value={theme[key]}
                        onChange={(e) =>
                          setTheme((prev) => ({
                            ...prev,
                            [key]: e.target.value || prev[key],
                          }))
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ※ ここで設定した色は、出力HTML内の &lt;style&gt;
                のCSS変数に反映されます。
              </p>
            </div>
          )}
        </section>
      </div>

      {/* 右：出力（タブ切り替え：プレビュー / HTML） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">出力</h2>
          {/* ズームスライダー */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-24">プレビュー倍率</label>
            <input
              type="range"
              min="0.25"
              max="1"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-48"
            />
            <span className="text-sm tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="inline-flex rounded overflow-hidden border border-gray-600">
            <button
              className={`px-3 py-1 ${
                outTab === "preview" ? "bg-gray-700" : "bg-gray-800"
              }`}
              onClick={() => setOutTab("preview")}
            >
              プレビュー
            </button>
            <button
              className={`px-3 py-1 ${
                outTab === "html" ? "bg-gray-700" : "bg-gray-800"
              }`}
              onClick={() => setOutTab("html")}
            >
              HTML
            </button>
          </div>
        </div>

        {/* アクション */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="bg-indigo-600 px-3 py-1 rounded"
            onClick={copyHTML}
          >
            HTMLをコピー
          </button>
          <button
            className="bg-emerald-600 px-3 py-1 rounded"
            onClick={handleExportJSON}
          >
            JSON保存
          </button>
          <button
            className="bg-sky-600 px-3 py-1 rounded"
            onClick={handleImportClick}
          >
            JSON読み込み
          </button>
          <button
            className="bg-violet-600 px-3 py-1 rounded"
            onClick={downloadHTML}
          >
            HTMLダウンロード
          </button>
        </div>

        {/* タブ本体（リアルタイムプレビュー：iframe srcDoc） */}
        {outTab === "preview" ? (
          <div className="w-full h-[600px] rounded border border-gray-600 bg-white overflow-auto">
            <iframe
              title="preview"
              sandbox="allow-scripts allow-forms allow-popups"
              srcDoc={previewHTML}
              className="origin-top-left"
              style={{
                transform: `scale(${zoom})`,
                width: "1200px",
                height: "1600px",
                border: "0",
                display: "block",
              }}
            />
          </div>
        ) : (
          <textarea
            readOnly
            className="w-full h-[600px] bg-gray-800 border border-gray-600 rounded p-3 text-xs font-mono"
            value={generatedHTML}
          />
        )}
      </div>
    </div>
  );
}
