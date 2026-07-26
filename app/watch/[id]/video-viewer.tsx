"use client";
/* eslint-disable @next/next/no-img-element -- poster privati serviti da un endpoint autenticato */

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import type { SuiteUser } from "@/lib/auth";
import { categoryLabels, formatCount, formatDuration, type PublicComment, type PublicVideo } from "@/lib/videos";

export function VideoViewer({ video, related, initialComments, user, initiallyLiked }: { video: PublicVideo; related: PublicVideo[]; initialComments: PublicComment[]; user: SuiteUser | null; initiallyLiked: boolean }) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likes, setLikes] = useState(video.likeCount);
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const countedView = useRef(false);
  const loginUrl = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent(`https://video.tecnosocialismo.com/watch/${video.id}`)}`;

  function notify(copy: string) { setNotice(copy); window.setTimeout(() => setNotice(""), 3200); }

  async function toggleLike() {
    if (!user) { window.location.href = loginUrl; return; }
    const response = await fetch(`/api/videos/${video.id}/like`, { method: "POST" });
    const payload = (await response.json()) as { liked?: boolean; count?: number; error?: string };
    if (!response.ok) return notify(payload.error || "Azione non riuscita");
    setLiked(Boolean(payload.liked)); setLikes(payload.count ?? likes);
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!user) { window.location.href = loginUrl; return; }
    const response = await fetch(`/api/videos/${video.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }) });
    const payload = (await response.json()) as { comment?: PublicComment; error?: string };
    if (!response.ok || !payload.comment) return notify(payload.error || "Commento non pubblicato");
    setComments((current) => [...current, payload.comment!]); setComment("");
  }

  async function share() {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); notify("Collegamento copiato."); } catch { notify(url); }
  }

  function registerView() {
    if (countedView.current) return;
    countedView.current = true;
    void fetch(`/api/videos/${video.id}/view`, { method: "POST", keepalive: true });
  }

  return <main className="watch-shell">
    <header className="watch-header"><a className="brand" href="https://tecnosocialismo.com"><span className="spark" /><span>TECNO<br />SOCIALISMO</span></a><Link className="service-name" href="/">VIDEO <i>ALFA</i></Link><label className="watch-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input placeholder="Cerca nella piattaforma" onKeyDown={(event) => { if (event.key === "Enter") window.location.href = `/?q=${encodeURIComponent(event.currentTarget.value)}`; }} /></label>{user ? <a className="account" href="https://login.tecnosocialismo.com"><span>{initials(user.name)}</span><strong>{user.name}</strong></a> : <a className="login-link" href={loginUrl}>Accedi</a>}</header>
    <div className="watch-layout">
      <section className="watch-primary">
        <div className="player-frame"><video controls playsInline preload="metadata" poster={video.hasPoster ? `/api/videos/${video.id}/poster` : undefined} onPlay={registerView} src={`/api/videos/${video.id}/stream`} /></div>
        <article className="watch-details">
          <p className="watch-kicker">{categoryLabels[video.category] ?? "Video"} <span>·</span> {new Date(video.publishedAt).toLocaleDateString("it-IT", { day:"numeric", month:"long", year:"numeric" })}</p>
          <h1>{video.title}</h1>
          <div className="watch-meta"><span className="creator-big">{initials(video.ownerName)}</span><div><strong>{video.ownerName}</strong><small>Canale della comunità</small></div><button className={liked ? "liked" : ""} onClick={toggleLike}><svg viewBox="0 0 24 24"><path d="M7 10v11H3V10z"/><path d="M7 20h10.5a2 2 0 0 0 2-1.6l1.3-7A2 2 0 0 0 18.8 9H14l1-4a2.4 2.4 0 0 0-4.4-1.7L7 10"/></svg>{formatCount(likes)}</button><button onClick={share}><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4"/><path d="m8.6 13.5 6.8 4"/></svg>Condividi</button><button onClick={() => notify("La segnalazione trasparente arriverà con la moderazione comunitaria.")} aria-label="Altre azioni">•••</button></div>
          <div className={`description-box ${expanded ? "expanded" : ""}`}><strong>{formatCount(video.viewCount)} visualizzazioni</strong>{video.description ? <p>{video.description}</p> : <p>Nessuna descrizione aggiunta.</p>}{video.description.length > 280 && <button onClick={() => setExpanded(!expanded)}>{expanded ? "Mostra meno" : "Mostra tutto"}</button>}</div>
        </article>
        <section className="comments-section"><header><div><p className="section-kicker">DISCUSSIONE</p><h2>{comments.length} {comments.length === 1 ? "commento" : "commenti"}</h2></div><span>Ordine cronologico</span></header><form onSubmit={submitComment}><span>{initials(user?.name || "Tu")}</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder={user ? "Aggiungi qualcosa alla discussione…" : "Accedi per partecipare alla discussione"} disabled={!user} required /><button disabled={!user || !comment.trim()}>Pubblica</button></form><div className="comment-list">{comments.map((item) => <article key={item.id}><span>{initials(item.authorName)}</span><div><p><strong>{item.authorName}</strong><time>{relativeDate(item.createdAt)}</time></p><div>{item.body}</div></div></article>)}{comments.length === 0 && <div className="no-comments">Questa discussione è ancora vuota. Puoi essere la prima persona ad aprirla.</div>}</div></section>
      </section>
      <aside className="related-column"><header><p>CONTINUA A GUARDARE</p><Link href="/">Tutti i video</Link></header>{related.map((item) => <Link key={item.id} className="related-card" href={`/watch/${item.id}`}><div>{item.hasPoster ? <img src={`/api/videos/${item.id}/poster`} alt="" /> : <span className="related-fallback" />}<time>{formatDuration(item.durationSeconds)}</time></div><section><h3>{item.title}</h3><p>{item.ownerName}</p><small>{formatCount(item.viewCount)} visualizzazioni</small></section></Link>)}{related.length === 0 && <div className="related-empty"><span>∞</span><p>Il catalogo crescerà con i video della comunità.</p><Link href="/">Torna alla piattaforma</Link></div>}</aside>
    </div>
    {notice && <div className="toast">{notice}</div>}
  </main>;
}

function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "TS"; }
function relativeDate(value: string) { const days = Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/86400000)); return days===0?"oggi":days===1?"ieri":`${days} giorni fa`; }
