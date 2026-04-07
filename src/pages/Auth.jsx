import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { gateUnlocked, user, register, login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!gateUnlocked) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (!displayName.trim()) { setError("Enter your name, champ."); setLoading(false); return; }
        await register(email, password, displayName.trim(), handicap);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use" ? "That email is already registered. Try logging in."
        : err.code === "auth/invalid-credential" ? "Invalid credentials. Check your email and password."
        : err.code === "auth/weak-password" ? "Password must be at least 6 characters."
        : err.message;
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: "linear-gradient(160deg, #0d1f0d 0%, #1a3a1a 100%)" }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">&#9971;</span>
          <h1 className="text-cream text-2xl font-bold m-0">
            {isRegister ? "Join the Society" : "Welcome Back, Member"}
          </h1>
          <p className="text-gold/60 text-xs tracking-[0.15em] uppercase mt-2 m-0">
            {isRegister ? "Your presence has been requested" : "The clubhouse awaits"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex mb-6 rounded-xl overflow-hidden border border-gold/20">
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-3 text-sm font-serif font-bold border-none cursor-pointer transition-all ${
              isRegister ? "bg-gold/20 text-gold" : "bg-transparent text-cream/40"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-3 text-sm font-serif font-bold border-none cursor-pointer transition-all ${
              !isRegister ? "bg-gold/20 text-gold" : "bg-transparent text-cream/40"
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-gold/15 rounded-2xl p-8 space-y-5">
          {isRegister && (
            <>
              <div>
                <label className="block text-cream/40 text-[11px] tracking-[0.1em] uppercase mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="First and last"
                  className="w-full px-4 py-3 bg-white/8 border border-gold/15 rounded-xl text-cream text-sm"
                />
              </div>
              <div>
                <label className="block text-cream/40 text-[11px] tracking-[0.1em] uppercase mb-2">
                  Handicap <span className="text-cream/20">(optional, we won't verify)</span>
                </label>
                <input
                  type="number"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="e.g. 12 (or 42, we don't judge)"
                  className="w-full px-4 py-3 bg-white/8 border border-gold/15 rounded-xl text-cream text-sm"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-cream/40 text-[11px] tracking-[0.1em] uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-white/8 border border-gold/15 rounded-xl text-cream text-sm"
            />
          </div>
          <div>
            <label className="block text-cream/40 text-[11px] tracking-[0.1em] uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full px-4 py-3 bg-white/8 border border-gold/15 rounded-xl text-cream text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-xs m-0">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none tracking-wide hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "One moment..." : isRegister ? "Join the Society" : "Enter the Clubhouse"}
          </button>
        </form>

        <p className="text-cream/20 text-[10px] text-center mt-6">
          {isRegister
            ? "By joining, you acknowledge that your golf game will be publicly scrutinized and your handicap questioned."
            : "Forgot your password? The Committee recommends trying harder."}
        </p>

        <p className="text-cream/10 text-[9px] text-center mt-12 font-serif italic leading-relaxed max-w-xs mx-auto">
          "You'll lose a lot of money chasing women but you'll never lose women while chasing money"
          <span className="block mt-1 text-cream/8">&mdash; Phil</span>
        </p>
      </div>
    </div>
  );
}
