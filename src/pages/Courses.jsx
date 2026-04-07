const COURSES = [
  {
    name: "Sequoyah National Golf Club",
    dayLabel: "Day 1 \u2014 Thursday, June 18",
    format: "2-Man Scramble, Match Play",
    slope: 138,
    rating: 72.3,
    yardage: 6724,
    par: 72,
    desc: "Robert Trent Jones II design carved through the Smoky Mountains. Dramatic elevation changes, mountain streams, and stunning views make this one of the top public courses in North Carolina. Expect tight lies, forced carries, and the kind of scenery that makes you forget you just triple-bogeyed.",
    link: "https://www.sequoyahnational.com/",
    emoji: "\u26F0\uFE0F",
    color: "from-emerald-800 to-emerald-950",
  },
  {
    name: "Smoky Mountain Country Club",
    dayLabel: "Day 2 \u2014 Friday, June 19",
    format: "Best Ball / Alternate Shot, Match Play",
    slope: 126,
    rating: 69.8,
    yardage: 6180,
    par: 71,
    desc: "George Cobb design nestled in Whittier, just minutes from Cherokee. A mountain classic with tight fairways, well-guarded greens, and Tuckasegee River views. Shorter than Sequoyah but don\u2019t let the yardage fool you \u2014 accuracy is rewarded and ego drives are punished.",
    quote: {
      text: "There\u2019s a hole out there where you lay up off the tee and the second shot is literally off the mountain.",
      attribution: "Daniel\u2019s last words before triple-bogeying and jumping to his death in a squirrel suit",
    },
    link: "https://smccgolf.com/",
    emoji: "\uD83C\uDF32",
    color: "from-green-800 to-green-950",
  },
  {
    name: "Laurel Ridge Country Club",
    dayLabel: "Day 3 \u2014 Saturday, June 20",
    format: "Individual Match Play",
    slope: 131,
    rating: 71.0,
    yardage: 6493,
    par: 72,
    desc: "Waynesville gem with panoramic mountain views at 3,000+ feet elevation. Tree-lined fairways and fast bentgrass greens reward accuracy over distance. The final battleground where individual glory \u2014 or individual shame \u2014 is earned.",
    link: "https://www.laurelridgeexperience.com/",
    emoji: "\uD83C\uDFD4\uFE0F",
    color: "from-teal-800 to-teal-950",
  },
];

export default function Courses() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Three Rounds of Mountain Golf Glory
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            The Courses
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            Each one more humbling than the last
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {COURSES.map((course, idx) => (
          <div key={course.name} className="bg-white rounded-2xl border border-cream-dark overflow-hidden animate-fade-in"
               style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}>
            {/* Course header band */}
            <div className={`bg-gradient-to-r ${course.color} px-8 py-6`}>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{course.emoji}</span>
                <div>
                  <p className="text-white/50 text-xs tracking-wider uppercase m-0">
                    {course.dayLabel}
                  </p>
                  <h2 className="text-white text-xl md:text-2xl font-bold m-0 mt-1">
                    {course.name}
                  </h2>
                  <p className="text-gold-light text-xs font-semibold m-0 mt-1 tracking-wide">
                    Format: {course.format}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <p className="text-charcoal/60 text-sm leading-relaxed m-0 mb-6">
                {course.desc}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Slope", value: course.slope },
                  { label: "Rating", value: course.rating },
                  { label: "Yardage", value: course.yardage.toLocaleString() },
                  { label: "Par", value: course.par },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-cream/50 rounded-xl py-4 px-3">
                    <p className="text-charcoal/40 text-[10px] tracking-[0.1em] uppercase m-0 mb-1">
                      {s.label}
                    </p>
                    <p className="text-pine text-2xl font-bold font-serif m-0">{s.value}</p>
                  </div>
                ))}
              </div>

              {course.quote && (
                <div className="bg-cream/50 rounded-xl p-5 mb-6 border-l-4 border-gold/40">
                  <p className="text-pine font-serif italic text-sm m-0 leading-relaxed">
                    "{course.quote.text}"
                  </p>
                  <p className="text-charcoal/40 text-xs mt-2 m-0">
                    &mdash; {course.quote.attribution}
                  </p>
                </div>
              )}

              <a
                href={course.link}
                target="_blank"
                rel="noopener"
                className="inline-block text-pine-light text-sm font-semibold no-underline border-b-2 border-pine-light/30 hover:border-pine-light pb-0.5 transition-colors"
              >
                Visit Course Website &rarr;
              </a>
            </div>
          </div>
        ))}

        {/* Sunday */}
        <div className="bg-white rounded-xl border border-cream-dark p-8 text-center">
          <p className="text-gold text-xs tracking-[0.15em] uppercase m-0 mb-2">
            Sunday, June 21
          </p>
          <h3 className="text-pine text-lg font-bold m-0 mb-2">
            Departure Day
          </h3>
          <p className="text-charcoal/50 text-sm m-0 leading-relaxed max-w-md mx-auto">
            Check-out by 11:00 AM. The Committee suggests settling all outstanding bets before
            departure. Safe travels, gentlemen. Until the next gathering.
          </p>
        </div>
      </div>
    </div>
  );
}
