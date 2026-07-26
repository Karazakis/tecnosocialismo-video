"use client";
/* eslint-disable @next/next/no-img-element -- i poster privati passano da un endpoint autenticato */

import Link from "next/link";
import { FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { SuiteLauncher } from "@/app/suite-launcher";
import type { SuiteUser } from "@/lib/auth";
import {
  readAutoplay,
  readFollows,
  readSaved,
  rememberVideo,
  setAutoplay as persistAutoplay,
  toggleFollow as persistFollow,
  toggleSaved as persistSaved,
} from "@/lib/personalization";
import type { RankedVideo } from "@/lib/recommendations";
import { categoryLabels, formatCount, formatDuration, type PublicComment, type PublicVideo } from "@/lib/videos";

export function VideoViewer({
  video,
  recommendations,
  initialComments,
  user,
  initiallyLiked,
  previewMode = false,
}: {
  video: PublicVideo;
  recommendations: RankedVideo[];
  initialComments: PublicComment[];
  user: SuiteUser | null;
  initiallyLiked: boolean;
  previewMode?: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likes, setLikes] = useState(video.likeCount);
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [theater, setTheater] = useState(false);
  const [notice, setNotice] = useState("");
  const countedView = useRef(false);
  const lastProgressWrite = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loginUrl = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent(`https://video.tecnosocialismo.com/watch/${video.id}`)}`;
  const nextVideo = recommendations[0]?.video;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSaved(readSaved().has(video.id));
      setFollowed(readFollows().has(video.ownerId));
      setAutoplay(readAutoplay());
    });
    return () => window.cancelAnimationFrame(frame);
  }, [video.id, video.ownerId]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      const player = videoRef.current;
      if (!player) return;
      if (event.key.toLowerCase() === "t") setTheater((current) => !current);
      if (event.key.toLowerCase() === "m") player.muted = !player.muted;
      if (event.key === "ArrowRight") player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
      if (event.key === "ArrowLeft") player.currentTime = Math.max(0, player.currentTime - 10);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function notify(copy: string) {
    setNotice(copy);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function toggleLike() {
    if (!user) { window.location.href = loginUrl; return; }
    if (previewMode) { setLiked((current) => !current); setLikes((current) => current + (liked ? -1 : 1)); return; }
    const response = await fetch(`/api/videos/${video.id}/like`, { method: "POST" });
    const payload = (await response.json()) as { liked?: boolean; count?: number; error?: string };
    if (!response.ok) return notify(payload.error || "Azione non riuscita");
    setLiked(Boolean(payload.liked));
    setLikes(payload.count ?? likes);
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!user) { window.location.href = loginUrl; return; }
    if (previewMode) {
      setComments((current) => [...current, { id: crypto.randomUUID(), authorName: user.name, body: comment.trim(), createdAt: new Date().toISOString() }]);
      setComment("");
      return;
    }
    const response = await fetch(`/api/videos/${video.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) });
    const payload = (await response.json()) as { comment?: PublicComment; error?: string };
    if (!response.ok || !payload.comment) return notify(payload.error || "Commento non pubblicato");
    setComments((current) => [...current, payload.comment!]);
    setComment("");
  }

  async function share() {
    const shareData = { title: video.title, text: `Guarda “${video.title}” su Video`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(shareData.url); notify("Collegamento copiato."); }
    } catch { /* La condivisione può essere annullata. */ }
  }

  function registerView() {
    rememberProgress(.01);
    if (countedView.current) return;
    countedView.current = true;
    if (!previewMode) void fetch(`/api/videos/${video.id}/view`, { method: "POST", keepalive: true });
  }

  function rememberProgress(progress: number) {
    rememberVideo({ videoId: video.id, category: video.category, ownerId: video.ownerId, progress });
  }

  function updateProgress() {
    const player = videoRef.current;
    if (!player?.duration || Date.now() - lastProgressWrite.current < 5000) return;
    lastProgressWrite.current = Date.now();
    rememberProgress(player.currentTime / player.duration);
  }

  function handleEnded() {
    rememberProgress(1);
    if (autoplay && nextVideo) window.setTimeout(() => { window.location.href = `/watch/${nextVideo.id}`; }, 900);
  }

  function toggleSave() {
    const next = persistSaved(video.id);
    setSaved(next);
    notify(next ? "Aggiunto a Guarda più tardi." : "Rimosso dalla lista.");
  }

  function toggleFollow() {
    const next = persistFollow(video.ownerId);
    setFollowed(next);
    notify(next ? `Ora segui ${video.ownerName}.` : `Non segui più ${video.ownerName}.`);
  }

  function toggleAutoplay() {
    const next = !autoplay;
    setAutoplay(next);
    persistAutoplay(next);
  }

  return <main className={`nv-watch ${theater ? "is-theater" : ""}`}>
    <header className="nv-watch-header">
      <Link className="nv-watch-brand" href="/"><span><i /><i /><b /></span><strong>VIDEO</strong></Link>
      <label className="nv-watch-search"><Icon name="search" size={17} /><input placeholder="Cerca video, canali e temi" onKeyDown={(event) => { if (event.key === "Enter" && event.currentTarget.value.trim()) window.location.href = `/?q=${encodeURIComponent(event.currentTarget.value.trim())}`; }} /></label>
      <div className="nv-watch-tools"><Link href="/" className="nv-watch-home">Esplora</Link><SuiteLauncher />{user ? <a className="nv-watch-user" href="https://login.tecnosocialismo.com">{initials(user.name)}</a> : <a className="nv-watch-login" href={loginUrl}>Accedi</a>}</div>
    </header>

    <div className="nv-watch-layout">
      <section className="nv-watch-primary">
        <div className="nv-player-shell">
          {previewMode ? <button className="nv-player-demo" onClick={registerView} aria-label="Riproduci anteprima"><i /><i /><b /><span><Icon name="play" size={29} /></span><small>ANTEPRIMA INTERFACCIA · 26:08</small></button> : <video ref={videoRef} controls playsInline preload="metadata" poster={video.hasPoster ? `/api/videos/${video.id}/poster` : undefined} onPlay={registerView} onTimeUpdate={updateProgress} onEnded={handleEnded} src={`/api/videos/${video.id}/stream`} />}
          <div className="nv-player-top"><span><Icon name="signal" size={14} /> Riproduzione privata</span><button onClick={() => setTheater(!theater)} title="Modalità teatro (T)"><Icon name={theater ? "collapse" : "theater"} size={16} /> {theater ? "Riduci" : "Teatro"}</button></div>
        </div>

        <article className="nv-watch-details">
          <p className="nv-watch-kicker">{categoryLabels[video.category] ?? "Video"} <span>·</span> {new Date(video.publishedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>
          <h1>{video.title}</h1>
          <div className="nv-watch-actions">
            <div className="nv-channel"><span>{initials(video.ownerName)}</span><div><strong>{video.ownerName}</strong><small>Canale della comunità</small></div><button className={followed ? "is-followed" : ""} onClick={toggleFollow}>{followed ? "Segui già" : "Segui"}</button></div>
            <div className="nv-action-buttons">
              <button className={liked ? "liked" : ""} onClick={toggleLike}><Icon name="like" size={16} />{formatCount(likes)}</button>
              <button className={saved ? "saved" : ""} onClick={toggleSave}><Icon name={saved ? "check" : "bookmark"} size={16} />{saved ? "Salvato" : "Più tardi"}</button>
              <button onClick={share}><Icon name="share" size={16} />Condividi</button>
            </div>
          </div>
          <div className={`nv-description ${expanded ? "expanded" : ""}`}>
            <div><strong>{formatCount(video.viewCount)} visualizzazioni</strong><span>{formatDuration(video.durationSeconds)}</span><span>Nessuna pubblicità</span></div>
            {video.description ? <p>{video.description}</p> : <p>Nessuna descrizione aggiunta.</p>}
            {video.description.length > 280 && <button onClick={() => setExpanded(!expanded)}>{expanded ? "Mostra meno" : "Mostra tutto"}</button>}
          </div>
        </article>

        <section className="nv-comments">
          <header><div><p>DISCUSSIONE</p><h2>{comments.length} {comments.length === 1 ? "commento" : "commenti"}</h2></div><span>Ordine cronologico</span></header>
          <form onSubmit={submitComment}><span>{initials(user?.name || "Tu")}</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder={user ? "Aggiungi qualcosa alla discussione…" : "Accedi per partecipare alla discussione"} disabled={!user} required /><button disabled={!user || !comment.trim()}>Pubblica</button></form>
          <div className="nv-comment-list">{comments.map((item) => <article key={item.id}><span>{initials(item.authorName)}</span><div><p><strong>{item.authorName}</strong><time>{relativeDate(item.createdAt)}</time></p><div>{item.body}</div></div></article>)}{comments.length === 0 && <div className="nv-no-comments"><Icon name="discussion" size={24} /><p><strong>La discussione è ancora vuota.</strong><span>Puoi essere la prima persona ad aprirla.</span></p></div>}</div>
        </section>
      </section>

      <aside className="nv-queue">
        <header><div><p>PROSSIMI VIDEO</p><span>Raccomandazioni spiegabili</span></div><label>Auto <button className={autoplay ? "active" : ""} onClick={toggleAutoplay} aria-label="Riproduzione automatica"><i /></button></label></header>
        {recommendations.map(({ video: item, reason }, index) => <Link key={item.id} className="nv-queue-card" href={`/watch/${item.id}`}>
          <div className="nv-queue-poster">{item.hasPoster ? <img src={`/api/videos/${item.id}/poster`} alt="" /> : <span className={`tone-${stableTone(item.id)}`}><i /><b /></span>}<time>{formatDuration(item.durationSeconds)}</time>{index === 0 && autoplay && <small>PROSSIMO</small>}</div>
          <section><h3>{item.title}</h3><p>{item.ownerName}</p><small>{formatCount(item.viewCount)} visualizzazioni</small><em><Icon name="nodes" size={10} />{reason}</em></section>
        </Link>)}
        {recommendations.length === 0 && <div className="nv-queue-empty"><div><i /><i /><span>∞</span></div><p>Il catalogo crescerà con i video della comunità.</p><Link href="/">Torna alla piattaforma</Link></div>}
        <div className="nv-why-box"><Icon name="shield" size={17} /><div><strong>Perché questi video?</strong><p>Affinità di tema, freschezza, qualità della discussione e scoperta. Nessun inserzionista decide l’ordine.</p></div></div>
      </aside>
    </div>
    {notice && <div className="nv-toast">{notice}</div>}
  </main>;
}

type IconName = "bookmark" | "check" | "collapse" | "discussion" | "like" | "nodes" | "play" | "search" | "share" | "shield" | "signal" | "theater";
const icons: Record<IconName, ReactNode> = {
  bookmark: <path d="M6 4h12v17l-6-4-6 4z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  collapse: <><path d="M9 3v6H3M15 21v-6h6M3 9l6-6M21 15l-6 6"/></>,
  discussion: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></>,
  like: <><path d="M7 10v11H3V10z"/><path d="M7 20h10.5a2 2 0 0 0 2-1.6l1.3-7A2 2 0 0 0 18.8 9H14l1-4a2.4 2.4 0 0 0-4.4-1.7L7 10"/></>,
  nodes: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="m10.8 6.7-4.6 8.6M13.2 6.7l4.6 8.6M7 17h10"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-5"/></>,
  signal: <><path d="M5 12.6a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></>,
  theater: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10v6H7z"/></>,
};
function Icon({ name, size = 18 }: { name: IconName; size?: number }) { return <svg style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TS"; }
function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)); return days === 0 ? "oggi" : days === 1 ? "ieri" : `${days} giorni fa`; }
function stableTone(value: string) { return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5; }
