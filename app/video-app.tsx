"use client";
/* eslint-disable @next/next/no-img-element -- poster privati serviti da un endpoint autenticato */

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { SuiteUser } from "@/lib/auth";
import { categoryLabels, formatCount, formatDuration, type PublicVideo } from "@/lib/videos";

type VideoAppProps = { configured: boolean; user: SuiteUser | null; initialVideos: PublicVideo[] };
type UploadPhase = "idle" | "preparing" | "video" | "poster" | "saving" | "done" | "error";

const categories = ["tutti", "societa", "cultura", "scienza", "lavoro", "formazione", "musica", "territorio"];
const suiteLinks = [
  { label: "Rizoma", href: "https://rizoma.tecnosocialismo.com", mark: "R" },
  { label: "Iskra", href: "https://iskra.tecnosocialismo.com/chat", mark: "I" },
  { label: "Spazio", href: "https://cloud.tecnosocialismo.com", mark: "S" },
  { label: "Mail", href: "https://mail.tecnosocialismo.com", mark: "M" },
];

const editorialTracks = [
  { number: "01", title: "Voci dai territori", text: "Storie locali, lotte, esperienze e trasformazioni raccontate da chi le vive.", tone: "orange" },
  { number: "02", title: "Scienza comune", text: "Conoscenza accessibile, ricerca aperta e tecnologia discussa senza gerarchie.", tone: "violet" },
  { number: "03", title: "Cultura viva", text: "Cinema, musica, arti e archivi che non dipendono dalla logica pubblicitaria.", tone: "green" },
];

export function VideoApp({ configured, user, initialVideos }: VideoAppProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [category, setCategory] = useState("tutti");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("it");
    return videos.filter((video) => {
      if (category !== "tutti" && video.category !== category) return false;
      if (!clean) return true;
      return [video.title, video.description, video.ownerName, categoryLabels[video.category]]
        .some((part) => part?.toLocaleLowerCase("it").includes(clean));
    });
  }, [videos, category, query]);

  const loginUrl = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent("https://video.tecnosocialismo.com")}`;

  function requestUpload() {
    if (!configured) return showNotice("Il motore di caricamento è in configurazione.");
    if (!user) {
      window.location.href = loginUrl;
      return;
    }
    setUploadOpen(true);
  }

  function showNotice(copy: string) {
    setNotice(copy);
    window.setTimeout(() => setNotice(""), 3500);
  }

  return (
    <main className="video-shell">
      <header className="site-header">
        <a className="brand" href="https://tecnosocialismo.com"><span className="spark" /><span>TECNO<br />SOCIALISMO</span></a>
        <Link className="service-name" href="/">VIDEO <i>ALFA</i></Link>
        <label className="global-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca video, persone, temi" />{query && <button onClick={() => setQuery("")} aria-label="Cancella ricerca"><Icon name="close" /></button>}</label>
        <button className="publish-top" onClick={requestUpload}><Icon name="upload" />Pubblica</button>
        {user ? <a className="account" href="https://login.tecnosocialismo.com" title={user.email}><span>{initials(user.name)}</span><strong>{user.name}</strong></a> : <a className="login-link" href={loginUrl}>Accedi</a>}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Apri menu"><Icon name="menu" /></button>
      </header>

      <aside className={`side-panel ${menuOpen ? "is-open" : ""}`}>
        <nav aria-label="Esplora">
          <p>ESPLORA</p>
          {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setMenuOpen(false); }}><span>{categoryIcon(item)}</span>{categoryLabels[item]}</button>)}
        </nav>
        <section className="principles"><p>COME FUNZIONA</p><div><b>01</b><span>Niente pubblicità</span></div><div><b>02</b><span>Ordine comprensibile</span></div><div><b>03</b><span>Dati non venduti</span></div></section>
        <section className="suite"><p>LA SUITE</p>{suiteLinks.map((link) => <a key={link.label} href={link.href}><i>{link.mark}</i>{link.label}</a>)}</section>
      </aside>
      {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Chiudi menu" />}

      <div className="page-content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">UNA PIATTAFORMA DA GUARDARE INSIEME</p>
            <h1>Le immagini<br />non sono <em>merce.</em></h1>
            <p>Video, conoscenza e cultura senza pubblicità, sorveglianza o raccomandazioni incomprensibili. Pubblica, guarda, discuti.</p>
            <div><button onClick={requestUpload}>Pubblica il primo video <Icon name="arrow" /></button><a href="#ultimi">Esplora la piattaforma</a></div>
          </div>
          <div className="hero-signal" aria-hidden="true">
            <div className="signal-grid" /><div className="signal-ring ring-one" /><div className="signal-ring ring-two" />
            <span className="play-core"><Icon name="play" /></span>
            <i className="node node-a" /><i className="node node-b" /><i className="node node-c" />
            <small>TRASMISSIONE<br />COLLETTIVA</small>
          </div>
        </section>

        <section className="manifesto-line"><p>NESSUN PROFILO PUBBLICITARIO</p><span>•</span><p>RACCOMANDAZIONI SPIEGABILI</p><span>•</span><p>CREATORI E COMUNITÀ AL CENTRO</p></section>

        {videos.length === 0 && (
          <section className="editorial-section">
            <header><div><p className="section-kicker">LINEE EDITORIALI APERTE</p><h2>Da dove cominciamo.</h2></div><span>La comunità deciderà come evolverle</span></header>
            <div className="editorial-grid">{editorialTracks.map((track) => <article key={track.number} className={track.tone}><span>{track.number}</span><div className="track-art"><i /><b /></div><h3>{track.title}</h3><p>{track.text}</p></article>)}</div>
          </section>
        )}

        <section className="video-section" id="ultimi">
          <header><div><p className="section-kicker">CATALOGO PUBBLICO</p><h2>{query ? `Risultati per “${query}”` : category === "tutti" ? "Pubblicati di recente." : categoryLabels[category]}</h2></div><span>{visible.length} {visible.length === 1 ? "video" : "video"}</span></header>
          {visible.length ? <div className="video-grid">{visible.map((video, index) => <VideoCard key={video.id} video={video} featured={index === 0 && category === "tutti" && !query} />)}</div> : <EmptyCatalog hasVideos={videos.length > 0} onUpload={requestUpload} />}
        </section>

        <footer className="site-footer"><a className="brand" href="https://tecnosocialismo.com"><span className="spark" /><span>TECNOSOCIALISMO</span></a><p>Piattaforma video indipendente · versione alfa</p><div><a href="https://tecnosocialismo.com/manifesto">Manifesto</a><a href="https://tecnosocialismo.com">Progetto</a></div></footer>
      </div>

      {uploadOpen && user && <UploadPanel user={user} onClose={() => setUploadOpen(false)} onComplete={(video) => { setVideos((current) => [video, ...current]); setUploadOpen(false); showNotice("Video pubblicato. Ora è parte del catalogo comune."); window.setTimeout(() => { window.location.href = `/watch/${video.id}`; }, 650); }} />}
      {notice && <div className="toast"><Icon name="spark" />{notice}</div>}
    </main>
  );
}

function VideoCard({ video, featured }: { video: PublicVideo; featured?: boolean }) {
  return <Link className={`video-card ${featured ? "featured" : ""}`} href={`/watch/${video.id}`}>
    <div className="video-poster">{video.hasPoster ? <img src={`/api/videos/${video.id}/poster`} alt="" /> : <PosterFallback seed={video.id} />}<span className="play-chip"><Icon name="play" /></span><time>{formatDuration(video.durationSeconds)}</time>{featured && <b>IN EVIDENZA</b>}</div>
    <div className="video-info"><span className="creator-avatar">{initials(video.ownerName)}</span><div><h3>{video.title}</h3><p>{video.ownerName}</p><small>{formatCount(video.viewCount)} visualizzazioni · {relativeDate(video.publishedAt)}</small></div></div>
  </Link>;
}

function PosterFallback({ seed }: { seed: string }) {
  const tone = seed.charCodeAt(0) % 3;
  return <div className={`poster-fallback tone-${tone}`}><i /><i /><span>VIDEO</span></div>;
}

function EmptyCatalog({ hasVideos, onUpload }: { hasVideos: boolean; onUpload: () => void }) {
  return <div className="empty-catalog"><span><Icon name={hasVideos ? "search" : "play"} /></span><div><h3>{hasVideos ? "Nessun risultato in questo percorso." : "Il catalogo aspetta il suo primo video."}</h3><p>{hasVideos ? "Prova un’altra parola o scegli Tutto dal menu." : "La piattaforma è pronta: il primo racconto può partire da qui."}</p></div>{!hasVideos && <button onClick={onUpload}>Pubblica un video</button>}</div>;
}

function UploadPanel({ user, onClose, onComplete }: { user: SuiteUser; onClose: () => void; onComplete: (video: PublicVideo) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("societa");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(next: File | null) {
    if (!next) return;
    if (!next.type.startsWith("video/")) return setError("Scegli un file video.");
    if (next.size > 2 * 1024 ** 3) return setError("Per l’alfa il limite è 2 GB.");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next); setPreviewUrl(URL.createObjectURL(next)); setError("");
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) return setError("Aggiungi un video e un titolo.");
    setError(""); setPhase("preparing"); setProgress(1);

    try {
      const media = await inspectVideo(file);
      setPhase("video");
      const videoBlob = await upload(`video/${user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`, file, {
        access: "private", handleUploadUrl: "/api/upload", multipart: file.size > 20 * 1024 ** 2,
        clientPayload: JSON.stringify({ kind: "video" }),
        onUploadProgress: (event) => setProgress(Math.max(2, Math.round(event.percentage * .88))),
      });

      let posterBlob: { url: string; pathname: string } | null = null;
      if (media.poster) {
        setPhase("poster"); setProgress(90);
        posterBlob = await upload(`poster/${user.id}/${crypto.randomUUID()}.jpg`, media.poster, {
          access: "private", handleUploadUrl: "/api/upload", clientPayload: JSON.stringify({ kind: "poster" }),
        });
      }

      setPhase("saving"); setProgress(96);
      const response = await fetch("/api/videos/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, visibility, durationSeconds: media.duration, video: videoBlob, poster: posterBlob }),
      });
      const payload = (await response.json()) as { video?: PublicVideo; error?: string };
      if (!response.ok || !payload.video) throw new Error(payload.error || "Pubblicazione non riuscita");
      setProgress(100); setPhase("done"); onComplete(payload.video);
    } catch (cause) {
      setPhase("error"); setError(cause instanceof Error ? cause.message : "Pubblicazione non riuscita");
    }
  }

  const busy = !["idle", "error"].includes(phase);
  return <div className="upload-layer"><button className="upload-scrim" onClick={onClose} aria-label="Chiudi pubblicazione" /><form className="upload-panel" onSubmit={publish}>
    <header><div><p>NUOVO VIDEO</p><h2>Metti in circolo un’idea.</h2></div><button type="button" onClick={onClose} aria-label="Chiudi"><Icon name="close" /></button></header>
    <div className="upload-body">
      <button type="button" className={`drop-video ${file ? "has-file" : ""}`} onClick={() => inputRef.current?.click()} disabled={busy}>
        {file ? <video src={previewUrl} muted playsInline /> : <span><Icon name="upload" /></span>}
        <div><strong>{file ? file.name : "Scegli un video"}</strong><small>{file ? formatBytes(file.size) : "MP4, WebM o MOV · massimo 2 GB"}</small></div>
        <i>{file ? "Cambia" : "Sfoglia"}</i>
      </button>
      <input ref={inputRef} className="visually-hidden" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
      <label><span>Titolo</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="Un titolo chiaro" disabled={busy} required /></label>
      <label><span>Descrizione</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder="Racconta il contesto, aggiungi fonti, invita alla discussione…" disabled={busy} /></label>
      <div className="upload-grid"><label><span>Categoria</span><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={busy}>{Object.entries(categoryLabels).filter(([id]) => !["tutti", "altro"].includes(id)).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label><span>Visibilità</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)} disabled={busy}><option value="public">Pubblico</option><option value="unlisted">Non in elenco</option><option value="private">Privato</option></select></label></div>
      <div className="license-note"><Icon name="people" /><p><strong>Resta tuo.</strong> Pubblicando concedi alla piattaforma il diritto tecnico di distribuire il video; non ne cedi la proprietà.</p></div>
      {busy && <div className="upload-progress"><div><span style={{ width: `${progress}%` }} /></div><p>{phaseLabel(phase)} <b>{progress}%</b></p></div>}
      {error && <p className="form-error">{error}</p>}
    </div>
    <footer><span>Account: {user.name}</span><button type="submit" disabled={busy || !file}>{busy ? "Pubblicazione…" : "Pubblica"}<Icon name="arrow" /></button></footer>
  </form></div>;
}

async function inspectVideo(file: File): Promise<{ duration: number; poster: File | null }> {
  return new Promise((resolve) => {
    const element = document.createElement("video");
    const url = URL.createObjectURL(file);
    element.preload = "metadata"; element.muted = true; element.playsInline = true; element.src = url;
    const finish = (poster: File | null) => { const duration = Math.max(0, Math.round(Number.isFinite(element.duration) ? element.duration : 0)); URL.revokeObjectURL(url); resolve({ duration, poster }); };
    element.onerror = () => finish(null);
    element.onloadedmetadata = () => { element.currentTime = Math.min(Math.max(element.duration * .18, .1), 3); };
    element.onseeked = () => {
      try {
        const width = Math.min(1280, element.videoWidth || 1280); const height = Math.round(width * ((element.videoHeight || 720) / (element.videoWidth || 1280)));
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        canvas.getContext("2d")?.drawImage(element, 0, 0, width, height);
        canvas.toBlob((blob) => finish(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null), "image/jpeg", .86);
      } catch { finish(null); }
    };
    window.setTimeout(() => finish(null), 8000);
  });
}

type IconName = "arrow" | "close" | "menu" | "people" | "play" | "search" | "spark" | "upload";
const iconPaths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  spark: <><path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"/></>,
  upload: <><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></>,
};
function Icon({ name }: { name: IconName }) { return <svg viewBox="0 0 24 24" aria-hidden="true">{iconPaths[name]}</svg>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "TS"; }
function safeFilename(value: string) { return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120); }
function formatBytes(bytes: number) { return new Intl.NumberFormat("it-IT", { style: "unit", unit: bytes >= 1024 ** 3 ? "gigabyte" : "megabyte", maximumFractionDigits: 1 }).format(bytes / (bytes >= 1024 ** 3 ? 1024 ** 3 : 1024 ** 2)); }
function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)); return days === 0 ? "oggi" : days === 1 ? "ieri" : `${days} giorni fa`; }
function categoryIcon(id: string) { return ({ tutti: "◫", societa: "◎", cultura: "◇", scienza: "✦", lavoro: "△", formazione: "□", musica: "♪", territorio: "⌖" } as Record<string,string>)[id] ?? "·"; }
function phaseLabel(phase: UploadPhase) { return ({ preparing: "Preparo il video", video: "Caricamento video", poster: "Creo l’anteprima", saving: "Pubblicazione", done: "Completato", idle: "", error: "Errore" } as Record<UploadPhase,string>)[phase]; }
