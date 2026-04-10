import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const { unlockGate, gateUnlocked, user } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // Background music: try to autoplay immediately. Most browsers block
  // unmuted autoplay on a first visit, so we also kick it off on the first
  // user interaction (click, tap, keypress) anywhere on the page.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.4;

    let started = false;
    const start = () => {
      if (started) return;
      el.play().then(() => {
        started = true;
      }).catch(() => {
        // Still blocked — leave listeners in place for the next gesture.
      });
    };

    start();

    const events = ["pointerdown", "keydown", "touchstart"];
    const onGesture = () => start();
    events.forEach((ev) => window.addEventListener(ev, onGesture, { once: false, passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onGesture));
      el.pause();
    };
  }, []);

  if (gateUnlocked && user) return <Navigate to="/dashboard" replace />;
  if (gateUnlocked) return <Navigate to="/auth" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (unlockGate(password)) {
      navigate("/auth");
    } else {
      setError("Incorrect password. The Committee denies your entry.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
         style={{
           background: "linear-gradient(160deg, #0d1f0d 0%, #1a3a1a 40%, #2d5a2d 100%)",
         }}>
      {/* Background music — hidden, autoplays on first interaction if needed */}
      <audio
        ref={audioRef}
        src="/audio/patrick-ashlyn-tragedy-jt-remix.mp3"
        preload="auto"
        loop
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(201,162,39,0.1) 35px, rgba(201,162,39,0.1) 36px)`,
           }} />

      <div className="relative z-10 text-center px-6 max-w-lg w-full">
        {/* Crest */}
        <div className="mb-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gold/30 flex items-center justify-center bg-gold/5">
            <span className="text-5xl">&#9971;</span>
          </div>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0 leading-tight">
            The Honorable Society of<br />
            <span className="text-gold">JT's Last Round</span>
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gold/30" />
            <p className="text-gold/60 text-xs tracking-[0.2em] uppercase m-0">
              Est. June 2026
            </p>
            <div className="h-px w-12 bg-gold/30" />
          </div>
        </div>

        {/* Tagline */}
        <p className="text-cream/50 font-serif italic text-base mb-10 animate-fade-in"
           style={{ animationDelay: "0.2s", opacity: 0 }}>
          "Where gentlemen gather to celebrate one man's final days of freedom,
          armed with nothing but questionable golf swings and unwavering confidence."
        </p>

        {/* Details */}
        <div className="grid grid-cols-3 gap-4 mb-10 animate-fade-in"
             style={{ animationDelay: "0.3s", opacity: 0 }}>
          {[
            { label: "Location", value: "Cherokee, NC" },
            { label: "Dates", value: "June 18\u201321" },
            { label: "Rounds", value: "3 Courses" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-gold/40 text-[10px] tracking-[0.15em] uppercase m-0 mb-1">
                {item.label}
              </p>
              <p className="text-cream text-sm font-semibold m-0">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Password Gate */}
        <form onSubmit={handleSubmit}
              className={`animate-fade-in ${shake ? "animate-shake" : ""}`}
              style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="bg-white/5 backdrop-blur-md border border-gold/20 rounded-2xl p-8">
            <p className="text-cream/40 text-xs tracking-[0.1em] uppercase mb-4 m-0">
              Members Only &mdash; Enter Event Password
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter the password"
              className="w-full px-4 py-3 bg-white/8 border border-gold/15 rounded-xl text-cream text-center text-base font-serif placeholder:text-cream/20 mb-4"
            />
            {error && (
              <p className="text-red-400 text-xs mb-3 m-0">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none tracking-wide hover:brightness-110 transition-all"
            >
              Request Entry
            </button>
          </div>
        </form>

        <p className="text-cream/20 text-[10px] mt-8 animate-fade-in"
           style={{ animationDelay: "0.5s", opacity: 0 }}>
          If you do not possess the password, you have not been deemed worthy.<br />
          Please consult the Groom or Best Man.
        </p>
      </div>
    </div>
  );
}
