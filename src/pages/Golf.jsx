import { useState, useEffect } from "react";
import {
  collection, doc, setDoc, onSnapshot, query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const COURSES = [
  { day: "thu", dayLabel: "Day 1 \u2014 Thursday", name: "Sequoyah National Golf Club", par: 72 },
  { day: "fri", dayLabel: "Day 2 \u2014 Friday", name: "Smoky Mountain Country Club", par: 71 },
  { day: "sat", dayLabel: "Day 3 \u2014 Saturday", name: "Laurel Ridge Country Club", par: 72 },
];

const BETS = [
  { name: "Low Gross (Overall)", desc: "Lowest total gross score across all rounds played", payout: "$100" },
  { name: "Low Net (Overall)", desc: "Lowest total net score (gross minus handicap) across all rounds", payout: "$75" },
  { name: "Daily Skins", desc: "Low score on each hole wins the skin. Ties push to next hole.", payout: "$5/hole" },
  { name: "Nassau (per round)", desc: "Front 9, Back 9, and Overall. $10 each way per match.", payout: "$10/press" },
  { name: "Closest to Pin (par 3s)", desc: "Closest tee shot to the pin on designated par 3s each day.", payout: "$20/hole" },
  { name: "Longest Drive (per round)", desc: "One designated hole per round, longest drive in the fairway.", payout: "$20" },
];

export default function Golf() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("scores");
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [selectedDay, setSelectedDay] = useState("thu");
  const [selectedPlayer, setSelectedPlayer] = useState("");

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "users")), (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(query(collection(db, "scores")), (snap) => {
      const s = {};
      snap.docs.forEach((d) => { s[d.id] = d.data(); });
      setScores(s);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    if (user && !selectedPlayer) setSelectedPlayer(user.uid);
  }, [user, selectedPlayer]);

  const course = COURSES.find((c) => c.day === selectedDay);

  const saveScore = async (hole, val) => {
    const key = `${selectedPlayer}-${selectedDay}`;
    const current = scores[key] || {};
    await setDoc(doc(db, "scores", key), { ...current, [hole]: val });
  };

  const getScoreData = (playerId, day) => {
    const key = `${playerId}-${day}`;
    return scores[key] || {};
  };

  const calcTotal = (scoreObj) =>
    Array.from({ length: 18 }, (_, i) => parseInt(scoreObj[i + 1]) || 0).reduce((a, b) => a + b, 0);

  const front9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const back9 = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  const playerScores = getScoreData(selectedPlayer, selectedDay);
  const frontTotal = front9.reduce((s, h) => s + (parseInt(playerScores[h]) || 0), 0);
  const backTotal = back9.reduce((s, h) => s + (parseInt(playerScores[h]) || 0), 0);
  const total = frontTotal + backTotal;

  // Standings
  const standings = players.map((p) => {
    let totalGross = 0;
    let roundsPlayed = 0;
    COURSES.forEach((c) => {
      const s = getScoreData(p.id, c.day);
      const rt = calcTotal(s);
      if (rt > 0) { totalGross += rt; roundsPlayed++; }
    });
    const totalNet = totalGross - ((p.handicap || 0) * roundsPlayed);
    return { ...p, totalGross, totalNet, roundsPlayed };
  }).filter((p) => p.roundsPlayed > 0);

  const byGross = [...standings].sort((a, b) => a.totalGross - b.totalGross);
  const byNet = [...standings].sort((a, b) => a.totalNet - b.totalNet);

  const TABS = [
    { id: "scores", label: "Score Entry" },
    { id: "standings", label: "Standings" },
    { id: "bets", label: "Bets & Side Action" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Record Your Shame for Posterity
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            Golf HQ
          </h1>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="bg-white border-b border-cream-dark sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs font-semibold border-none cursor-pointer transition-all whitespace-nowrap bg-transparent ${
                tab === t.id ? "text-pine" : "text-charcoal/40 hover:text-pine"
              }`}
              style={tab === t.id ? { borderBottom: "2px solid #c9a227" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* SCORE ENTRY */}
        {tab === "scores" && (
          <div>
            {/* Day picker */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {COURSES.map((c) => (
                <button
                  key={c.day}
                  onClick={() => setSelectedDay(c.day)}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
                    selectedDay === c.day
                      ? "bg-pine text-cream"
                      : "bg-white text-charcoal/50 border border-cream-dark hover:bg-cream"
                  }`}
                >
                  {c.dayLabel}
                </button>
              ))}
            </div>

            {/* Player picker */}
            <div className="mb-6">
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Player
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full max-w-xs p-3 border border-cream-dark rounded-xl text-sm bg-white"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} {p.handicap ? `(HCP: ${p.handicap})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {course && (
              <>
                <p className="text-pine font-serif font-bold text-base mb-6 m-0">
                  {course.name} &middot; Par {course.par}
                </p>

                {/* Front 9 */}
                <div className="mb-6">
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-3">Front 9</h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {front9.map((h) => (
                      <div key={h} className="text-center">
                        <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">#{h}</p>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={playerScores[h] || ""}
                          onChange={(e) => saveScore(h, e.target.value)}
                          placeholder="–"
                          className="w-full h-10 text-center border border-cream-dark rounded-lg text-sm font-bold font-serif text-pine bg-white"
                        />
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">OUT</p>
                      <div className="w-full h-10 flex items-center justify-center bg-gold/10 rounded-lg text-pine font-bold font-serif text-sm">
                        {frontTotal || "–"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back 9 */}
                <div className="mb-6">
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-3">Back 9</h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {back9.map((h) => (
                      <div key={h} className="text-center">
                        <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">#{h}</p>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={playerScores[h] || ""}
                          onChange={(e) => saveScore(h, e.target.value)}
                          placeholder="–"
                          className="w-full h-10 text-center border border-cream-dark rounded-lg text-sm font-bold font-serif text-pine bg-white"
                        />
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">IN</p>
                      <div className="w-full h-10 flex items-center justify-center bg-gold/10 rounded-lg text-pine font-bold font-serif text-sm">
                        {backTotal || "–"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-pine text-cream rounded-xl px-6 py-4 flex items-center gap-4 font-serif">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-3xl font-bold">{total || "–"}</span>
                  {total > 0 && course && (
                    <span className="text-cream/50 text-sm">
                      ({total > course.par ? "+" : ""}{total - course.par} to par)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* STANDINGS */}
        {tab === "standings" && (
          <div>
            {standings.length === 0 ? (
              <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
                No scores entered yet. Head to Score Entry to start recording rounds.
              </p>
            ) : (
              <>
                {/* Gross */}
                <h3 className="text-pine text-base font-bold m-0 mb-4">Gross Standings</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-hidden mb-8">
                  <div className="bg-pine px-5 py-3 grid grid-cols-[2rem_1fr_4rem_4rem] gap-2 text-cream text-[10px] tracking-wider uppercase font-semibold">
                    <span>#</span><span>Player</span><span className="text-center">Rnds</span><span className="text-right">Gross</span>
                  </div>
                  {byGross.map((p, i) => (
                    <div key={p.id} className={`px-5 py-3 grid grid-cols-[2rem_1fr_4rem_4rem] gap-2 text-sm border-b border-cream-dark last:border-none ${i === 0 ? "bg-gold/5" : ""}`}>
                      <span className={`font-bold ${i === 0 ? "text-gold" : "text-charcoal/30"}`}>{i + 1}</span>
                      <span className="font-semibold text-pine">{p.displayName}</span>
                      <span className="text-center text-charcoal/40">{p.roundsPlayed}</span>
                      <span className="text-right font-bold font-serif text-pine text-lg">{p.totalGross}</span>
                    </div>
                  ))}
                </div>

                {/* Net */}
                <h3 className="text-pine text-base font-bold m-0 mb-4">Net Standings (Handicap Adjusted)</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-hidden mb-8">
                  <div className="bg-pine px-5 py-3 grid grid-cols-[2rem_1fr_3rem_4rem] gap-2 text-cream text-[10px] tracking-wider uppercase font-semibold">
                    <span>#</span><span>Player</span><span className="text-center">HCP</span><span className="text-right">Net</span>
                  </div>
                  {byNet.map((p, i) => (
                    <div key={p.id} className={`px-5 py-3 grid grid-cols-[2rem_1fr_3rem_4rem] gap-2 text-sm border-b border-cream-dark last:border-none ${i === 0 ? "bg-gold/5" : ""}`}>
                      <span className={`font-bold ${i === 0 ? "text-gold" : "text-charcoal/30"}`}>{i + 1}</span>
                      <span className="font-semibold text-pine">{p.displayName}</span>
                      <span className="text-center text-charcoal/40">{p.handicap || 0}</span>
                      <span className="text-right font-bold font-serif text-pine text-lg">{p.totalNet}</span>
                    </div>
                  ))}
                </div>

                {/* Round by Round */}
                <h3 className="text-pine text-base font-bold m-0 mb-4">Round-by-Round</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-pine text-cream text-[10px] tracking-wider uppercase">
                        <th className="text-left px-4 py-3 font-semibold">Player</th>
                        {COURSES.map((c) => (
                          <th key={c.day} className="text-center px-4 py-3 font-semibold">{c.dayLabel.split("\u2014")[0].trim()}</th>
                        ))}
                        <th className="text-right px-4 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byGross.map((p) => (
                        <tr key={p.id} className="border-b border-cream-dark last:border-none">
                          <td className="px-4 py-3 font-semibold text-pine">{p.displayName}</td>
                          {COURSES.map((c) => {
                            const rt = calcTotal(getScoreData(p.id, c.day));
                            return <td key={c.day} className="text-center px-4 py-3 font-serif">{rt || "–"}</td>;
                          })}
                          <td className="text-right px-4 py-3 font-bold font-serif text-pine">{p.totalGross}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* BETS */}
        {tab === "bets" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Bets & Side Action</h2>
              <p className="text-charcoal/50 text-sm m-0 font-serif italic">
                All bets settled Sunday evening. The Committee does not offer installment plans.
              </p>
            </div>
            <div className="space-y-3">
              {BETS.map((b) => (
                <div key={b.name} className="bg-white rounded-xl border border-cream-dark p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-pine text-base font-bold m-0">{b.name}</h3>
                    <span className="bg-gold/10 text-gold-dark px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      {b.payout}
                    </span>
                  </div>
                  <p className="text-charcoal/50 text-sm mt-2 m-0 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
