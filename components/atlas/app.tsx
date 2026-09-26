"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Compass,
  Search,
  NotebookPen,
  Mic2,
  Library,
  Sun,
  Moon,
  Bookmark,
  ChevronRight,
  Check,
  X,
  Globe,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { dictionary } from "@/lib/i18n";
import type { Language } from "@/lib/topics";
import type { Evidence, SavedEvidence, Talk } from "@/lib/types";
import { Reader } from "./reader";
import { ResearchView, TopicsView } from "./research";
import { Notebook, TalkStudio } from "./notebook-talk";
import { SourcesView, TypographyView } from "./sources";
import { EvidenceLens } from "./evidence";
import { ExportDialog } from "./export-dialog";
import { ReviewConsole } from "./review";
import { StoryExplorer } from "./story";
import { useAgentTools } from "./agent-tools";
import { brand } from "@/lib/brand";
import { api, useLocal, withReadingPreferences } from "./shared";
type View =
  | "read"
  | "topics"
  | "research"
  | "notebook"
  | "talk"
  | "sources"
  | "typography"
  | "review";
const nav = [
  { id: "read", icon: BookOpen },
  { id: "topics", icon: Compass },
  { id: "research", icon: Search },
  { id: "notebook", icon: NotebookPen },
  { id: "talk", icon: Mic2 },
  { id: "sources", icon: Library },
] as const;
const defaultTalk: Talk = {
  title: "",
  language: "en",
  audience: "General audience",
  minutes: 10,
  outline: "",
  draft: "",
  evidenceIds: [],
  updated: "",
};
export default function Atlas() {
  const [ready,setReady]=useState(false);
  useEffect(()=>{if (/^#p[0-9]+$/.test(location.hash)) { location.replace("/famous/index.html"+location.hash); return; } void window.AtlasWorkspace.ready.then(()=>setReady(true));},[]);
  if(!ready) return <p role="status" className="load-state">Opening your Quran workspace…</p>;
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "232px" } as React.CSSProperties}
    >
      <Workspace />
    </SidebarProvider>
  );
}
function Workspace() {
  const [lang, setLang] = useLocal<Language>("atlas.language", "en");
  const [languages, setLanguages] = useLocal<Language[]>(
    "atlas.translationLanguages",
    ["en"],
  );
  const [lensTab, setLensTab] = useState("translation");
  const [theme, setTheme] = useLocal("atlas.theme", "light");
  const [position, setPosition] = useLocal("atlas.position", "68:7");
  const [bookmarks, setBookmarks] = useLocal<string[]>("atlas.bookmarks", []);
  const [items, setItems] = useLocal<SavedEvidence[]>("atlas.notebook", []);
  const [talk, setTalk] = useLocal<Talk>("atlas.talk", defaultTalk);
  const [recoveredTalk, setRecoveredTalk] = useLocal<Talk | null>(
    "atlas.recoveredTalk",
    null,
  );
  const [view, setView] = useState<View>("read");
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(true);
  const { setOpenMobile } = useSidebar();
  const t = dictionary(lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [lang, theme]);
  useEffect(() => {
    function loadURL() {
      const u = new URL(location.href);
      const v = u.searchParams.get("view");
      if (
        v &&
        [
          "read",
          "topics",
          "research",
          "notebook",
          "talk",
          "sources",
          "typography",
          "review",
        ].includes(v)
      )
        setView(v as View);
      const p = u.searchParams.get("verse");
      if (p && /^\d{1,3}:\d{1,3}$/.test(p)) setPosition(p);
      const q = u.searchParams.get("q");
      if (q) setQuery(q);
    }
    loadURL();
    window.addEventListener("popstate", loadURL);
    const status = () => setOnline(navigator.onLine);
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    return () => {
      window.removeEventListener("popstate", loadURL);
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
    };
  }, [setPosition]);
  useEffect(() => {
    const warning = () =>
      setToast(
        "Device storage is full or unavailable. Export your notebook to avoid losing changes.",
      );
    window.addEventListener("atlas-storage-error", warning);
    return () => window.removeEventListener("atlas-storage-error", warning);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  function navigate(v: View, q?: string) {
    setView(v);
    setOpenMobile(false);
    const u = new URL(location.href);
    u.searchParams.set("view", v);
    u.searchParams.set("verse", u.searchParams.get("verse") || position);
    if (q !== undefined) {
      setQuery(q);
      u.searchParams.set("q", q);
    } else if (v !== "research") u.searchParams.delete("q");
    history.pushState({}, "", u);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function changePosition(p: string) {
    setPosition(p);
    const u = new URL(location.href);
    u.searchParams.set("verse", p);
    history.replaceState({}, "", u);
  }
  function openEvidence(id: string, tab = "translation") {
    setLensTab(tab);
    setLens(id);
  }
  function saved(e: Evidence) {
    if (items.some((x) => x.evidence.id === e.id)) {
      setToast(t.saved);
      return;
    }
    setItems((v) => [
      ...v,
      {
        id: crypto.randomUUID(),
        evidence: withReadingPreferences(e),
        note: "",
        collection: "My evidence",
        savedAt: new Date().toISOString(),
        order: v.length,
      },
    ]);
    setToast(t.added);
  }
  async function save(id: string) {
    try {
      saved(await api<Evidence>("/api/evidence/" + encodeURIComponent(id)));
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not save");
    }
  }
  function toTalk(id?: string) {
    setTalk((v) => ({
      ...v,
      evidenceIds: id
        ? [...new Set([...v.evidenceIds, id])]
        : items.map((x) => x.id),
      language: lang,
    }));
    navigate("talk");
  }
  useAgentTools({
    research: (q) => navigate("research", q),
    save: saved,
    savedCount: items.length,
  });
  const toggleBookmark = (key: string) =>
    setBookmarks((v) =>
      v.includes(key) ? v.filter((x) => x !== key) : [...v, key],
    );
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar className="atlas-sidebar">
        <SidebarHeader className="brand-header">
          <Link href="/?view=read" className="brand">
            <span className="brand-symbol">
              <Compass size={25} strokeWidth={1.3} />
            </span>
            <span>
              {brand.first} <b>{brand.second}</b>
              <small>{brand.tagline}</small>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <p className="sidebar-label">YOUR WORKSPACE</p>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.id}>
                  <SidebarMenuButton
                    className="nav-item"
                    isActive={view === n.id}
                    onClick={() => navigate(n.id)}
                  >
                    <n.icon />
                    <span>{t[n.id]}</span>
                    {n.id === "notebook" && items.length > 0 && (
                      <small>{items.length}</small>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <a className="atlas-famous-link" href="/famous/index.html"><Mic2 size={18}/> Famous Quran · Recitations</a>
          <SidebarGroup className="bookmarks-group">
            <p className="sidebar-label">
              {t.bookmarks}
              <Bookmark size={13} />
            </p>
            {bookmarks.length ? (
              bookmarks.slice(0, 12).map((b) => (
                <button
                  key={b}
                  className="bookmark-link"
                  onClick={() => {
                    changePosition(b);
                    navigate("read");
                  }}
                >
                  <span>Quran {b}</span>
                  <ChevronRight size={13} />
                </button>
              ))
            ) : (
              <p className="bookmark-empty">{t.bookmarkEmpty}</p>
            )}
          </SidebarGroup>
          <div className="sidebar-continue">
            <p className="eyebrow">{t.continue}</p>
            <button onClick={() => navigate("read")}>
              <BookOpen size={18} />
              <span>Quran {position}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </SidebarContent>
        <SidebarFooter className="sidebar-footer">
          <span className="guest-avatar">A</span>
          <div>
            <strong>
              {lang === "bn"
                ? "ব্যক্তিগত কর্মক্ষেত্র"
                : lang === "ja"
                  ? "個人のワークスペース"
                  : "Personal workspace"}
            </strong>
            <span>{window.AtlasWorkspace.owner === "guest" ? "Guest · saved on device" : "Signed in · private sync"}</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="atlas-body">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger className="sidebar-toggle" />
            <span>{brand.name}</span>
            <ChevronRight size={13} />
            <strong>
              {view === "typography"
                ? t.typography
                : view === "review"
                  ? "Editorial review"
                  : t[view]}
            </strong>
          </div>
          <div className="topbar-tools">
            <button className="atlas-account-link" onClick={()=>window.AtlasWorkspace.open()}>Account & sync</button>
            <Globe size={16} />
            <NativeSelect
              aria-label={t.language}
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="ja">日本語</option>
            </NativeSelect>
            <span className="topbar-divider" />
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "light" ? t.dark : t.light}
              onClick={() =>
                setTheme((v) => (v === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        </header>
        {!online && (
          <div className="offline-banner">
            Offline · Your installed reading pack remains available.
          </div>
        )}
        <main id="main" className="workspace-main" tabIndex={-1}>
          {view === "read" && (
            <Reader
              lang={lang}
              position={position}
              setPosition={changePosition}
              open={openEvidence}
              save={save}
              research={(q) => navigate("research", q)}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              languages={languages}
              setLanguages={setLanguages}
            />
          )}{" "}
          {view === "research" && (
            <ResearchView
              key={query + lang}
              lang={lang}
              query={query}
              onQuery={(q) => navigate("research", q)}
              open={openEvidence}
              save={save}
            />
          )}{" "}
          {view === "topics" && (
            <>
              <TopicsView
                lang={lang}
                research={(q) => navigate("research", q)}
              />
              <StoryExplorer
                lang={lang}
                open={openEvidence}
                save={save}
                research={(q) => navigate("research", q)}
              />
            </>
          )}{" "}
          {recoveredTalk && (view === "notebook" || view === "talk") && (
            <div className="status-note">
              A recovered talk is available.{" "}
              <Button
                variant="outline"
                onClick={() => {
                  setTalk(recoveredTalk);
                  setRecoveredTalk(talk);
                  navigate("talk");
                }}
              >
                Switch to recovered talk
              </Button>
              <p>
                Your other draft remains preserved and can be switched back.
              </p>
            </div>
          )}
          {view === "notebook" && (
            <Notebook
              lang={lang}
              items={items}
              setItems={setItems}
              open={openEvidence}
              toTalk={toTalk}
            />
          )}{" "}
          {view === "talk" && (
            <TalkStudio
              lang={lang}
              items={items}
              talk={talk}
              setTalk={setTalk}
              open={openEvidence}
              notify={setToast}
            />
          )}{" "}
          {view === "sources" && (
            <SourcesView
              lang={lang}
              goTypography={() => navigate("typography")}
              notify={setToast}
            />
          )}{" "}
          {view === "review" && <ReviewConsole />}
          {view === "typography" && <TypographyView lang={lang} />}
        </main>
        <footer className="app-footer">
          <span>{brand.name}</span>
          <span>
            {t.support} ·{" "}
            <button onClick={() => navigate("sources")}>{t.sources}</button>
          </span>
        </footer>
      </div>
      <ExportDialog />
      <EvidenceLens
        key={(lens || "closed") + lang + lensTab}
        id={lens}
        initialTab={lensTab}
        translationLang={languages[0]}
        onClose={() => setLens(null)}
        lang={lang}
        save={saved}
        research={(q) => navigate("research", q)}
        notify={setToast}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label={t.close} onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
