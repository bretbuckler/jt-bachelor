import { useState, useEffect, useMemo } from "react";
import {
  collection, doc, setDoc, onSnapshot, query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const AIRPORTS = [
  "AVL - Asheville, NC",
  "CLT - Charlotte, NC",
  "ATL - Atlanta, GA",
  "GSP - Greenville, SC",
  "TYS - Knoxville, TN",
  "Other",
];

export default function Travel() {
  const { user, profile } = useAuth();
  const [travelData, setTravelData] = useState([]);
  const [form, setForm] = useState({
    departureCity: "",
    arrivalAirport: "",
    arrivalDate: "",
    arrivalTime: "",
    departureDate: "",
    departureTime: "",
    airline: "",
    flightNumber: "",
    needsRide: true,
    canDrive: false,
    seats: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "travel"));
    const unsub = onSnapshot(q, (snap) => {
      setTravelData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Load existing data for current user
  useEffect(() => {
    const mine = travelData.find((t) => t.uid === user?.uid);
    if (mine) {
      setForm({
        departureCity: mine.departureCity || "",
        arrivalAirport: mine.arrivalAirport || "",
        arrivalDate: mine.arrivalDate || "",
        arrivalTime: mine.arrivalTime || "",
        departureDate: mine.departureDate || "",
        departureTime: mine.departureTime || "",
        airline: mine.airline || "",
        flightNumber: mine.flightNumber || "",
        needsRide: mine.needsRide ?? true,
        canDrive: mine.canDrive || false,
        seats: mine.seats || "",
        notes: mine.notes || "",
      });
    }
  }, [travelData, user?.uid]);

  const sanitize = (str, maxLen = 50) =>
    str.replace(/[<>{}$]/g, "").slice(0, maxLen).trim();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const clean = {
      departureCity: sanitize(form.departureCity),
      arrivalAirport: AIRPORTS.includes(form.arrivalAirport) ? form.arrivalAirport : "",
      arrivalDate: form.arrivalDate,
      arrivalTime: form.arrivalTime,
      departureDate: form.departureDate,
      departureTime: form.departureTime,
      airline: sanitize(form.airline, 30),
      flightNumber: sanitize(form.flightNumber, 15).replace(/[^a-zA-Z0-9]/g, ""),
      needsRide: !!form.needsRide,
      canDrive: !!form.canDrive,
      seats: form.seats ? Math.min(Math.max(Math.round(Number(form.seats)), 0), 10).toString() : "",
      notes: sanitize(form.notes, 200),
      uid: user.uid,
      displayName: profile?.displayName || user.email,
    };

    await setDoc(doc(db, "travel", user.uid), clean);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Carpool matching algorithm
  const carpoolGroups = useMemo(() => {
    const arrivals = travelData.filter((t) => t.arrivalAirport && t.arrivalDate && t.arrivalTime);
    const groups = [];

    arrivals.forEach((person) => {
      const existingGroup = groups.find((g) => {
        if (g.airport !== person.arrivalAirport) return false;
        const personTime = new Date(`${person.arrivalDate}T${person.arrivalTime}`);
        return g.members.some((m) => {
          const mTime = new Date(`${m.arrivalDate}T${m.arrivalTime}`);
          return Math.abs(personTime - mTime) <= 2 * 60 * 60 * 1000; // 2 hours
        });
      });

      if (existingGroup) {
        existingGroup.members.push(person);
      } else {
        groups.push({
          airport: person.arrivalAirport,
          members: [person],
        });
      }
    });

    return groups.filter((g) => g.members.length > 1);
  }, [travelData]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            The Bureau of Transportation & Logistics
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            Travel Plans
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            Enter your details so we can figure out who's riding with whom
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Your Travel Form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-cream-dark p-8 mb-10">
          <h2 className="text-pine text-lg font-bold m-0 mb-6">Your Travel Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Departing From (City)
              </label>
              <input
                type="text"
                value={form.departureCity}
                onChange={(e) => update("departureCity", e.target.value)}
                placeholder="e.g. Nashville, TN"
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Arrival Airport
              </label>
              <select
                value={form.arrivalAirport}
                onChange={(e) => update("arrivalAirport", e.target.value)}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              >
                <option value="">Select airport</option>
                {AIRPORTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Arrival Date
              </label>
              <input
                type="date"
                value={form.arrivalDate}
                onChange={(e) => update("arrivalDate", e.target.value)}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Arrival Time
              </label>
              <input
                type="time"
                value={form.arrivalTime}
                onChange={(e) => update("arrivalTime", e.target.value)}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Departure Date
              </label>
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => update("departureDate", e.target.value)}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Departure Time
              </label>
              <input
                type="time"
                value={form.departureTime}
                onChange={(e) => update("departureTime", e.target.value)}
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Airline
              </label>
              <input
                type="text"
                value={form.airline}
                onChange={(e) => update("airline", e.target.value)}
                placeholder="e.g. Delta, Southwest"
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <div>
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Flight Number
              </label>
              <input
                type="text"
                value={form.flightNumber}
                onChange={(e) => update("flightNumber", e.target.value)}
                placeholder="e.g. DL1234"
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
          </div>

          {/* Driving options */}
          <div className="mt-6 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-charcoal/60 cursor-pointer">
              <input
                type="checkbox"
                checked={form.needsRide}
                onChange={(e) => update("needsRide", e.target.checked)}
                className="accent-pine"
              />
              I need a ride from the airport
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal/60 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canDrive}
                onChange={(e) => update("canDrive", e.target.checked)}
                className="accent-pine"
              />
              I'm renting a car / can drive others
            </label>
          </div>

          {form.canDrive && (
            <div className="mt-4">
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                Available Seats (for passengers)
              </label>
              <input
                type="number"
                value={form.seats}
                onChange={(e) => update("seats", e.target.value)}
                placeholder="e.g. 3"
                className="w-32 p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
          )}

          <div className="mt-5">
            <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anything else? Driving vs flying? Special requests?"
              rows={2}
              className="w-full p-3 border border-cream-dark rounded-xl text-sm resize-none bg-cream/30"
            />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {saving ? "Saving..." : "Save Travel Info"}
            </button>
            {saved && <span className="text-pine-light text-sm font-semibold animate-fade-in">Saved!</span>}
          </div>
        </form>

        {/* Carpool Recommendations */}
        {carpoolGroups.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-cream-dark" />
              <h2 className="text-pine text-lg m-0 whitespace-nowrap">
                Recommended Carpools
              </h2>
              <div className="h-px flex-1 bg-cream-dark" />
            </div>
            <p className="text-charcoal/50 text-sm mb-6 m-0 text-center font-serif italic">
              The Bureau has identified the following travel synergies
            </p>
            <div className="space-y-4">
              {carpoolGroups.map((group, i) => (
                <div key={i} className="bg-white rounded-xl border border-cream-dark p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">&#128663;</span>
                    <h3 className="text-pine text-sm font-bold m-0">
                      {group.airport}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {group.members
                      .sort((a, b) => {
                        const ta = new Date(`${a.arrivalDate}T${a.arrivalTime}`);
                        const tb = new Date(`${b.arrivalDate}T${b.arrivalTime}`);
                        return ta - tb;
                      })
                      .map((m) => (
                        <div key={m.uid} className="flex items-center gap-4 text-sm">
                          <div className="w-7 h-7 bg-pine rounded-full flex items-center justify-center text-cream text-[10px] font-bold shrink-0">
                            {(m.displayName || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-pine">{m.displayName}</span>
                          <span className="text-charcoal/40">
                            arrives {m.arrivalDate} at {m.arrivalTime}
                          </span>
                          {m.canDrive && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              DRIVER ({m.seats || "?"} seats)
                            </span>
                          )}
                          {m.needsRide && !m.canDrive && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              NEEDS RIDE
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Everyone's Travel */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-cream-dark" />
            <h2 className="text-pine text-lg m-0 whitespace-nowrap">All Travel Plans</h2>
            <div className="h-px flex-1 bg-cream-dark" />
          </div>

          {travelData.length === 0 ? (
            <p className="text-center text-charcoal/40 text-sm py-8 font-serif italic">
              No travel plans submitted yet. Be the first to file your itinerary.
            </p>
          ) : (
            <div className="space-y-3">
              {travelData.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-cream-dark p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-pine text-sm font-bold m-0">{t.displayName}</h3>
                    <span className="text-charcoal/30 text-xs">from {t.departureCity || "TBD"}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-charcoal/60">
                    <div>
                      <span className="text-charcoal/30 uppercase tracking-wider text-[10px] block">Arriving</span>
                      {t.arrivalDate || "TBD"} {t.arrivalTime && `at ${t.arrivalTime}`}
                    </div>
                    <div>
                      <span className="text-charcoal/30 uppercase tracking-wider text-[10px] block">Airport</span>
                      {t.arrivalAirport || "TBD"}
                    </div>
                    <div>
                      <span className="text-charcoal/30 uppercase tracking-wider text-[10px] block">Flight</span>
                      {t.airline ? `${t.airline} ${t.flightNumber}` : "TBD"}
                    </div>
                    <div>
                      <span className="text-charcoal/30 uppercase tracking-wider text-[10px] block">Departing</span>
                      {t.departureDate || "TBD"} {t.departureTime && `at ${t.departureTime}`}
                    </div>
                  </div>
                  {t.notes && (
                    <p className="text-charcoal/40 text-xs mt-2 m-0 italic">{t.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
