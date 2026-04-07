import { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ── COURSE DATA ──
// TODO: Replace placeholder pars with real scorecard data
const COURSES = [
  {
    day: "thu",
    dayLabel: "Day 1 — Thursday",
    name: "Sequoyah National Golf Club",
    par: 72,
    format: "2-Man Scramble",
    //        H1  H2  H3  H4  H5  H6  H7  H8  H9  H10 H11 H12 H13 H14 H15 H16 H17 H18
    pars:   [ 5,  3,  5,  4,  4,  3,  4,  3,  5,   4,  5,  5,  3,  4,  4,  4,  3,  4],
    hdcps:  [ 5, 11,  7,  9, 15,  1, 13, 17,  3,   6, 10,  2,  8, 18, 14, 16,  4, 12],
  },
  {
    day: "fri",
    dayLabel: "Day 2 — Friday",
    name: "Smoky Mountain Country Club",
    par: 71,
    format: "Best Ball / Alt Shot",
    pars:   [ 4,  4,  4,  4,  5,  5,  3,  5,  3,   3,  4,  4,  3,  5,  5,  3,  3,  4],
    hdcps:  [ 7, 15, 17,  9,  5,  3, 13,  1, 11,   4,  2, 18, 16,  6, 10,  8, 14, 12],
  },
  {
    day: "sat",
    dayLabel: "Day 3 — Saturday",
    name: "Laurel Ridge Country Club",
    par: 72,
    format: "Individual Match Play",
    pars:   [ 4,  4,  3,  4,  5,  4,  5,  3,  4,   3,  5,  4,  4,  4,  5,  4,  3,  4],
    hdcps:  [13,  9, 15,  5,  7, 11,  1, 17,  3,  14,  2,  6, 16,  8, 12,  4, 18, 10],
  },
];

// ── TEAMS ──
// TODO: Fill in real rosters when captains pick teams
const TEAMS = {
  A: { name: "Team Birdie Juice", color: "emerald", members: [] },
  B: { name: "Team Shank Redemption", color: "amber", members: [] },
};

const BETS = [
  { name: "Low Gross (Overall)", desc: "Lowest total gross score across all rounds played", payout: "$100" },
  { name: "Low Net (Overall)", desc: "Lowest total net score (gross minus handicap) across all rounds", payout: "$75" },
  { name: "Daily Skins", desc: "Low score on each hole wins the skin. Ties push to next hole.", payout: "$5/hole" },
  { name: "Nassau (per round)", desc: "Front 9, Back 9, and Overall. $10 each way per match.", payout: "$10/press" },
  { name: "Closest to Pin (par 3s)", desc: "Closest tee shot to the pin on designated par 3s each day.", payout: "$20/hole" },
  { name: "Longest Drive (per round)", desc: "One designated hole per round, longest drive in the fairway.", payout: "$20" },
];

// ── HANDICAP STROKES ──
// Distributes handicap strokes using course handicap index (hardest holes first)
// hdcps array: 1 = hardest hole, 18 = easiest hole
function getStrokesPerHole(handicap, hdcps) {
  const strokes = new Array(18).fill(0);
  if (!hdcps) return strokes;
  // Sort hole indices by difficulty (lowest hdcp = hardest = gets strokes first)
  const sortedByDifficulty = hdcps
    .map((h, i) => ({ holeIndex: i, difficulty: h }))
    .sort((a, b) => a.difficulty - b.difficulty);
  for (let i = 0; i < Math.min(handicap, 36); i++) {
    strokes[sortedByDifficulty[i % 18].holeIndex]++;
  }
  return strokes;
}

export default function Golf() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("leaderboard");
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

  const getScoreData = (playerId, day) => scores[`${playerId}-${day}`] || {};

  const calcTotal = (scoreObj) =>
    Array.from({ length: 18 }, (_, i) => parseInt(scoreObj[i + 1]) || 0).reduce((a, b) => a + b, 0);

  const front9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const back9 = [10, 11, 12, 13, 14, 15, 16, 17, 18];

  // Current player's scorecard data
  const playerScores = getScoreData(selectedPlayer, selectedDay);
  const currentPlayer = players.find((p) => p.id === selectedPlayer);
  const handicap = currentPlayer?.handicap || 0;
  const strokesPerHole = getStrokesPerHole(handicap, course?.hdcps);

  const frontTotal = front9.reduce((s, h) => s + (parseInt(playerScores[h]) || 0), 0);
  const backTotal = back9.reduce((s, h) => s + (parseInt(playerScores[h]) || 0), 0);
  const total = frontTotal + backTotal;

  // Net score per hole
  const getNetScore = (grossScore, holeIndex) => {
    if (!grossScore) return null;
    return grossScore - strokesPerHole[holeIndex];
  };

  // Score color coding relative to par
  const getScoreColor = (gross, holeIndex) => {
    if (!gross) return "";
    const net = getNetScore(gross, holeIndex);
    const par = course?.pars[holeIndex];
    if (!par || net === null) return "";
    const diff = net - par;
    if (diff <= -2) return "bg-yellow-300 text-yellow-900"; // eagle or better
    if (diff === -1) return "bg-red-100 text-red-700";      // birdie
    if (diff === 0) return "bg-emerald-50 text-emerald-700"; // par
    if (diff === 1) return "bg-blue-50 text-blue-600";       // bogey
    return "bg-charcoal/5 text-charcoal/50";                 // double+
  };

  // ── TOURNAMENT POINTS CALCULATOR ──
  const tournamentData = useMemo(() => {
    const data = players.map((p) => {
      let totalGross = 0;
      let totalNet = 0;
      let roundsPlayed = 0;
      let totalNetBirdies = 0;
      let totalNetEagles = 0;
      const dailyData = {};

      COURSES.forEach((c) => {
        const s = getScoreData(p.id, c.day);
        const rt = calcTotal(s);
        if (rt <= 0) {
          dailyData[c.day] = { gross: 0, net: 0, birdies: 0, eagles: 0, played: false };
          return;
        }

        roundsPlayed++;
        const pStrokes = getStrokesPerHole(p.handicap || 0, c.hdcps);
        let dayGross = 0;
        let dayNet = 0;
        let dayBirdies = 0;
        let dayEagles = 0;

        for (let h = 0; h < 18; h++) {
          const gross = parseInt(s[h + 1]) || 0;
          if (gross <= 0) continue;
          const net = gross - pStrokes[h];
          const par = c.pars[h];
          dayGross += gross;
          dayNet += net;
          if (net <= par - 2) dayEagles++;
          else if (net === par - 1) dayBirdies++;
        }

        totalGross += dayGross;
        totalNet += dayNet;
        totalNetBirdies += dayBirdies;
        totalNetEagles += dayEagles;
        dailyData[c.day] = { gross: dayGross, net: dayNet, birdies: dayBirdies, eagles: dayEagles, played: true };
      });

      // Team points from individual bonuses
      const bonusPoints = (totalNetBirdies * 1) + (totalNetEagles * 3);

      return {
        ...p,
        totalGross,
        totalNet,
        roundsPlayed,
        totalNetBirdies,
        totalNetEagles,
        bonusPoints,
        dailyData,
      };
    }).filter((p) => p.roundsPlayed > 0);

    // Daily low net bonus (+2 pts)
    const dailyLowNet = {};
    COURSES.forEach((c) => {
      const playedToday = data.filter((p) => p.dailyData[c.day]?.played);
      if (playedToday.length === 0) return;
      const lowest = Math.min(...playedToday.map((p) => p.dailyData[c.day].net));
      const winner = playedToday.find((p) => p.dailyData[c.day].net === lowest);
      if (winner) dailyLowNet[c.day] = winner.id;
    });

    // Overall low net bonus (+5 pts)
    const overallLowNet = data.length > 0
      ? data.reduce((best, p) => p.totalNet < best.totalNet ? p : best, data[0])?.id
      : null;

    // Add daily/overall bonuses
    data.forEach((p) => {
      let extra = 0;
      COURSES.forEach((c) => {
        if (dailyLowNet[c.day] === p.id) extra += 2;
      });
      if (overallLowNet === p.id) extra += 5;
      p.bonusPoints += extra;
      p.dailyLowNetWins = Object.values(dailyLowNet).filter((id) => id === p.id).length;
      p.isOverallLowNet = overallLowNet === p.id;
    });

    return {
      players: data,
      byGross: [...data].sort((a, b) => a.totalGross - b.totalGross),
      byNet: [...data].sort((a, b) => a.totalNet - b.totalNet),
      dailyLowNet,
      overallLowNet,
    };
  }, [players, scores]);

  // ── MASTERS LEADERBOARD DATA ──
  const leaderboardDay = selectedDay;
  const leaderboardCourse = COURSES.find((c) => c.day === leaderboardDay);
  const leaderboardData = useMemo(() => {
    if (!leaderboardCourse) return [];
    return players.map((p) => {
      const s = getScoreData(p.id, leaderboardDay);
      const pStrokes = getStrokesPerHole(p.handicap || 0);
      let holesPlayed = 0;
      let totalToPar = 0;
      const holeScores = [];

      for (let h = 0; h < 18; h++) {
        const gross = parseInt(s[h + 1]) || 0;
        if (gross > 0) {
          holesPlayed++;
          const net = gross - pStrokes[h];
          const diff = net - leaderboardCourse.pars[h];
          totalToPar += diff;
          holeScores.push({ hole: h + 1, gross, net, par: leaderboardCourse.pars[h], diff });
        } else {
          holeScores.push(null);
        }
      }

      const grossTotal = holeScores.reduce((s, h) => s + (h?.gross || 0), 0);

      return {
        id: p.id,
        name: p.displayName,
        handicap: p.handicap || 0,
        holesPlayed,
        totalToPar,
        grossTotal,
        holeScores,
      };
    }).filter((p) => p.holesPlayed > 0)
      .sort((a, b) => a.totalToPar - b.totalToPar);
  }, [players, scores, leaderboardDay, leaderboardCourse]);

  const TABS = [
    { id: "leaderboard", label: "Leaderboard" },
    { id: "scores", label: "Score Entry" },
    { id: "standings", label: "Standings" },
    { id: "points", label: "Tournament Points" },
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

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* ── MASTERS LEADERBOARD ── */}
        {tab === "leaderboard" && (
          <div>
            {/* Day picker */}
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
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

            {leaderboardCourse && (
              <div className="text-center mb-6">
                <h2 className="text-pine text-lg font-bold m-0">{leaderboardCourse.name}</h2>
                <p className="text-charcoal/40 text-xs m-0">Par {leaderboardCourse.par} &middot; {leaderboardCourse.format}</p>
              </div>
            )}

            {leaderboardData.length === 0 ? (
              <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
                No scores entered for this day yet.
              </p>
            ) : (
              <div className="bg-pine rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-pine-dark px-3 py-3 text-center border-b border-white/10">
                  <h3 className="text-gold font-serif font-bold text-lg m-0 tracking-wide">LEADERS</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: 700 }}>
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-3 py-2 text-gold/60 text-[10px] tracking-wider uppercase font-semibold w-8">
                          <span className="text-[8px]">TO<br/>PAR</span>
                        </th>
                        <th className="text-left px-2 py-2 text-cream/80 text-[10px] tracking-wider uppercase font-semibold">
                          PLAYER
                        </th>
                        <th className="text-center px-1 py-2 text-cream/40 text-[10px] font-semibold">THRU</th>
                        {Array.from({ length: 18 }, (_, i) => (
                          <th key={i} className="text-center px-0 py-2 text-cream/40 text-[10px] font-semibold w-8">
                            {i + 1}
                          </th>
                        ))}
                        <th className="text-center px-2 py-2 text-cream/60 text-[10px] font-semibold">TOT</th>
                      </tr>
                      {/* Par row */}
                      <tr className="border-b border-white/10 bg-white/5">
                        <td className="px-3 py-1"></td>
                        <td className="px-2 py-1 text-cream/40 text-[10px] font-bold">PAR</td>
                        <td className="px-1 py-1"></td>
                        {leaderboardCourse?.pars.map((p, i) => (
                          <td key={i} className="text-center px-0 py-1 text-cream/40 text-[10px] font-bold">{p}</td>
                        ))}
                        <td className="text-center px-2 py-1 text-cream/40 text-[10px] font-bold">{leaderboardCourse?.par}</td>
                      </tr>
                      {/* Handicap index row */}
                      <tr className="border-b border-white/10">
                        <td className="px-3 py-0.5"></td>
                        <td className="px-2 py-0.5 text-cream/20 text-[8px]">HDCP</td>
                        <td className="px-1 py-0.5"></td>
                        {leaderboardCourse?.hdcps.map((h, i) => (
                          <td key={i} className="text-center px-0 py-0.5 text-cream/20 text-[8px]">{h}</td>
                        ))}
                        <td className="px-2 py-0.5"></td>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((player, idx) => (
                        <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          {/* To Par */}
                          <td className="px-3 py-2.5">
                            <span className={`font-bold font-serif text-base ${
                              player.totalToPar < 0 ? "text-red-400" :
                              player.totalToPar === 0 ? "text-green-400" :
                              "text-cream/60"
                            }`}>
                              {player.totalToPar === 0 ? "E" :
                               player.totalToPar > 0 ? `+${player.totalToPar}` :
                               player.totalToPar}
                            </span>
                          </td>
                          {/* Name */}
                          <td className="px-2 py-2.5">
                            <span className="text-cream font-bold text-xs uppercase tracking-wide">
                              {player.name}
                            </span>
                          </td>
                          {/* Thru */}
                          <td className="text-center px-1 py-2.5 text-cream/40 text-xs">
                            {player.holesPlayed === 18 ? "F" : player.holesPlayed}
                          </td>
                          {/* Hole scores */}
                          {player.holeScores.map((h, i) => (
                            <td key={i} className="text-center px-0 py-2.5">
                              {h ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 text-[11px] font-bold rounded-full ${
                                  h.diff <= -2 ? "bg-yellow-400 text-yellow-900" :
                                  h.diff === -1 ? "bg-red-500 text-white" :
                                  h.diff === 0 ? "text-green-400" :
                                  h.diff === 1 ? "text-cream/50" :
                                  "bg-blue-900/50 text-blue-300"
                                }`}>
                                  {h.gross}
                                </span>
                              ) : (
                                <span className="text-cream/10 text-[10px]">–</span>
                              )}
                            </td>
                          ))}
                          {/* Total */}
                          <td className="text-center px-2 py-2.5">
                            <span className="text-cream font-bold font-serif">{player.grossTotal}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="bg-pine-dark px-4 py-3 flex items-center justify-center gap-4 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-4 rounded-full bg-yellow-400"></span>
                    <span className="text-cream/40 text-[9px]">Eagle</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
                    <span className="text-cream/40 text-[9px]">Birdie</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400 text-[11px] font-bold">4</span>
                    <span className="text-cream/40 text-[9px]">Par</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cream/50 text-[11px] font-bold">5</span>
                    <span className="text-cream/40 text-[9px]">Bogey</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-900/50 text-blue-300 text-[9px] font-bold">6</span>
                    <span className="text-cream/40 text-[9px]">Double+</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-cream-dark p-4 mt-6 text-center">
              <p className="text-pine text-xs font-semibold m-0 mb-1">How the Leaderboard Works</p>
              <p className="text-charcoal/50 text-[11px] m-0 leading-relaxed">
                Positions are determined by <strong>net scores</strong> (gross score minus handicap strokes).
                Handicap strokes are allocated per hole based on each course's official difficulty ranking
                &mdash; harder holes receive strokes first. This levels the playing field so everyone competes
                fairly regardless of skill level. Updates in real-time as scores are entered.
              </p>
            </div>
          </div>
        )}

        {/* ── SCORE ENTRY ── */}
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-pine font-serif font-bold text-base m-0">
                      {course.name}
                    </p>
                    <p className="text-charcoal/40 text-xs m-0">
                      Par {course.par} &middot; {course.format} &middot; HCP: {handicap}
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="flex gap-2 text-[9px]">
                    <span className="bg-yellow-300 text-yellow-900 px-1.5 py-0.5 rounded">Eagle</span>
                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Birdie</span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Par</span>
                  </div>
                </div>

                {/* Front 9 */}
                <div className="mb-6">
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-2">Front 9</h4>
                  {/* Par row */}
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-1">
                    {front9.map((h) => (
                      <div key={h} className="text-center">
                        <p className="text-charcoal/20 text-[9px] m-0">Par {course.pars[h - 1]}</p>
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="text-charcoal/20 text-[9px] m-0">
                        {front9.reduce((s, h) => s + course.pars[h - 1], 0)}
                      </p>
                    </div>
                  </div>
                  {/* Score row */}
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {front9.map((h) => {
                      const gross = parseInt(playerScores[h]) || 0;
                      const colorClass = gross ? getScoreColor(gross, h - 1) : "";
                      return (
                        <div key={h} className="text-center">
                          <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">#{h}</p>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={playerScores[h] || ""}
                            onChange={(e) => saveScore(h, e.target.value)}
                            placeholder="–"
                            className={`w-full h-10 text-center border border-cream-dark rounded-lg text-sm font-bold font-serif text-pine ${colorClass || "bg-white"}`}
                          />
                          {gross > 0 && (
                            <p className="text-charcoal/30 text-[8px] m-0 mt-0.5">
                              net {getNetScore(gross, h - 1)}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-2">Back 9</h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-1">
                    {back9.map((h) => (
                      <div key={h} className="text-center">
                        <p className="text-charcoal/20 text-[9px] m-0">Par {course.pars[h - 1]}</p>
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="text-charcoal/20 text-[9px] m-0">
                        {back9.reduce((s, h) => s + course.pars[h - 1], 0)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {back9.map((h) => {
                      const gross = parseInt(playerScores[h]) || 0;
                      const colorClass = gross ? getScoreColor(gross, h - 1) : "";
                      return (
                        <div key={h} className="text-center">
                          <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">#{h}</p>
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={playerScores[h] || ""}
                            onChange={(e) => saveScore(h, e.target.value)}
                            placeholder="–"
                            className={`w-full h-10 text-center border border-cream-dark rounded-lg text-sm font-bold font-serif text-pine ${colorClass || "bg-white"}`}
                          />
                          {gross > 0 && (
                            <p className="text-charcoal/30 text-[8px] m-0 mt-0.5">
                              net {getNetScore(gross, h - 1)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <div className="text-center">
                      <p className="text-charcoal/30 text-[10px] font-bold m-0 mb-1">IN</p>
                      <div className="w-full h-10 flex items-center justify-center bg-gold/10 rounded-lg text-pine font-bold font-serif text-sm">
                        {backTotal || "–"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Bar */}
                <div className="bg-pine text-cream rounded-xl px-6 py-4 flex items-center justify-between font-serif">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-3xl font-bold">{total || "–"}</span>
                    {total > 0 && (
                      <span className="text-cream/50 text-sm">
                        ({total > course.par ? "+" : ""}{total - course.par})
                      </span>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gold text-lg font-bold m-0">
                          {total - (handicap * 1)}
                        </p>
                        <p className="text-cream/30 text-[9px] m-0">Net</p>
                      </div>
                      <div className="w-px h-8 bg-cream/20" />
                      <div className="text-center">
                        <p className="text-gold text-lg font-bold m-0">
                          {(() => {
                            let b = 0;
                            for (let h = 0; h < 18; h++) {
                              const g = parseInt(playerScores[h + 1]) || 0;
                              if (g <= 0) continue;
                              const net = g - strokesPerHole[h];
                              if (net === course.pars[h] - 1) b++;
                            }
                            return b;
                          })()}
                        </p>
                        <p className="text-cream/30 text-[9px] m-0">Birdies</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gold text-lg font-bold m-0">
                          {(() => {
                            let e = 0;
                            for (let h = 0; h < 18; h++) {
                              const g = parseInt(playerScores[h + 1]) || 0;
                              if (g <= 0) continue;
                              const net = g - strokesPerHole[h];
                              if (net <= course.pars[h] - 2) e++;
                            }
                            return e;
                          })()}
                        </p>
                        <p className="text-cream/30 text-[9px] m-0">Eagles</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STANDINGS ── */}
        {tab === "standings" && (
          <div>
            {tournamentData.players.length === 0 ? (
              <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
                No scores entered yet. Head to Score Entry to start recording rounds.
              </p>
            ) : (
              <>
                <h3 className="text-pine text-base font-bold m-0 mb-4">Gross Standings</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-hidden mb-8">
                  <div className="bg-pine px-5 py-3 grid grid-cols-[2rem_1fr_4rem_4rem] gap-2 text-cream text-[10px] tracking-wider uppercase font-semibold">
                    <span>#</span><span>Player</span><span className="text-center">Rnds</span><span className="text-right">Gross</span>
                  </div>
                  {tournamentData.byGross.map((p, i) => (
                    <div key={p.id} className={`px-5 py-3 grid grid-cols-[2rem_1fr_4rem_4rem] gap-2 text-sm border-b border-cream-dark last:border-none ${i === 0 ? "bg-gold/5" : ""}`}>
                      <span className={`font-bold ${i === 0 ? "text-gold" : "text-charcoal/30"}`}>{i + 1}</span>
                      <span className="font-semibold text-pine">{p.displayName}</span>
                      <span className="text-center text-charcoal/40">{p.roundsPlayed}</span>
                      <span className="text-right font-bold font-serif text-pine text-lg">{p.totalGross}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-pine text-base font-bold m-0 mb-4">Net Standings</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-hidden mb-8">
                  <div className="bg-pine px-5 py-3 grid grid-cols-[2rem_1fr_3rem_4rem] gap-2 text-cream text-[10px] tracking-wider uppercase font-semibold">
                    <span>#</span><span>Player</span><span className="text-center">HCP</span><span className="text-right">Net</span>
                  </div>
                  {tournamentData.byNet.map((p, i) => (
                    <div key={p.id} className={`px-5 py-3 grid grid-cols-[2rem_1fr_3rem_4rem] gap-2 text-sm border-b border-cream-dark last:border-none ${i === 0 ? "bg-gold/5" : ""}`}>
                      <span className={`font-bold ${i === 0 ? "text-gold" : "text-charcoal/30"}`}>{i + 1}</span>
                      <span className="font-semibold text-pine">{p.displayName}</span>
                      <span className="text-center text-charcoal/40">{p.handicap || 0}</span>
                      <span className="text-right font-bold font-serif text-pine text-lg">{p.totalNet}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-pine text-base font-bold m-0 mb-4">Round-by-Round</h3>
                <div className="bg-white rounded-xl border border-cream-dark overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-pine text-cream text-[10px] tracking-wider uppercase">
                        <th className="text-left px-4 py-3 font-semibold">Player</th>
                        {COURSES.map((c) => (
                          <th key={c.day} className="text-center px-4 py-3 font-semibold">{c.dayLabel.split("—")[0].trim()}</th>
                        ))}
                        <th className="text-right px-4 py-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentData.byGross.map((p) => (
                        <tr key={p.id} className="border-b border-cream-dark last:border-none">
                          <td className="px-4 py-3 font-semibold text-pine">{p.displayName}</td>
                          {COURSES.map((c) => {
                            const d = p.dailyData[c.day];
                            return (
                              <td key={c.day} className="text-center px-4 py-3 font-serif">
                                {d?.played ? d.gross : "–"}
                              </td>
                            );
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

        {/* ── TOURNAMENT POINTS ── */}
        {tab === "points" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Tournament Points Breakdown</h2>
              <p className="text-charcoal/50 text-sm m-0 font-serif italic">
                Auto-calculated from scorecards. Net birdies and eagles earn bonus points for your team.
              </p>
            </div>

            {tournamentData.players.length === 0 ? (
              <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
                No scores entered yet.
              </p>
            ) : (
              <>
                {/* Points Table */}
                <div className="bg-white rounded-xl border border-cream-dark overflow-x-auto mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-pine text-cream text-[10px] tracking-wider uppercase">
                        <th className="text-left px-4 py-3 font-semibold">Player</th>
                        <th className="text-center px-3 py-3 font-semibold">Net Birdies</th>
                        <th className="text-center px-3 py-3 font-semibold">Net Eagles</th>
                        <th className="text-center px-3 py-3 font-semibold">Daily Low</th>
                        <th className="text-center px-3 py-3 font-semibold">Overall Low</th>
                        <th className="text-right px-4 py-3 font-semibold">Bonus Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tournamentData.players].sort((a, b) => b.bonusPoints - a.bonusPoints).map((p) => (
                        <tr key={p.id} className="border-b border-cream-dark last:border-none">
                          <td className="px-4 py-3 font-semibold text-pine">{p.displayName}</td>
                          <td className="text-center px-3 py-3">
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {p.totalNetBirdies} <span className="text-[9px] font-normal">({p.totalNetBirdies}pt)</span>
                            </span>
                          </td>
                          <td className="text-center px-3 py-3">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                              {p.totalNetEagles} <span className="text-[9px] font-normal">({p.totalNetEagles * 3}pt)</span>
                            </span>
                          </td>
                          <td className="text-center px-3 py-3">
                            {p.dailyLowNetWins > 0 ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {p.dailyLowNetWins}x <span className="text-[9px] font-normal">({p.dailyLowNetWins * 2}pt)</span>
                              </span>
                            ) : "–"}
                          </td>
                          <td className="text-center px-3 py-3">
                            {p.isOverallLowNet ? (
                              <span className="bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full text-xs font-bold">
                                Yes <span className="text-[9px] font-normal">(5pt)</span>
                              </span>
                            ) : "–"}
                          </td>
                          <td className="text-right px-4 py-3">
                            <span className="text-pine font-bold font-serif text-lg">{p.bonusPoints}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Day-by-day breakdown */}
                <h3 className="text-pine text-base font-bold m-0 mb-4">Day-by-Day Breakdown</h3>
                {COURSES.map((c) => {
                  const dayPlayers = tournamentData.players.filter((p) => p.dailyData[c.day]?.played);
                  if (dayPlayers.length === 0) return (
                    <div key={c.day} className="bg-white rounded-xl border border-cream-dark p-5 mb-4">
                      <h4 className="text-pine text-sm font-bold m-0">{c.dayLabel}</h4>
                      <p className="text-charcoal/40 text-xs m-0 mt-1 italic">No scores yet</p>
                    </div>
                  );
                  return (
                    <div key={c.day} className="bg-white rounded-xl border border-cream-dark overflow-hidden mb-4">
                      <div className="bg-pine/5 px-5 py-3 border-b border-cream-dark">
                        <h4 className="text-pine text-sm font-bold m-0">{c.dayLabel} — {c.name}</h4>
                        <p className="text-charcoal/40 text-xs m-0">{c.format}</p>
                      </div>
                      {dayPlayers
                        .sort((a, b) => a.dailyData[c.day].net - b.dailyData[c.day].net)
                        .map((p, i) => {
                          const d = p.dailyData[c.day];
                          const isLowNet = tournamentData.dailyLowNet[c.day] === p.id;
                          return (
                            <div key={p.id} className={`px-5 py-3 flex items-center justify-between border-b border-cream-dark last:border-none ${isLowNet ? "bg-gold/5" : ""}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold w-5 ${i === 0 ? "text-gold" : "text-charcoal/30"}`}>{i + 1}</span>
                                <div>
                                  <p className="text-pine text-sm font-semibold m-0">
                                    {p.displayName}
                                    {isLowNet && (
                                      <span className="ml-2 bg-gold/20 text-gold-dark text-[9px] font-bold px-1.5 py-0.5 rounded-full">LOW NET +2pt</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-center">
                                  <p className="text-charcoal/30 text-[9px] m-0">Gross</p>
                                  <p className="text-pine font-serif font-bold m-0">{d.gross}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-charcoal/30 text-[9px] m-0">Net</p>
                                  <p className="text-pine font-serif font-bold m-0">{d.net}</p>
                                </div>
                                {d.birdies > 0 && (
                                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {d.birdies} birdie{d.birdies > 1 ? "s" : ""}
                                  </span>
                                )}
                                {d.eagles > 0 && (
                                  <span className="bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {d.eagles} eagle{d.eagles > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}

                {/* Point System Reference */}
                <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 mt-6">
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-3">Point System Reference</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-gold font-bold font-serif">+1 pt</span> <span className="text-charcoal/50">per net birdie</span></div>
                    <div><span className="text-gold font-bold font-serif">+3 pts</span> <span className="text-charcoal/50">per net eagle</span></div>
                    <div><span className="text-gold font-bold font-serif">+2 pts</span> <span className="text-charcoal/50">daily low net</span></div>
                    <div><span className="text-gold font-bold font-serif">+5 pts</span> <span className="text-charcoal/50">overall low net</span></div>
                    <div><span className="text-gold font-bold font-serif">+1 pt</span> <span className="text-charcoal/50">match play win</span></div>
                    <div><span className="text-gold font-bold font-serif">+0.5 pt</span> <span className="text-charcoal/50">match halved</span></div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BETS ── */}
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
