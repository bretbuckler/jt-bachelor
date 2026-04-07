import { useState } from "react";

const HOUSE_RULES = [
  {
    article: "I",
    title: "Hours of Operation",
    rule: "Check-in: 4:00 PM on Thursday, June 18. Check-out: 10:00 AM on Sunday, June 21. Members arriving before check-in may leave bags on the porch and proceed directly to the first tee. Members failing to check out on time will be charged and publicly shamed.",
  },
  {
    article: "II",
    title: "Quiet Hours",
    rule: "The Committee acknowledges that 'quiet hours' is a theoretical concept during a bachelor party. However, members are reminded that the neighbors exist and possess the ability to call law enforcement. Use your judgment (if you still have any).",
  },
  {
    article: "III",
    title: "Kitchen & Common Areas",
    rule: "All members shall clean up after themselves. The dishwasher is not decorative. If you use the last of something, add it to The Board so someone can pick it up. The grill is communal property and shall be treated with the reverence it deserves.",
  },
  {
    article: "IV",
    title: "Sleeping Arrangements",
    rule: "Rooms shall be claimed on a first-come, first-served basis. The groom receives first selection as a non-negotiable right. Any disputes over bedding arrangements will be settled via closest-to-the-pin on the nearest par 3.",
  },
  {
    article: "V",
    title: "Alcohol Policy",
    rule: "Members are encouraged to consume responsibly. The consumption of domestic beer before 9:00 AM is strongly encouraged on golf days. Hard liquor before noon requires a minimum 2/3 majority vote. Wine is acceptable but will be commented upon.",
  },
  {
    article: "VI",
    title: "Golf Attire",
    rule: "Collared shirts are required on the course. Jean shorts, cargo shorts, and athletic shorts are strictly prohibited. Tank tops will result in immediate disqualification and possible banishment. Matching outfits are encouraged but not required.",
  },
  {
    article: "VII",
    title: "Electronics & Phones",
    rule: "Phone use during rounds is limited to GPS/scoring apps, group text emergencies, and capturing moments of supreme embarrassment. Taking work calls during a round will result in a 2-stroke penalty per occurrence.",
  },
  {
    article: "VIII",
    title: "Damages & Liability",
    rule: "Any damage to the property shall be reported immediately and split among the responsible party or parties. If no party claims responsibility, the cost will be divided equally. The Committee keeps receipts.",
  },
];

const WHAT_TO_BRING = [
  { category: "Golf", items: ["Clubs & bag", "Golf shoes", "Golf gloves", "Balls (bring extra, you'll need them)", "Tees & ball markers", "Rain gear / rain jacket", "Sunscreen & sunglasses", "Collared shirts (at least 3)"] },
  { category: "Lodge Life", items: ["Toiletries", "Towel (verify Airbnb provides)", "Casual clothes for evenings", "Swimsuit (if hot tub)", "Jacket/hoodie for cool mountain evenings", "Phone charger", "Cash for bets & side action", "Venmo/Zelle ready for reimbursements"] },
  { category: "Optional but Encouraged", items: ["Bluetooth speaker", "Card games / poker set", "Cigars", "Your finest trash talk", "A sense of humor about your golf game", "Sunscreen (SPF 30+ minimum)"] },
];

export default function Lodge() {
  const [openArticle, setOpenArticle] = useState(null);

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Your Temporary Palace
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            The Lodge
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            Cherokee, North Carolina
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Property Details */}
        <div className="bg-white rounded-xl border border-cream-dark p-8 mb-8">
          <h2 className="text-pine text-xl font-bold m-0 mb-2">Property Details</h2>
          <p className="text-charcoal/40 text-xs tracking-wider uppercase m-0 mb-6">
            Mountain Home &mdash; Whittier, NC
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              { label: "Check-in", value: "Thu, June 18", sub: "4:00 PM" },
              { label: "Check-out", value: "Sun, June 21", sub: "10:00 AM" },
              { label: "Sleeps", value: "18", sub: "Guests" },
              { label: "Amenities", value: "Pool", sub: "Golf · Community Pool" },
            ].map((d) => (
              <div key={d.label} className="text-center bg-cream/50 rounded-xl p-4">
                <p className="text-charcoal/40 text-[10px] tracking-[0.1em] uppercase m-0 mb-1">{d.label}</p>
                <p className="text-pine text-lg font-bold font-serif m-0">{d.value}</p>
                <p className="text-charcoal/40 text-xs m-0">{d.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-cream/50 rounded-xl p-4 mb-4">
            <p className="text-charcoal/40 text-[10px] tracking-[0.1em] uppercase m-0 mb-1">Address</p>
            <p className="text-pine text-sm font-semibold m-0">81 Mountain View Terrace, Whittier, NC</p>
            <p className="text-charcoal/40 text-xs m-0 mt-1">Hosted by Christina</p>
          </div>

          <p className="text-charcoal/50 text-sm m-0 leading-relaxed">
            Mountain home with wood-paneled interiors, a big-screen TV setup, arcade games,
            leather couches, and community pool access. Plenty of room for all members to sleep
            comfortably (or uncomfortably, depending on bet outcomes).
          </p>
        </div>

        {/* House Rules */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-cream-dark" />
            <h2 className="text-pine text-lg m-0 whitespace-nowrap">
              Official Bylaws & House Rules
            </h2>
            <div className="h-px flex-1 bg-cream-dark" />
          </div>
          <p className="text-charcoal/50 text-sm mb-6 m-0 text-center font-serif italic">
            Adopted by The Committee, April 2026. Violations subject to penalty strokes and peer ridicule.
          </p>

          <div className="space-y-3">
            {HOUSE_RULES.map((rule) => (
              <div key={rule.article} className="bg-white rounded-xl border border-cream-dark overflow-hidden">
                <button
                  onClick={() => setOpenArticle(openArticle === rule.article ? null : rule.article)}
                  className="w-full flex items-center justify-between p-5 bg-transparent border-none cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-serif font-bold text-sm w-10">
                      Art. {rule.article}
                    </span>
                    <h3 className="text-pine text-sm font-bold m-0">{rule.title}</h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-charcoal/30 transition-transform ${openArticle === rule.article ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openArticle === rule.article && (
                  <div className="px-5 pb-5 pt-0 animate-slide-down">
                    <p className="text-charcoal/60 text-sm m-0 leading-relaxed pl-14">
                      {rule.rule}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* What to Bring */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-cream-dark" />
            <h2 className="text-pine text-lg m-0 whitespace-nowrap">What to Bring</h2>
            <div className="h-px flex-1 bg-cream-dark" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WHAT_TO_BRING.map((cat) => (
              <div key={cat.category} className="bg-white rounded-xl border border-cream-dark p-6">
                <h3 className="text-pine text-sm font-bold m-0 mb-4 pb-3 border-b border-cream-dark">
                  {cat.category}
                </h3>
                <ul className="list-none p-0 m-0 space-y-2">
                  {cat.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-charcoal/60 text-sm">
                      <span className="text-gold mt-0.5 text-xs">&#9679;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
