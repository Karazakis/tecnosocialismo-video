"use client";
/* eslint-disable @next/next/no-img-element -- i poster privati passano da un endpoint autenticato */

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import {
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SuiteUser } from "@/lib/auth";
import { readHistory, readSaved, toggleSaved } from "@/lib/personalization";
import { rankVideos, trendingScore, type RankedVideo, type ViewingSignal } from "@/lib/recommendations";
import { categoryLabels, formatCount, formatDuration, type PublicVideo } from "@/lib/videos";
import { SuiteLauncher, suiteLinks } from "./suite-launcher";

type VideoAppProps = {
  configured: boolean;
  user: SuiteUser | null;
  initialVideos: PublicVideo[];
  initialQuery?: string;
  previewMode?: boolean;
};
type UploadPhase = "idle" | "preparing" | "video" | "poster" | "saving" | "done" | "error";
type Feed = "home" | "for-you" | "trending" | "history" | "saved";

const categories = ["tutti", "societa", "cultura", "scienza", "lavoro", "formazione", "musica", "territorio"];

export function VideoApp({
  configured,
  user,
  initialVideos,
  initialQuery = "",
  previewMode = false,
}: VideoAppProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [feed, setFeed] = useState<Feed>("home");
  const [category, setCategory] = useState("tutti");
  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<ViewingSignal[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [personalizationReady, setPersonalizationReady] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const loginUrl = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent("https://video.tecnosocialismo.com")}`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHistory(readHistory());
      setSaved(readSaved());
      setPersonalizationReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setUploadOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const recommendations = useMemo(
    () => rankVideos(videos, { history }, videos.length),
    [history, videos],
  );
  const recommendationById = useMemo(
    () => new Map(recommendations.map((item) => [item.video.id, item])),
    [recommendations],
  );
  const historyById = useMemo(
    () => new Map(history.map((item) => [item.videoId, item])),
    [history],
  );

  const visible = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("it");
    let result = [...videos];

    if (feed === "for-you") result = recommendations.map((item) => item.video);
    if (feed === "trending") result.sort((a, b) => trendingScore(b) - trendingScore(a));
    if (feed === "history") {
      const order = new Map(history.map((item, index) => [item.videoId, index]));
      result = result
        .filter((video) => order.has(video.id))
        .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    }
    if (feed === "saved") result = result.filter((video) => saved.has(video.id));
    if (category !== "tutti") result = result.filter((video) => video.category === category);
    if (clean) {
      result = result.filter((video) =>
        [video.title, video.description, video.ownerName, categoryLabels[video.category]]
          .some((part) => part?.toLocaleLowerCase("it").includes(clean)),
      );
    }
    return result;
  }, [category, feed, history, query, recommendations, saved, videos]);

  const featuredRank = recommendations[0];
  const featured = featuredRank?.video ?? videos[0] ?? null;
  const continueWatching = history
    .filter((item) => item.progress > .02 && item.progress < .96)
    .map((item) => videos.find((video) => video.id === item.videoId))
    .filter((video): video is PublicVideo => Boolean(video))
    .slice(0, 5);

  function requestUpload() {
    if (!configured && !previewMode) return showNotice("Il motore di caricamento è in configurazione.");
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

  function chooseFeed(next: Feed) {
    setFeed(next);
    setCategory("tutti");
    setQuery("");
    setMobileNavOpen(false);
  }

  function saveVideo(videoId: string) {
    const isSaved = toggleSaved(videoId);
    setSaved(readSaved());
    showNotice(isSaved ? "Aggiunto a Guarda più tardi." : "Rimosso da Guarda più tardi.");
  }

  const feedTitle = query
    ? `Risultati per “${query}”`
    : category !== "tutti"
      ? categoryLabels[category]
      : feed === "for-you"
        ? "Scelti per te, con criterio."
        : feed === "trending"
          ? "Conversazioni che si muovono."
          : feed === "history"
            ? "Riprendi da dove eri."
            : feed === "saved"
              ? "La tua lista."
              : "Nuove prospettive.";

  return (
    <main className="neural-video">
      <aside className={`nv-rail ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="nv-rail-head">
          <Link className="nv-brand" href="/">
            <span className="nv-brand-signal"><i /><i /><b /></span>
            <span><strong>VIDEO</strong><small>TECNOSOCIALISMO</small></span>
          </Link>
          <button className="nv-icon-button nv-mobile-only" onClick={() => setMobileNavOpen(false)} aria-label="Chiudi navigazione"><Icon name="close" /></button>
        </div>

        <button className="nv-publish" onClick={requestUpload}><Icon name="upload" /><span>Pubblica</span><Icon name="arrowUpRight" size={14} /></button>

        <nav className="nv-nav" aria-label="Video">
          <p>GUARDA</p>
          <FeedButton active={feed === "home"} icon="home" label="Home" onClick={() => chooseFeed("home")} />
          <FeedButton active={feed === "for-you"} icon="nodes" label="Per te" meta="AI" onClick={() => chooseFeed("for-you")} />
          <FeedButton active={feed === "trending"} icon="trend" label="Tendenze" onClick={() => chooseFeed("trending")} />
        </nav>
        <nav className="nv-nav nv-library" aria-label="La tua raccolta">
          <p>LA TUA RACCOLTA</p>
          <FeedButton active={feed === "history"} icon="history" label="Cronologia" meta={history.length || undefined} onClick={() => chooseFeed("history")} />
          <FeedButton active={feed === "saved"} icon="bookmark" label="Guarda più tardi" meta={saved.size || undefined} onClick={() => chooseFeed("saved")} />
        </nav>

        <div className="nv-intelligence">
          <div><span><Icon name="shield" size={14} /></span><p><strong>Intelligenza trasparente</strong><small>I suggerimenti nascono qui, sul tuo dispositivo.</small></p></div>
          <button onClick={() => chooseFeed("for-you")}>Come scegliamo <Icon name="arrow" size={13} /></button>
        </div>

        <div className="nv-suite-row">
          {suiteLinks.slice(1, 8).map((link) => <a className={link.current ? "current" : ""} href={link.href} title={link.label} key={link.label}>{link.mark}</a>)}
        </div>
      </aside>

      {mobileNavOpen && <button className="nv-mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Chiudi navigazione" />}

      <section className="nv-main">
        <header className="nv-topbar">
          <button className="nv-icon-button nv-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Apri navigazione"><Icon name="menu" /></button>
          <label className="nv-search">
            <Icon name="search" size={18} />
            <input ref={searchRef} value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim()) { setFeed("home"); setCategory("tutti"); } }} placeholder="Cerca video, canali e temi" aria-label="Cerca nella piattaforma" />
            {query ? <button onClick={() => setQuery("")} aria-label="Cancella ricerca"><Icon name="close" size={14} /></button> : <kbd>Ctrl K</kbd>}
          </label>
          <div className="nv-top-actions">
            <button className="nv-upload-compact" onClick={requestUpload}><Icon name="upload" size={15} /><span>Pubblica</span></button>
            <SuiteLauncher />
            {user ? <a className="nv-user" href="https://login.tecnosocialismo.com" title={user.email}>{initials(user.name)}</a> : <a className="nv-login" href={loginUrl}>Accedi</a>}
          </div>
        </header>

        <div className="nv-scroll">
          {!query && (featured ? (
            <section className="nv-featured">
              <div className="nv-featured-visual">
                <Poster video={featured} hero />
                <div className="nv-featured-shade" />
                <div className="nv-live-graph" aria-hidden="true"><i /><i /><i /><i /><span /></div>
              </div>
              <div className="nv-featured-copy">
                <div className="nv-reason"><Icon name="nodes" size={14} /><span>{featuredRank?.reason ?? "In primo piano dal catalogo"}</span><button title="Raccomandazione basata su rilevanza, freschezza e qualità della discussione"><Icon name="info" size={13} /></button></div>
                <p className="nv-kicker">{categoryLabels[featured.category]?.toUpperCase()} · {relativeDate(featured.publishedAt).toUpperCase()}</p>
                <h1>{featured.title}</h1>
                <p>{featured.description || "Una nuova prospettiva dal catalogo della comunità."}</p>
                <div className="nv-featured-meta"><span>{featured.ownerName}</span><i /> <span>{formatCount(featured.viewCount)} visualizzazioni</span><i /> <span>{formatDuration(featured.durationSeconds)}</span></div>
                <div className="nv-featured-actions">
                  <Link href={`/watch/${featured.id}`}><Icon name="play" size={17} /> Guarda ora</Link>
                  <button className={saved.has(featured.id) ? "is-saved" : ""} onClick={() => saveVideo(featured.id)}><Icon name={saved.has(featured.id) ? "check" : "bookmark"} size={16} /> {saved.has(featured.id) ? "Salvato" : "Più tardi"}</button>
                </div>
              </div>
            </section>
          ) : (
            <section className="nv-featured nv-featured-empty">
              <div className="nv-empty-signal"><i /><i /><span><Icon name="play" size={28} /></span></div>
              <div className="nv-featured-copy"><p className="nv-kicker">UNA PIATTAFORMA DA COSTRUIRE INSIEME</p><h1>Il primo segnale può partire da te.</h1><p>Pubblica conoscenza, cultura e storie senza pubblicità né profilazione.</p><div className="nv-featured-actions"><button onClick={requestUpload}><Icon name="upload" /> Pubblica un video</button></div></div>
            </section>
          ))}

          <nav className="nv-categories" aria-label="Categorie">
            {categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => { setCategory(item); setFeed("home"); }} key={item}><span><Icon name={categoryIcon(item)} size={15} /></span>{categoryLabels[item]}</button>)}
          </nav>

          {feed === "home" && !query && continueWatching.length > 0 && (
            <VideoRow title="Continua a guardare" kicker="LA TUA CRONOLOGIA" videos={continueWatching} saved={saved} historyById={historyById} recommendationById={recommendationById} onSave={saveVideo} />
          )}

          {feed === "home" && !query && recommendations.length > 1 && (
            <VideoRow title="Per te, senza scatole nere" kicker="RACCOMANDAZIONI SPIEGABILI" videos={recommendations.slice(0, 5).map((item) => item.video)} saved={saved} historyById={historyById} recommendationById={recommendationById} onSave={saveVideo} showReasons />
          )}

          <section className="nv-catalog" id="catalogo">
            <header className="nv-section-head">
              <div><p>{query ? "RICERCA GLOBALE" : feedLabel(feed)}</p><h2>{feedTitle}</h2></div>
              <span>{visible.length} video</span>
            </header>
            {feed === "for-you" && (
              <div className="nv-explain-banner"><span><Icon name="nodes" /></span><div><strong>Un algoritmo che puoi capire.</strong><p>Combiniamo temi guardati, freschezza, qualità della discussione e una quota di scoperta. La cronologia resta nel browser e non viene venduta.</p></div><small>{personalizationReady && history.length ? `${history.length} ${history.length === 1 ? "segnale locale" : "segnali locali"}` : "Inizia a guardare per personalizzare"}</small></div>
            )}
            {visible.length ? (
              <div className="nv-grid">
                {visible.map((video) => <VideoCard key={video.id} video={video} saved={saved.has(video.id)} progress={historyById.get(video.id)?.progress} recommendation={feed === "for-you" ? recommendationById.get(video.id) : undefined} onSave={() => saveVideo(video.id)} />)}
              </div>
            ) : (
              <EmptyFeed feed={query ? "home" : feed} hasVideos={videos.length > 0} onUpload={requestUpload} />
            )}
          </section>

          <footer className="nv-footer"><Link className="nv-brand" href="/"><span className="nv-brand-signal"><i /><i /><b /></span><span><strong>VIDEO</strong><small>TECNOSOCIALISMO</small></span></Link><p>Niente pubblicità · raccomandazioni spiegabili · dati non venduti</p><div><a href="https://tecnosocialismo.com/manifesto">Manifesto</a><a href="https://tecnosocialismo.com">Progetto</a></div></footer>
        </div>
      </section>

      {uploadOpen && user && <UploadPanel user={user} previewMode={previewMode} onClose={() => setUploadOpen(false)} onComplete={(video) => { setVideos((current) => [video, ...current]); setUploadOpen(false); showNotice("Video pubblicato. Ora è parte del catalogo comune."); if (!previewMode) window.setTimeout(() => { window.location.href = `/watch/${video.id}`; }, 650); }} />}
      {notice && <div className="nv-toast"><Icon name="spark" size={15} />{notice}</div>}
    </main>
  );
}

function FeedButton({ active, icon, label, meta, onClick }: { active: boolean; icon: IconName; label: string; meta?: string | number; onClick: () => void }) {
  return <button className={active ? "active" : ""} onClick={onClick}><Icon name={icon} size={17} /><span>{label}</span>{meta !== undefined && <small>{meta}</small>}</button>;
}

function VideoRow({ title, kicker, videos, saved, historyById, recommendationById, onSave, showReasons = false }: { title: string; kicker: string; videos: PublicVideo[]; saved: Set<string>; historyById: Map<string, ViewingSignal>; recommendationById: Map<string, RankedVideo>; onSave: (id: string) => void; showReasons?: boolean }) {
  return <section className="nv-row-section"><header className="nv-section-head"><div><p>{kicker}</p><h2>{title}</h2></div></header><div className="nv-horizontal">{videos.map((video) => <VideoCard key={video.id} video={video} saved={saved.has(video.id)} progress={historyById.get(video.id)?.progress} recommendation={showReasons ? recommendationById.get(video.id) : undefined} onSave={() => onSave(video.id)} />)}</div></section>;
}

function VideoCard({ video, saved, progress, recommendation, onSave }: { video: PublicVideo; saved: boolean; progress?: number; recommendation?: RankedVideo; onSave: () => void }) {
  return <article className="nv-card">
    <Link href={`/watch/${video.id}`} aria-label={`Guarda ${video.title}`}>
      <div className="nv-card-poster"><Poster video={video} /><span className="nv-card-play"><Icon name="play" size={17} /></span><time>{formatDuration(video.durationSeconds)}</time>{typeof progress === "number" && progress > .01 && <i className="nv-watch-progress" style={{ width: `${Math.min(100, progress * 100)}%` }} />}</div>
      <div className="nv-card-copy"><div className="nv-avatar">{initials(video.ownerName)}</div><div><h3>{video.title}</h3><p>{video.ownerName}</p><small>{formatCount(video.viewCount)} visualizzazioni · {relativeDate(video.publishedAt)}</small>{recommendation && <span className={`nv-card-reason reason-${recommendation.reasonCode}`}><Icon name="nodes" size={11} /> {recommendation.reason}</span>}</div></div>
    </Link>
    <button className={`nv-save ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={saved ? `Rimuovi ${video.title} da Guarda più tardi` : `Salva ${video.title} per dopo`} title="Guarda più tardi"><Icon name={saved ? "check" : "bookmark"} size={15} /></button>
  </article>;
}

function Poster({ video, hero = false }: { video: PublicVideo; hero?: boolean }) {
  if (video.hasPoster) return <img src={`/api/videos/${video.id}/poster`} alt="" />;
  const tone = stableTone(video.id);
  return <div className={`nv-poster-art tone-${tone} category-${video.category} ${hero ? "is-hero" : ""}`}><i /><i /><b /><span>{categoryLabels[video.category]?.toUpperCase() || "VIDEO"}</span><small>{video.ownerName}</small></div>;
}

function EmptyFeed({ feed, hasVideos, onUpload }: { feed: Feed; hasVideos: boolean; onUpload: () => void }) {
  const copy = feed === "history" ? ["La cronologia è ancora vuota.", "I video che guardi appariranno qui, solo su questo dispositivo."] : feed === "saved" ? ["Niente in lista, per ora.", "Usa il segnalibro sui video che vuoi ritrovare."] : [hasVideos ? "Nessun risultato in questo percorso." : "Il catalogo aspetta il suo primo video.", hasVideos ? "Prova un’altra parola o torna a Tutto." : "La piattaforma è pronta: il primo racconto può partire da qui."];
  return <div className="nv-empty"><div><i /><i /><span><Icon name={feed === "history" ? "history" : feed === "saved" ? "bookmark" : "play"} size={23} /></span></div><h3>{copy[0]}</h3><p>{copy[1]}</p>{!hasVideos && <button onClick={onUpload}>Pubblica un video</button>}</div>;
}

function UploadPanel({ user, previewMode, onClose, onComplete }: { user: SuiteUser; previewMode: boolean; onClose: () => void; onComplete: (video: PublicVideo) => void }) {
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

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

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
      if (previewMode) {
        for (const value of [18, 41, 67, 89, 100]) { await new Promise((resolve) => window.setTimeout(resolve, 90)); setProgress(value); }
        const now = new Date().toISOString();
        onComplete({ id: crypto.randomUUID(), ownerId: user.id, ownerName: user.name, title: title.trim(), description: description.trim(), category, visibility, durationSeconds: media.duration, viewCount: 0, likeCount: 0, commentCount: 0, publishedAt: now, hasPoster: false });
        return;
      }
      setPhase("video");
      const videoBlob = await upload(`video/${user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`, file, { access: "private", handleUploadUrl: "/api/upload", multipart: file.size > 20 * 1024 ** 2, clientPayload: JSON.stringify({ kind: "video" }), onUploadProgress: (value) => setProgress(Math.max(2, Math.round(value.percentage * .88))) });
      let posterBlob: { url: string; pathname: string } | null = null;
      if (media.poster) {
        setPhase("poster"); setProgress(90);
        posterBlob = await upload(`poster/${user.id}/${crypto.randomUUID()}.jpg`, media.poster, { access: "private", handleUploadUrl: "/api/upload", clientPayload: JSON.stringify({ kind: "poster" }) });
      }
      setPhase("saving"); setProgress(96);
      const response = await fetch("/api/videos/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, category, visibility, durationSeconds: media.duration, video: videoBlob, poster: posterBlob }) });
      const payload = (await response.json()) as { video?: PublicVideo; error?: string };
      if (!response.ok || !payload.video) throw new Error(payload.error || "Pubblicazione non riuscita");
      setProgress(100); setPhase("done"); onComplete(payload.video);
    } catch (cause) {
      setPhase("error"); setError(cause instanceof Error ? cause.message : "Pubblicazione non riuscita");
    }
  }

  const busy = !["idle", "error"].includes(phase);
  return <div className="upload-layer"><button className="upload-scrim" onClick={onClose} aria-label="Chiudi pubblicazione" /><form className="upload-panel nv-upload-panel" onSubmit={publish}>
    <header><div><p>NUOVO VIDEO</p><h2>Metti in circolo un’idea.</h2></div><button type="button" onClick={onClose} aria-label="Chiudi"><Icon name="close" /></button></header>
    <div className="upload-body">
      <button type="button" className={`drop-video ${file ? "has-file" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] ?? null); }} disabled={busy}>
        {file ? <video src={previewUrl} muted playsInline /> : <span><Icon name="upload" /></span>}
        <div><strong>{file ? file.name : "Scegli o trascina un video"}</strong><small>{file ? formatBytes(file.size) : "MP4, WebM o MOV · massimo 2 GB"}</small></div><i>{file ? "Cambia" : "Sfoglia"}</i>
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
    let finished = false;
    const finish = (poster: File | null) => {
      if (finished) return;
      finished = true;
      const duration = Math.max(0, Math.round(Number.isFinite(element.duration) ? element.duration : 0));
      URL.revokeObjectURL(url); resolve({ duration, poster });
    };
    element.preload = "metadata"; element.muted = true; element.playsInline = true; element.src = url;
    element.onerror = () => finish(null);
    element.onloadedmetadata = () => { element.currentTime = Math.min(Math.max(element.duration * .18, .1), 3); };
    element.onseeked = () => {
      try {
        const width = Math.min(1280, element.videoWidth || 1280);
        const height = Math.round(width * ((element.videoHeight || 720) / (element.videoWidth || 1280)));
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        canvas.getContext("2d")?.drawImage(element, 0, 0, width, height);
        canvas.toBlob((blob) => finish(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null), "image/jpeg", .86);
      } catch { finish(null); }
    };
    window.setTimeout(() => finish(null), 8000);
  });
}

type IconName = "arrow" | "arrowUpRight" | "bookmark" | "check" | "close" | "culture" | "formation" | "history" | "home" | "info" | "labor" | "menu" | "music" | "nodes" | "people" | "play" | "science" | "search" | "shield" | "society" | "spark" | "territory" | "trend" | "upload";
const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  arrowUpRight: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  culture: <><path d="M4 19c4-5 12-5 16 0"/><path d="M6 5h12v8H6z"/><path d="M9 9h.01M15 9h.01"/></>,
  formation: <><path d="m3 10 9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  labor: <><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>,
  menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
  music: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  nodes: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="m10.8 6.7-4.6 8.6M13.2 6.7l4.6 8.6M7 17h10"/></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  science: <><path d="M9 3v5l-5 9a3 3 0 0 0 2.6 4h10.8a3 3 0 0 0 2.6-4l-5-9V3"/><path d="M7 14h10M8 3h8"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-5"/></>,
  society: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20v-2a5 5 0 0 1 10 0v2M14 16a4 4 0 0 1 7 3v1"/></>,
  spark: <><path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"/></>,
  territory: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11"/><circle cx="12" cy="10" r="2"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  upload: <><path d="M12 16V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></>,
};
function Icon({ name, size = 18 }: { name: IconName; size?: number }) { return <svg style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden="true">{iconPaths[name]}</svg>; }
function categoryIcon(id: string): IconName { return ({ tutti: "nodes", societa: "society", cultura: "culture", scienza: "science", lavoro: "labor", formazione: "formation", musica: "music", territorio: "territory" } as Record<string, IconName>)[id] ?? "nodes"; }
function feedLabel(feed: Feed) { return ({ home: "DAL CATALOGO", "for-you": "PER TE", trending: "TENDENZE", history: "CRONOLOGIA LOCALE", saved: "GUARDA PIÙ TARDI" } as Record<Feed, string>)[feed]; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TS"; }
function stableTone(value: string) { return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5; }
function safeFilename(value: string) { return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120); }
function formatBytes(bytes: number) { const units = bytes >= 1024 ** 3 ? [1024 ** 3, "GB"] : bytes >= 1024 ** 2 ? [1024 ** 2, "MB"] : [1024, "KB"]; return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(bytes / Number(units[0]))} ${units[1]}`; }
function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)); return days === 0 ? "oggi" : days === 1 ? "ieri" : days < 7 ? `${days} giorni fa` : new Date(value).toLocaleDateString("it-IT", { day: "numeric", month: "short" }); }
function phaseLabel(phase: UploadPhase) { return ({ preparing: "Preparo il video", video: "Caricamento video", poster: "Creo l’anteprima", saving: "Pubblicazione", done: "Completato", idle: "", error: "Errore" } as Record<UploadPhase, string>)[phase]; }
