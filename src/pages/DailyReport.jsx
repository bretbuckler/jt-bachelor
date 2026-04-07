import { useState, useEffect, useRef } from "react";
import {
  collection, doc, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const COURSES = [
  { day: "thu", label: "Thursday, June 18", name: "Sequoyah National Golf Club", par: 72, format: "2-Man Scramble",
    pars: [5,3,5,4,4,3,4,3,5,4,5,5,3,4,4,4,3,4], hdcps: [5,11,7,9,15,1,13,17,3,6,10,2,8,18,14,16,4,12] },
  { day: "fri", label: "Friday, June 19", name: "Smoky Mountain Country Club", par: 71, format: "Best Ball / Alt Shot",
    pars: [4,4,4,4,5,5,3,5,3,3,4,4,3,5,5,3,3,4], hdcps: [7,15,17,9,5,3,13,1,11,4,2,18,16,6,10,8,14,12] },
  { day: "sat", label: "Saturday, June 20", name: "Laurel Ridge Country Club", par: 72, format: "Individual Match Play",
    pars: [4,4,3,4,5,4,5,3,4,3,5,4,4,4,5,4,3,4], hdcps: [13,9,15,5,7,11,1,17,3,14,2,6,16,8,12,4,18,10] },
];

function getStrokesPerHole(handicap, hdcps) {
  const strokes = new Array(18).fill(0);
  if (!hdcps) return strokes;
  const sorted = hdcps.map((h, i) => ({ idx: i, d: h })).sort((a, b) => a.d - b.d);
  for (let i = 0; i < Math.min(handicap, 36); i++) strokes[sorted[i % 18].idx]++;
  return strokes;
}

export default function DailyReport() {
  const { profile } = useAuth();
  const [selectedDay, setSelectedDay] = useState("thu");
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [casinoEntries, setCasinoEntries] = useState([]);
  const [boardPosts, setBoardPosts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const reportRef = useRef(null);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "users")), (s) => setPlayers(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "scores")), (s) => { const o = {}; s.docs.forEach((d) => { o[d.id] = d.data(); }); setScores(o); }),
      onSnapshot(query(collection(db, "casino"), orderBy("createdAt", "desc")), (s) => setCasinoEntries(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "board_posts"), orderBy("createdAt", "desc")), (s) => setBoardPosts(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "photos"), orderBy("createdAt", "desc")), (s) => setPhotos(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const course = COURSES.find((c) => c.day === selectedDay);
  const dayDate = course?.label || "";

  // Golf scores for this day
  const golfData = players.map((p) => {
    const key = `${p.id}-${selectedDay}`;
    const s = scores[key] || {};
    const pStrokes = getStrokesPerHole(p.handicap || 0, course?.hdcps);
    let gross = 0, net = 0, birdies = 0, eagles = 0, played = false;
    const holeScores = [];
    for (let h = 0; h < 18; h++) {
      const g = parseInt(s[h + 1]) || 0;
      if (g > 0) {
        played = true;
        const n = g - pStrokes[h];
        gross += g;
        net += n;
        if (n <= course.pars[h] - 2) eagles++;
        else if (n === course.pars[h] - 1) birdies++;
        holeScores.push({ hole: h + 1, gross: g, net: n, par: course.pars[h], diff: n - course.pars[h] });
      } else {
        holeScores.push(null);
      }
    }
    return { ...p, gross, net, birdies, eagles, played, holeScores, toPar: net - course.par };
  }).filter((p) => p.played).sort((a, b) => a.toPar - b.toPar);

  // Casino entries (all, we'll show totals)
  const casinoByPerson = {};
  casinoEntries.forEach((e) => {
    if (!casinoByPerson[e.authorName]) casinoByPerson[e.authorName] = { won: 0, lost: 0, sessions: [] };
    if (e.isWin) casinoByPerson[e.authorName].won += e.amount;
    else casinoByPerson[e.authorName].lost += e.amount;
    casinoByPerson[e.authorName].sessions.push(e);
  });
  const casinoLeaderboard = Object.entries(casinoByPerson)
    .map(([name, d]) => ({ name, ...d, net: d.won - d.lost }))
    .sort((a, b) => a.net - b.net);
  const totalCasinoLost = casinoLeaderboard.reduce((s, p) => s + p.lost, 0);
  const totalCasinoWon = casinoLeaderboard.reduce((s, p) => s + p.won, 0);

  // Recent board posts (last 10)
  const recentPosts = boardPosts.slice(0, 10);

  // Recent photos (last 8)
  const recentPhotos = photos.slice(0, 8);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            The Official Record
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            Daily Report
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            A comprehensive summary for the big screen
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div className="flex gap-2 flex-wrap">
            {COURSES.map((c) => (
              <button key={c.day} onClick={() => setSelectedDay(c.day)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
                  selectedDay === c.day ? "bg-pine text-cream" : "bg-white text-charcoal/50 hover:bg-cream"
                }`}>
                {c.label.split(",")[0]}
              </button>
            ))}
          </div>
          <button onClick={handlePrint}
            className="py-2 px-6 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-xs rounded-xl cursor-pointer border-none hover:brightness-110 transition-all">
            Print / Save PDF
          </button>
        </div>

        {/* ── REPORT CONTENT ── */}
        <div ref={reportRef}>
          {/* Report Header */}
          <div className="bg-pine rounded-2xl p-8 text-center mb-8 print:rounded-none print:mb-4">
            <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-2">
              The Honorable Society of JT's Last Round
            </p>
            <h2 className="text-cream text-2xl md:text-3xl font-bold m-0">
              {dayDate}
            </h2>
            <p className="text-cream/40 text-sm mt-2 m-0">
              {course?.name} &middot; Par {course?.par} &middot; {course?.format}
            </p>
          </div>

          {/* ── GOLF LEADERBOARD ── */}
          <div className="mb-8">
            <h3 className="text-pine text-lg font-bold m-0 mb-4 flex items-center gap-2">
              <span>&#9971;</span> Golf Leaderboard
            </h3>
            {golfData.length === 0 ? (
              <p className="text-charcoal/40 text-sm font-serif italic">No scores recorded for this day.</p>
            ) : (
              <div className="bg-pine rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-gold/60 text-[10px] tracking-wider uppercase w-8">#</th>
                      <th className="text-left px-3 py-3 text-cream/80 text-[10px] tracking-wider uppercase">Player</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">HCP</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">Gross</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">Net</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">To Par</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">Birdies</th>
                      <th className="text-center px-3 py-3 text-cream/60 text-[10px] uppercase">Eagles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {golfData.map((p, i) => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td className="px-4 py-3 text-gold font-bold">{i + 1}</td>
                        <td className="px-3 py-3 text-cream font-bold text-xs uppercase tracking-wide">{p.displayName}</td>
                        <td className="text-center px-3 py-3 text-cream/40">{p.handicap || 0}</td>
                        <td className="text-center px-3 py-3 text-cream font-serif font-bold">{p.gross}</td>
                        <td className="text-center px-3 py-3 text-cream font-serif font-bold">{p.net}</td>
                        <td className="text-center px-3 py-3">
                          <span className={`font-bold font-serif ${
                            p.toPar < 0 ? "text-red-400" : p.toPar === 0 ? "text-green-400" : "text-cream/50"
                          }`}>
                            {p.toPar === 0 ? "E" : p.toPar > 0 ? `+${p.toPar}` : p.toPar}
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          {p.birdies > 0 ? <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold">{p.birdies}</span> : <span className="text-cream/20">0</span>}
                        </td>
                        <td className="text-center px-3 py-3">
                          {p.eagles > 0 ? <span className="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">{p.eagles}</span> : <span className="text-cream/20">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── CASINO REPORT ── */}
          <div className="mb-8">
            <h3 className="text-pine text-lg font-bold m-0 mb-4 flex items-center gap-2">
              <span>&#127920;</span> Casino Report
            </h3>
            {casinoLeaderboard.length === 0 ? (
              <p className="text-charcoal/40 text-sm font-serif italic">No casino sessions logged yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
                    <p className="text-charcoal/30 text-[9px] tracking-wider uppercase m-0">Donated</p>
                    <p className="text-red-600 text-xl font-bold font-serif m-0">${totalCasinoLost.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
                    <p className="text-charcoal/30 text-[9px] tracking-wider uppercase m-0">Won Back</p>
                    <p className="text-emerald-600 text-xl font-bold font-serif m-0">${totalCasinoWon.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-cream-dark p-4 text-center">
                    <p className="text-charcoal/30 text-[9px] tracking-wider uppercase m-0">Net Damage</p>
                    <p className={`text-xl font-bold font-serif m-0 ${totalCasinoWon - totalCasinoLost >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {totalCasinoWon - totalCasinoLost >= 0 ? "+" : ""}${(totalCasinoWon - totalCasinoLost).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                  {casinoLeaderboard.map((p, i) => (
                    <div key={p.name} className={`px-5 py-3 flex items-center justify-between border-b border-cream-dark last:border-none ${i === 0 ? "bg-red-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{i === 0 && casinoLeaderboard.length > 1 && p.net < 0 ? "\uD83E\uDD21" : ""}</span>
                        <div>
                          <p className="text-pine text-sm font-bold m-0">
                            {p.name}
                            {i === 0 && casinoLeaderboard.length > 1 && p.net < 0 && (
                              <span className="ml-2 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">BIGGEST LOSER</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold font-serif ${p.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {p.net >= 0 ? "+" : ""}${p.net.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── BOARD POSTS ── */}
          <div className="mb-8">
            <h3 className="text-pine text-lg font-bold m-0 mb-4 flex items-center gap-2">
              <span>&#128203;</span> Recent Board Posts
            </h3>
            {recentPosts.length === 0 ? (
              <p className="text-charcoal/40 text-sm font-serif italic">No board posts yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border border-cream-dark p-4 flex items-start gap-3">
                    <div className="w-7 h-7 bg-pine rounded-full flex items-center justify-center text-cream text-[10px] font-bold shrink-0 mt-0.5">
                      {(post.authorName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-pine text-xs font-bold m-0">{post.authorName}</p>
                        <span className="text-charcoal/20 text-[10px]">
                          {post.createdAt?.toDate?.()?.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) || ""}
                        </span>
                      </div>
                      <p className="text-charcoal/60 text-xs m-0 mt-0.5 truncate">{post.message}</p>
                      {post.amount && <p className="text-pine font-bold font-serif text-sm m-0">${post.amount.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PHOTOS ── */}
          <div className="mb-8">
            <h3 className="text-pine text-lg font-bold m-0 mb-4 flex items-center gap-2">
              <span>&#128248;</span> Recent Photos
            </h3>
            {recentPhotos.length === 0 ? (
              <p className="text-charcoal/40 text-sm font-serif italic">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recentPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-cream-dark">
                    <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── AWARDS ── */}
          <div className="mb-8">
            <h3 className="text-pine text-lg font-bold m-0 mb-4 flex items-center gap-2">
              <span>&#127942;</span> Daily Awards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {golfData.length > 0 && (
                <>
                  <div className="bg-white rounded-xl border border-cream-dark p-5 text-center">
                    <p className="text-gold text-2xl m-0 mb-2">&#127942;</p>
                    <p className="text-charcoal/40 text-[10px] tracking-wider uppercase m-0">Low Net</p>
                    <p className="text-pine text-lg font-bold font-serif m-0 mt-1">{golfData[0]?.displayName}</p>
                    <p className="text-charcoal/50 text-xs m-0">Net {golfData[0]?.net} ({golfData[0]?.toPar === 0 ? "E" : golfData[0]?.toPar > 0 ? `+${golfData[0]?.toPar}` : golfData[0]?.toPar})</p>
                  </div>
                  {(() => {
                    const mostBirdies = [...golfData].sort((a, b) => b.birdies - a.birdies)[0];
                    return mostBirdies?.birdies > 0 ? (
                      <div className="bg-white rounded-xl border border-cream-dark p-5 text-center">
                        <p className="text-red-500 text-2xl m-0 mb-2">&#128308;</p>
                        <p className="text-charcoal/40 text-[10px] tracking-wider uppercase m-0">Most Birdies</p>
                        <p className="text-pine text-lg font-bold font-serif m-0 mt-1">{mostBirdies.displayName}</p>
                        <p className="text-charcoal/50 text-xs m-0">{mostBirdies.birdies} birdie{mostBirdies.birdies > 1 ? "s" : ""}</p>
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const worst = [...golfData].sort((a, b) => b.toPar - a.toPar)[0];
                    return golfData.length > 1 ? (
                      <div className="bg-white rounded-xl border border-cream-dark p-5 text-center">
                        <p className="text-2xl m-0 mb-2">&#129313;</p>
                        <p className="text-charcoal/40 text-[10px] tracking-wider uppercase m-0">Worst Round</p>
                        <p className="text-pine text-lg font-bold font-serif m-0 mt-1">{worst?.displayName}</p>
                        <p className="text-charcoal/50 text-xs m-0">Net {worst?.net} (+{worst?.toPar})</p>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 text-center">
            <p className="text-pine font-serif italic text-sm m-0">
              "The Committee has reviewed the day's proceedings and finds them... entertaining."
            </p>
            <p className="text-charcoal/20 text-[10px] mt-3 m-0">
              Generated by The Honorable Society of JT's Last Round &middot; Cherokee, NC &middot; June 2026
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, footer, .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .bg-pine { background: #1a3a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-white { background: white !important; }
          .bg-red-50 { background: #fef2f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-gold\\/20 { background: rgba(201,162,39,0.2) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .text-cream { color: #f4f1e8 !important; }
          .text-gold { color: #c9a227 !important; }
          .text-red-400 { color: #f87171 !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-emerald-600 { color: #059669 !important; }
          .text-green-400 { color: #4ade80 !important; }
        }
      `}</style>
    </div>
  );
}
