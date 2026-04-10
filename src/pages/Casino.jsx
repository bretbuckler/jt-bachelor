import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const GAMES = [
  "Blackjack", "Roulette", "Craps", "Slots", "Poker", "Sports Bet", "Other",
];

const SHAME_LEVELS = [
  { min: 0, max: 50, label: "Pocket Change", emoji: "😌", color: "text-emerald-600" },
  { min: 50, max: 150, label: "Questionable Decisions", emoji: "😅", color: "text-amber-600" },
  { min: 150, max: 300, label: "Chasing Losses", emoji: "😬", color: "text-orange-600" },
  { min: 300, max: 500, label: "Full Tilt", emoji: "🫠", color: "text-red-500" },
  { min: 500, max: 1000, label: "Calling the Bank", emoji: "💀", color: "text-red-700" },
  { min: 1000, max: Infinity, label: "Legend", emoji: "👑", color: "text-purple-700" },
];

function getShameLevel(amount) {
  return SHAME_LEVELS.find((s) => amount >= s.min && amount < s.max) || SHAME_LEVELS[SHAME_LEVELS.length - 1];
}

export default function Casino() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [game, setGame] = useState("Blackjack");
  const [amount, setAmount] = useState("");
  const [isWin, setIsWin] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "casino"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Attempt to autoplay the Casino Confessional anthem on mount.
  // Browsers may block this if the user hasn't interacted with the tab yet —
  // we fall back to a visible play button in that case.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.6;

    const tryPlay = async () => {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };
    tryPlay();

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.pause();
    };
  }, []);

  const togglePlayback = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      try { await el.play(); } catch {}
    } else {
      el.pause();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || num > 50000) return;
    setSubmitting(true);

    await addDoc(collection(db, "casino"), {
      game,
      amount: Math.round(num * 100) / 100,
      isWin,
      note: note.replace(/[<>{}$]/g, "").slice(0, 150).trim(),
      authorName: profile?.displayName || user?.email || "Anonymous",
      authorUid: user?.uid,
      createdAt: serverTimestamp(),
    });

    setAmount("");
    setNote("");
    setIsWin(false);
    setGame("Blackjack");
    setShowForm(false);
    setSubmitting(false);
  };

  // Leaderboard of shame
  const byPerson = {};
  entries.forEach((e) => {
    if (!byPerson[e.authorName]) byPerson[e.authorName] = { won: 0, lost: 0, entries: 0 };
    byPerson[e.authorName].entries++;
    if (e.isWin) byPerson[e.authorName].won += e.amount;
    else byPerson[e.authorName].lost += e.amount;
  });

  const leaderboard = Object.entries(byPerson)
    .map(([name, data]) => ({ name, ...data, net: data.won - data.lost }))
    .sort((a, b) => a.net - b.net); // worst losses first

  const totalLost = leaderboard.reduce((s, p) => s + p.lost, 0);
  const totalWon = leaderboard.reduce((s, p) => s + p.won, 0);

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201,162,39,0.15) 20px, rgba(201,162,39,0.15) 21px)`,
             }} />
        <div className="max-w-5xl mx-auto px-6 py-14 text-center relative z-10">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            The Cherokee Treasury Report
          </p>
          <h1 className="text-cream text-3xl md:text-5xl font-bold m-0">
            Casino <span className="text-gold">Confessional</span>
          </h1>
          <p className="text-cream/40 text-sm mt-3 m-0 font-serif italic">
            "What happens at Harrah's gets posted on this website."
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hidden audio element — attempts autoplay on mount */}
        <audio
          ref={audioRef}
          src="/audio/patrick-ashlyn-tragedy-jt-remix.mp3"
          preload="auto"
        />

        {/* Now Playing */}
        <div className="bg-gradient-to-r from-pine to-pine-light rounded-2xl border border-gold/30 p-5 mb-10 flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-12 h-12 rounded-full bg-gold text-pine flex items-center justify-center border-none cursor-pointer hover:brightness-110 transition-all shrink-0"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-gold/60 text-[10px] tracking-[0.2em] uppercase m-0 mb-1">
              {isPlaying ? "Now Playing" : "Official Anthem"}
            </p>
            <p className="text-cream text-sm md:text-base font-bold m-0 truncate">
              Tragedy (JT Remix)
            </p>
            <p className="text-cream/50 text-[11px] m-0 mt-0.5 font-serif italic truncate">
              Patrick &amp; Ashlyn
            </p>
          </div>
          {isPlaying && (
            <div className="hidden sm:flex items-end gap-0.5 h-6">
              <span className="w-1 bg-gold animate-pulse" style={{ height: "40%", animationDelay: "0ms" }} />
              <span className="w-1 bg-gold animate-pulse" style={{ height: "75%", animationDelay: "150ms" }} />
              <span className="w-1 bg-gold animate-pulse" style={{ height: "55%", animationDelay: "300ms" }} />
              <span className="w-1 bg-gold animate-pulse" style={{ height: "90%", animationDelay: "450ms" }} />
              <span className="w-1 bg-gold animate-pulse" style={{ height: "45%", animationDelay: "600ms" }} />
            </div>
          )}
        </div>

        {/* Phil Quote */}
        <div className="bg-pine rounded-2xl p-8 text-center mb-10 border border-gold/20">
          <p className="text-gold font-serif italic text-lg md:text-xl m-0 leading-relaxed">
            "You'll lose a lot of money chasing women but you'll never lose women while chasing money."
          </p>
          <p className="text-cream/40 text-xs mt-3 m-0 tracking-wider uppercase">&mdash; Phil</p>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-cream-dark p-6 text-center">
            <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0 mb-1">Total Donated to Casino</p>
            <p className="text-red-600 text-2xl md:text-3xl font-bold font-serif m-0">${totalLost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark p-6 text-center">
            <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0 mb-1">Total Won Back</p>
            <p className="text-emerald-600 text-2xl md:text-3xl font-bold font-serif m-0">${totalWon.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark p-6 text-center">
            <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0 mb-1">Net Group Damage</p>
            <p className={`text-2xl md:text-3xl font-bold font-serif m-0 ${totalWon - totalLost >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalWon - totalLost >= 0 ? "+" : ""}${(totalWon - totalLost).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Leaderboard of Shame */}
        {leaderboard.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-cream-dark" />
              <h2 className="text-pine text-lg m-0 whitespace-nowrap">The Wall of Shame</h2>
              <div className="h-px flex-1 bg-cream-dark" />
            </div>
            <div className="space-y-3">
              {leaderboard.map((p, i) => {
                const shame = getShameLevel(p.lost);
                return (
                  <div key={p.name} className="bg-white rounded-xl border border-cream-dark p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{i === 0 && leaderboard.length > 1 ? "🤡" : shame.emoji}</span>
                        <div>
                          <p className="text-pine text-sm font-bold m-0">
                            {p.name}
                            {i === 0 && leaderboard.length > 1 && p.net < 0 && (
                              <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                BIGGEST LOSER
                              </span>
                            )}
                          </p>
                          <p className={`text-xs m-0 ${shame.color} font-semibold`}>
                            {shame.label} &middot; {p.entries} {p.entries === 1 ? "session" : "sessions"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold font-serif m-0 ${p.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {p.net >= 0 ? "+" : ""}${p.net.toFixed(2)}
                        </p>
                        <p className="text-charcoal/30 text-[10px] m-0">
                          Won ${p.won.toFixed(2)} &middot; Lost ${p.lost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Log Entry Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full py-4 bg-pine text-cream font-semibold text-sm rounded-xl cursor-pointer border-none hover:bg-pine-light transition-colors"
          >
            {showForm ? "Cancel" : "+ Log a Casino Session"}
          </button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-cream-dark p-6 mb-8 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                  Game
                </label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
                >
                  {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setIsWin(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all ${
                  !isWin ? "bg-red-100 text-red-700 ring-2 ring-red-300" : "bg-cream text-charcoal/40"
                }`}
              >
                Lost It
              </button>
              <button
                type="button"
                onClick={() => setIsWin(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all ${
                  isWin ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-cream text-charcoal/40"
                }`}
              >
                Won It
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Notes (optional &mdash; excuses, bad beats, delusions)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='e.g. "Dealer had 5 blackjacks in a row, rigged"'
                maxLength={150}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !amount}
              className="py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {submitting ? "Logging..." : "Confess"}
            </button>
          </form>
        )}

        {/* Activity Feed */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-cream-dark" />
            <h2 className="text-pine text-lg m-0 whitespace-nowrap">Live Feed of Regret</h2>
            <div className="h-px flex-1 bg-cream-dark" />
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
              No casino sessions logged yet. The night is young.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl border border-cream-dark p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${entry.isWin ? "bg-emerald-600" : "bg-red-500"}`}>
                        {entry.isWin ? "W" : "L"}
                      </div>
                      <div>
                        <p className="text-pine text-sm font-semibold m-0">{entry.authorName}</p>
                        <p className="text-charcoal/30 text-[11px] m-0">
                          {entry.game} &middot;{" "}
                          {entry.createdAt?.toDate?.()
                            ? entry.createdAt.toDate().toLocaleDateString("en-US", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })
                            : "Just now"}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold font-serif m-0 ${entry.isWin ? "text-emerald-600" : "text-red-600"}`}>
                      {entry.isWin ? "+" : "-"}${entry.amount.toFixed(2)}
                    </p>
                  </div>
                  {entry.note && (
                    <p className="text-charcoal/50 text-xs mt-2 m-0 italic pl-11">"{entry.note}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 text-center mt-10">
          <p className="text-pine font-serif italic text-sm m-0">
            "The house always wins. But the memories of watching your friends lose are priceless."
          </p>
          <p className="text-charcoal/30 text-[10px] mt-2 m-0">&mdash; The Committee</p>
        </div>
      </div>
    </div>
  );
}
