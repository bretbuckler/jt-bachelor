import { useState, useEffect } from "react";
import {
  collection, doc, setDoc, getDoc, onSnapshot, query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const FORMAT_DAYS = [
  {
    day: "Day 1 \u2014 Thursday",
    course: "Sequoyah National Golf Club",
    format: "2-Man Scramble",
    play: "Match Play",
    desc: "Each two-man team plays the best ball off the tee, then both play from that spot. Repeat until holed out. Lowest score on each hole wins the match point. Both players hit every shot \u2014 the team picks the best one. Strategy, teamwork, and a willingness to carry your partner are essential.",
    rules: [
      "Both players tee off; team selects the preferred drive",
      "Both players hit from the chosen spot; team selects the better shot",
      "Continue until the ball is holed",
      "Match play scoring: 1 point per hole won",
      "Halved holes award 0.5 points to each team",
    ],
  },
  {
    day: "Day 2 \u2014 Friday",
    course: "Smoky Mountain Country Club",
    format: "Best Ball & Alternate Shot",
    play: "Match Play",
    desc: "Morning session: Best Ball (each player plays their own ball, lower score counts). Afternoon session: Alternate Shot (one ball per team, players take turns hitting). Two points available \u2014 one per session.",
    rules: [
      "Front 9 \u2014 Best Ball: Both players play their own ball; lower score counts",
      "Back 9 \u2014 Alternate Shot: One ball per team, players alternate strokes",
      "In Alternate Shot, players alternate tee shots (Player A tees on odd holes, Player B on even)",
      "1 match point available for each 9-hole session",
      "Halved sessions award 0.5 points each",
    ],
  },
  {
    day: "Day 3 \u2014 Saturday",
    course: "Laurel Ridge Country Club",
    format: "Individual Match Play",
    play: "Head-to-Head",
    desc: "Every man for himself. Each player on Team A is paired against a player from Team B in individual match play. This is where legends are made and egos are shattered. No partner to blame. No excuses.",
    rules: [
      "Each match is head-to-head, 18 holes",
      "Standard match play rules: lower score on each hole wins the hole",
      "If a match is all square after 18, it is halved (0.5 points each)",
      "1 full point per match won",
      "The team with more total points across all 3 days wins the Cup",
    ],
  },
];

const SCORING_SYSTEM = [
  { category: "Match Play (Team)", points: "1 pt", desc: "Win your match (team format or individual)" },
  { category: "Match Halved (Team)", points: "0.5 pt", desc: "Match ends all square" },
  { category: "Net Birdie (Individual)", points: "+1 pt", desc: "Any net birdie during any round earns a bonus point for your team" },
  { category: "Net Eagle (Individual)", points: "+3 pts", desc: "A net eagle earns 3 bonus points \u2014 because you probably peaked" },
  { category: "Individual Low Net (Daily)", points: "+2 pts", desc: "Lowest individual net score each day earns bonus points for their team" },
  { category: "Individual Low Net (Overall)", points: "+5 pts", desc: "Lowest individual net score across all 3 rounds \u2014 the weekend's true champion" },
];

const DEFAULT_BIO_FIELDS = {
  nickname: "",
  homeClub: "",
  signatureMove: "",
  weakness: "",
  careerHighlight: "",
  walkUpSong: "",
};

export default function Tournament() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("format");
  const [players, setPlayers] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState({ ...DEFAULT_BIO_FIELDS });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "users")), (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsub2 = onSnapshot(doc(db, "tournament", "config"), (snap) => {
      if (snap.exists()) setTournament(snap.data());
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  // Load current user's bio
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "player_bios", user.uid));
      if (snap.exists()) setBioForm({ ...DEFAULT_BIO_FIELDS, ...snap.data() });
    })();
  }, [user]);

  const saveBio = async () => {
    await setDoc(doc(db, "player_bios", user.uid), {
      ...bioForm,
      uid: user.uid,
      displayName: profile?.displayName || user.email,
    });
    setEditingBio(false);
  };

  const [allBios, setAllBios] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "player_bios")), (snap) => {
      setAllBios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const teamA = tournament?.teamA || [];
  const teamB = tournament?.teamB || [];
  const teamAName = tournament?.teamAName || "Team Birdie Juice";
  const teamBName = tournament?.teamBName || "Team Shank Redemption";
  const teamAScore = tournament?.teamAScore || 0;
  const teamBScore = tournament?.teamBScore || 0;

  const TABS = [
    { id: "format", label: "Format & Rules" },
    { id: "teams", label: "Teams & Matchups" },
    { id: "bios", label: "Player Profiles" },
    { id: "scoreboard", label: "Scoreboard" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
             style={{
               backgroundImage: `radial-gradient(circle at 30% 50%, rgba(201,162,39,0.4) 0%, transparent 50%),
                                 radial-gradient(circle at 70% 50%, rgba(201,162,39,0.2) 0%, transparent 50%)`,
             }} />
        <div className="max-w-5xl mx-auto px-6 py-14 text-center relative z-10">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            The Inaugural
          </p>
          <h1 className="text-cream text-3xl md:text-5xl font-bold m-0">
            JT Memorial<br />
            <span className="text-gold">Ryder Cup</span>
          </h1>
          <p className="text-cream/40 text-sm mt-3 m-0 font-serif italic">
            Three days. Two teams. One trophy that probably cost $12 on Amazon.
          </p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="bg-white border-b border-cream-dark sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs font-semibold border-none cursor-pointer transition-all whitespace-nowrap ${
                tab === t.id
                  ? "text-pine border-b-2 border-b-gold bg-transparent"
                  : "text-charcoal/40 bg-transparent hover:text-pine"
              }`}
              style={tab === t.id ? { borderBottom: "2px solid #c9a227" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* FORMAT & RULES */}
        {tab === "format" && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Tournament Format</h2>
              <p className="text-charcoal/50 text-sm m-0 max-w-xl mx-auto leading-relaxed">
                LIV-style: both individual AND team competition. Teams earn points from match play results,
                but individuals also earn bonus points for their team through net birdies, net eagles,
                and daily/overall low net. The team with the most total points wins the Cup.
              </p>
            </div>

            {FORMAT_DAYS.map((day, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                <div className="bg-pine px-6 py-4">
                  <p className="text-gold text-xs tracking-wider uppercase m-0">{day.day}</p>
                  <h3 className="text-cream text-lg font-bold m-0 mt-1">{day.format}</h3>
                  <p className="text-cream/40 text-xs m-0">{day.course} &middot; {day.play}</p>
                </div>
                <div className="p-6">
                  <p className="text-charcoal/60 text-sm leading-relaxed m-0 mb-4">{day.desc}</p>
                  <h4 className="text-pine text-xs font-bold tracking-wider uppercase m-0 mb-3">
                    Rules of Engagement
                  </h4>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {day.rules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-charcoal/60 text-sm">
                        <span className="text-gold mt-0.5 text-xs shrink-0">&#9679;</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Scoring System */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-cream-dark" />
                <h2 className="text-pine text-lg m-0 whitespace-nowrap">Point System</h2>
                <div className="h-px flex-1 bg-cream-dark" />
              </div>
              <p className="text-charcoal/50 text-sm mb-6 m-0 text-center font-serif italic">
                Individual glory feeds the team. Every net birdie and eagle you make earns points for your squad.
              </p>
              <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                <div className="bg-pine px-6 py-3 grid grid-cols-[6rem_1fr] gap-4 text-cream text-[10px] tracking-wider uppercase font-semibold">
                  <span>Points</span><span>Description</span>
                </div>
                {SCORING_SYSTEM.map((s, i) => (
                  <div key={i} className="px-6 py-4 grid grid-cols-[6rem_1fr] gap-4 border-b border-cream-dark last:border-none items-center">
                    <span className="text-gold font-bold font-serif text-lg">{s.points}</span>
                    <div>
                      <p className="text-pine text-sm font-semibold m-0">{s.category}</p>
                      <p className="text-charcoal/50 text-xs m-0 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 text-center">
              <p className="text-pine font-serif italic text-sm m-0">
                "The Committee reserves the right to amend any rule at any time for any reason,
                provided said amendment is approved by a simple majority of sober participants
                (or a two-thirds majority of inebriated ones)."
              </p>
            </div>
          </div>
        )}

        {/* TEAMS & MATCHUPS */}
        {tab === "teams" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Teams</h2>
              <p className="text-charcoal/50 text-sm m-0">
                Teams will be determined by captain's pick or random draft before the event.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Team A */}
              <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-6 py-5 text-center">
                  <h3 className="text-white text-lg font-bold m-0">{teamAName}</h3>
                  <p className="text-white/50 text-xs m-0 mt-1">Captain TBD</p>
                </div>
                <div className="p-6">
                  {teamA.length === 0 ? (
                    <p className="text-charcoal/40 text-sm text-center font-serif italic m-0">
                      Roster to be announced
                    </p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-3">
                      {teamA.map((name, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {name[0]}
                          </div>
                          <span className="text-pine text-sm font-semibold">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Team B */}
              <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                <div className="bg-gradient-to-r from-amber-700 to-amber-900 px-6 py-5 text-center">
                  <h3 className="text-white text-lg font-bold m-0">{teamBName}</h3>
                  <p className="text-white/50 text-xs m-0 mt-1">Captain TBD</p>
                </div>
                <div className="p-6">
                  {teamB.length === 0 ? (
                    <p className="text-charcoal/40 text-sm text-center font-serif italic m-0">
                      Roster to be announced
                    </p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-3">
                      {teamB.map((name, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {name[0]}
                          </div>
                          <span className="text-pine text-sm font-semibold">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 text-center">
              <p className="text-pine font-serif italic text-sm m-0">
                Matchups for each day will be announced by the team captains the evening prior.
                Trash talk begins immediately upon announcement and is strongly encouraged.
              </p>
            </div>
          </div>
        )}

        {/* PLAYER PROFILES */}
        {tab === "bios" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Player Profiles</h2>
              <p className="text-charcoal/50 text-sm m-0">
                The official (and entirely fictional) profiles of The Society's members
              </p>
            </div>

            {/* Edit Your Bio */}
            <div className="bg-white rounded-xl border-2 border-gold/20 p-6 mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-pine text-base font-bold m-0">Your Profile</h3>
                <button
                  onClick={() => setEditingBio(!editingBio)}
                  className="text-xs text-pine-light font-semibold bg-transparent border border-pine-light/30 px-3 py-1 rounded-lg cursor-pointer hover:bg-pine-light/5 transition-colors"
                >
                  {editingBio ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {editingBio ? (
                <div className="space-y-4">
                  {[
                    { key: "nickname", label: "Nickname", placeholder: 'e.g. "The Sandman" or "Captain Hook"' },
                    { key: "homeClub", label: "Home Club", placeholder: "e.g. Municipal Muni \u2014 where dreams go to die" },
                    { key: "signatureMove", label: "Signature Move", placeholder: "e.g. The 4-putt from 6 feet" },
                    { key: "weakness", label: "Known Weakness", placeholder: "e.g. Literally every club in the bag" },
                    { key: "careerHighlight", label: "Career Highlight", placeholder: "e.g. Once broke 100 (wind-aided, scorecard unverified)" },
                    { key: "walkUpSong", label: "Walk-Up Song", placeholder: "e.g. 'Eye of the Tiger' (ironic)" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-1">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={bioForm[f.key]}
                        onChange={(e) => setBioForm((b) => ({ ...b, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
                      />
                    </div>
                  ))}
                  <button
                    onClick={saveBio}
                    className="py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none hover:brightness-110 transition-all"
                  >
                    Save Profile
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nickname", value: bioForm.nickname },
                    { label: "Home Club", value: bioForm.homeClub },
                    { label: "Signature Move", value: bioForm.signatureMove },
                    { label: "Weakness", value: bioForm.weakness },
                    { label: "Career Highlight", value: bioForm.careerHighlight },
                    { label: "Walk-Up Song", value: bioForm.walkUpSong },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0">{f.label}</p>
                      <p className="text-pine text-sm m-0 mt-0.5">
                        {f.value || <span className="text-charcoal/20 italic">Not set</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Player Bios */}
            <div className="space-y-4">
              {allBios.length === 0 && (
                <p className="text-center text-charcoal/40 text-sm py-8 font-serif italic">
                  No profiles created yet. Be the first to immortalize your (fictional) golf legacy.
                </p>
              )}
              {allBios.map((bio) => (
                <div key={bio.id} className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                  <div className="bg-pine px-6 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-gold text-xl font-bold font-serif">
                      {(bio.displayName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-cream text-base font-bold m-0">
                        {bio.displayName}
                        {bio.nickname && (
                          <span className="text-gold ml-2 font-normal text-sm">
                            "{bio.nickname}"
                          </span>
                        )}
                      </h3>
                      {bio.homeClub && (
                        <p className="text-cream/40 text-xs m-0">{bio.homeClub}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    {bio.signatureMove && (
                      <div>
                        <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0">Signature Move</p>
                        <p className="text-charcoal/70 text-sm m-0 mt-0.5">{bio.signatureMove}</p>
                      </div>
                    )}
                    {bio.weakness && (
                      <div>
                        <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0">Known Weakness</p>
                        <p className="text-charcoal/70 text-sm m-0 mt-0.5">{bio.weakness}</p>
                      </div>
                    )}
                    {bio.careerHighlight && (
                      <div>
                        <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0">Career Highlight</p>
                        <p className="text-charcoal/70 text-sm m-0 mt-0.5">{bio.careerHighlight}</p>
                      </div>
                    )}
                    {bio.walkUpSong && (
                      <div>
                        <p className="text-charcoal/30 text-[10px] tracking-wider uppercase m-0">Walk-Up Song</p>
                        <p className="text-charcoal/70 text-sm m-0 mt-0.5">{bio.walkUpSong}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCOREBOARD */}
        {tab === "scoreboard" && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-pine text-xl font-bold m-0 mb-2">Team Scoreboard</h2>
              <p className="text-charcoal/50 text-sm m-0 font-serif italic">
                The definitive measure of glory
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden mb-10">
              <div className="grid grid-cols-3">
                {/* Team A */}
                <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 p-8 text-center">
                  <p className="text-white/50 text-xs tracking-wider uppercase m-0 mb-2">
                    {teamAName}
                  </p>
                  <p className="text-white text-5xl md:text-6xl font-bold font-serif m-0">
                    {teamAScore}
                  </p>
                </div>
                {/* VS */}
                <div className="bg-pine flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gold/40 text-xs tracking-wider uppercase m-0 mb-1">
                      Total Points
                    </p>
                    <p className="text-cream text-2xl font-serif font-bold m-0">VS</p>
                  </div>
                </div>
                {/* Team B */}
                <div className="bg-gradient-to-b from-amber-700 to-amber-900 p-8 text-center">
                  <p className="text-white/50 text-xs tracking-wider uppercase m-0 mb-2">
                    {teamBName}
                  </p>
                  <p className="text-white text-5xl md:text-6xl font-bold font-serif m-0">
                    {teamBScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Day-by-day breakdown placeholder */}
            <div className="space-y-4">
              {FORMAT_DAYS.map((day, i) => (
                <div key={i} className="bg-white rounded-xl border border-cream-dark p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-pine text-sm font-bold m-0">{day.day}</h3>
                      <p className="text-charcoal/40 text-xs m-0">{day.format} &middot; {day.course}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-charcoal/30 text-xs font-serif italic m-0">
                        Results pending
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-cream/50 rounded-xl border border-cream-dark p-6 text-center mt-8">
              <p className="text-pine font-serif italic text-sm m-0">
                Scores will be updated in real-time during the tournament by The Committee.
                Disputes will be settled by a committee vote, arm wrestling, or closest-to-the-pin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
