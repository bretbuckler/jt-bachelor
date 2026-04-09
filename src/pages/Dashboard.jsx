import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TRIP_DATE = new Date("2026-06-18T00:00:00");

function getCountdown() {
  const now = new Date();
  const diff = TRIP_DATE - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { days, hours };
}

const QUICK_LINKS = [
  { path: "/lodge", label: "The Lodge", desc: "Your temporary palace awaits", icon: "\uD83C\uDFE0" },
  { path: "/travel", label: "Travel", desc: "The Bureau of Transportation & Logistics", icon: "\u2708\uFE0F" },
  { path: "/courses", label: "Pro Shop", desc: "Three rounds of mountain golf glory", icon: "\u26F3" },
  { path: "/tournament", label: "Tournament Info", desc: "The Inaugural JT Memorial Ryder Cup", icon: "\uD83C\uDFC6" },
  { path: "/golf", label: "Scorecard", desc: "Leaderboard, match play, and standings", icon: "\uD83C\uDFCC\uFE0F" },
  { path: "/board", label: "The Board", desc: "Post, claim, and seek reimbursement", icon: "\uD83D\uDCCB" },
  { path: "/photos", label: "Photos", desc: "Document the evidence", icon: "\uD83D\uDCF8" },
  { path: "/casino", label: "Casino", desc: "Track your donations to Harrah's Cherokee", icon: "\uD83C\uDFB0" },
  { path: "/report", label: "Daily Report", desc: "Full summary for the big screen", icon: "\uD83D\uDCC4" },
];

const GOLFERS = ["Bret", "Daniel", "Downs", "Ferris", "JT", "Josh", "Phil", "Preston"];
const ALL_ATTENDEES = ["Bret", "Daniel", "Downs", "Ferris", "Gary", "Rob Dollaz", "JT", "Josh", "Petey", "Phil", "Preston", "Swan"];

const ANNOUNCEMENTS = [
  {
    title: "Welcome to The Society",
    body: "The Committee is pleased to welcome all members to the inaugural gathering. Please review the Tournament Program and Lodge Rules at your earliest convenience. Ignorance of the bylaws will not be tolerated (but will be mocked).",
    date: "April 2026",
  },
  {
    title: "Handicap Verification",
    body: "Members are reminded that all handicaps are accepted on the honor system. The Committee has, however, retained the right to publicly question any handicap that appears 'aspirational.'",
    date: "April 2026",
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const countdown = getCountdown();

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-pine relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `radial-gradient(circle at 20% 50%, rgba(201,162,39,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 80% 50%, rgba(45,90,45,0.5) 0%, transparent 50%)`,
             }} />
        <div className="max-w-5xl mx-auto px-6 py-16 relative z-10 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Welcome back, distinguished member
          </p>
          <h1 className="text-cream text-3xl md:text-5xl font-bold m-0 leading-tight">
            {profile?.displayName || "Member"}
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            {profile?.handicap
              ? `Claimed handicap: ${profile.handicap} (unverified)`
              : "Handicap: undisclosed (probably for good reason)"}
          </p>

          {/* Countdown */}
          {countdown && (
            <div className="mt-10 inline-flex items-center gap-8 bg-white/5 border border-gold/15 rounded-2xl px-10 py-6">
              <div className="text-center">
                <p className="text-gold text-4xl md:text-5xl font-bold font-serif m-0">
                  {countdown.days}
                </p>
                <p className="text-cream/30 text-[10px] tracking-[0.15em] uppercase m-0 mt-1">
                  Days
                </p>
              </div>
              <div className="w-px h-12 bg-gold/20" />
              <div className="text-center">
                <p className="text-gold text-4xl md:text-5xl font-bold font-serif m-0">
                  {countdown.hours}
                </p>
                <p className="text-cream/30 text-[10px] tracking-[0.15em] uppercase m-0 mt-1">
                  Hours
                </p>
              </div>
              <div className="w-px h-12 bg-gold/20" />
              <div className="text-center">
                <p className="text-cream/60 text-lg font-serif m-0">until<br />first tee</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group bg-white rounded-xl border border-cream-dark hover:border-gold/30 p-6 no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="text-3xl block mb-3">{link.icon}</span>
              <h3 className="text-pine text-base font-bold m-0 group-hover:text-pine-light transition-colors">
                {link.label}
              </h3>
              <p className="text-charcoal/50 text-xs mt-1 m-0 leading-relaxed">
                {link.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* Announcements */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-cream-dark" />
            <h2 className="text-pine text-lg m-0 whitespace-nowrap">Club Announcements</h2>
            <div className="h-px flex-1 bg-cream-dark" />
          </div>
          <div className="space-y-4">
            {ANNOUNCEMENTS.map((a, i) => (
              <div key={i} className="bg-white rounded-xl border border-cream-dark p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-pine text-base font-bold m-0">{a.title}</h3>
                  <span className="text-charcoal/30 text-xs whitespace-nowrap">{a.date}</span>
                </div>
                <p className="text-charcoal/60 text-sm mt-3 m-0 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roster */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-cream-dark p-6">
            <h3 className="text-pine text-base font-bold m-0 mb-1">The Golf Squad</h3>
            <p className="text-charcoal/30 text-xs mb-4 m-0">{GOLFERS.length} brave souls</p>
            <div className="flex flex-wrap gap-2">
              {GOLFERS.map((name) => (
                <span key={name} className="bg-pine text-cream text-xs font-semibold px-3 py-1.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-cream-dark p-6">
            <h3 className="text-pine text-base font-bold m-0 mb-1">Full Roster</h3>
            <p className="text-charcoal/30 text-xs mb-4 m-0">{ALL_ATTENDEES.length} total attendees</p>
            <div className="flex flex-wrap gap-2">
              {ALL_ATTENDEES.map((name, i) => (
                <span key={`${name}-${i}`} className="bg-cream-dark text-pine text-xs font-semibold px-3 py-1.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Weather */}
        <div className="bg-white rounded-xl border border-cream-dark p-6">
          <h3 className="text-pine text-base font-bold m-0 mb-3">
            Weather Forecast &mdash; Cherokee, NC
          </h3>
          <p className="text-charcoal/60 text-sm m-0 leading-relaxed">
            Mid-June in the Smokies typically brings highs around 80&ndash;85&deg;F and lows around
            58&ndash;62&deg;F. Afternoon thunderstorms are common, so pack a rain layer. Morning rounds
            tend to have the best weather windows. The Committee assumes no liability for weather-related
            excuses regarding your score.
          </p>
          <a
            href="https://weather.com/weather/tenday/l/Whittier+NC+28789"
            target="_blank"
            rel="noopener"
            className="inline-block mt-3 text-pine-light text-xs font-semibold no-underline border-b border-pine-light/30 hover:border-pine-light transition-colors"
          >
            Check 10-Day Forecast &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
