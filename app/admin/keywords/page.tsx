"use client";

import { useState } from "react";
import { Search, Target, Lightbulb } from "lucide-react";

const nigeriaKeywordData: Record<string, any[]> = {
  "web development": [
    { kw: "web development company Nigeria", vol: "1.2K", diff: "Medium", intent: "Commercial" },
    { kw: "web developer Abuja", vol: "590", diff: "Low", intent: "Commercial" },
    { kw: "website design Nigeria price", vol: "880", diff: "Low", intent: "Transactional" },
    { kw: "Next.js developer Nigeria", vol: "320", diff: "Low", intent: "Commercial" },
    { kw: "hire web developer Nigeria", vol: "720", diff: "Medium", intent: "Transactional" },
    { kw: "affordable web development Lagos", vol: "480", diff: "Low", intent: "Transactional" },
  ],
  "mobile app": [
    { kw: "mobile app development Nigeria", vol: "1.4K", diff: "Medium", intent: "Commercial" },
    { kw: "React Native developer Nigeria", vol: "260", diff: "Low", intent: "Commercial" },
    { kw: "app development company Abuja", vol: "390", diff: "Low", intent: "Commercial" },
    { kw: "iOS Android app Nigeria cost", vol: "510", diff: "Medium", intent: "Informational" },
  ],
  "e-commerce": [
    { kw: "e-commerce website Nigeria", vol: "2.1K", diff: "High", intent: "Commercial" },
    { kw: "Paystack integration developer", vol: "640", diff: "Low", intent: "Commercial" },
    { kw: "WooCommerce setup Nigeria", vol: "430", diff: "Low", intent: "Transactional" },
    { kw: "online store Nigeria", vol: "3.2K", diff: "High", intent: "Transactional" },
    { kw: "e-commerce developer Lagos", vol: "710", diff: "Medium", intent: "Commercial" },
  ],
  "seo": [
    { kw: "SEO services Nigeria", vol: "1.8K", diff: "High", intent: "Commercial" },
    { kw: "SEO company Abuja", vol: "340", diff: "Low", intent: "Commercial" },
    { kw: "increase website traffic Nigeria", vol: "920", diff: "Medium", intent: "Informational" },
    { kw: "Google ranking Nigeria", vol: "560", diff: "Medium", intent: "Informational" },
  ],
};

const diffColor: Record<string, string> = {
  Low: "text-electric border-electric/20",
  Medium: "text-volt border-volt/20",
  High: "text-red-400 border-red-400/20",
};

const intentColor: Record<string, string> = {
  Commercial: "text-purple-400",
  Transactional: "text-green-400",
  Informational: "text-blue-400",
};

export default function KeywordTool() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const search = () => {
    const q = query.toLowerCase();
    let found: any[] = [];
    for (const [key, val] of Object.entries(nigeriaKeywordData)) {
      if (key.includes(q) || q.includes(key) || val.some(v => v.kw.includes(q))) {
        found = [...found, ...val];
      }
    }
    if (found.length === 0) {
      // Generate generic suggestions
      found = [
        { kw: `${query} Nigeria`, vol: "—", diff: "Low", intent: "Commercial" },
        { kw: `${query} Abuja`, vol: "—", diff: "Low", intent: "Commercial" },
        { kw: `${query} Lagos`, vol: "—", diff: "Medium", intent: "Commercial" },
        { kw: `best ${query} Nigeria`, vol: "—", diff: "Medium", intent: "Informational" },
        { kw: `${query} services Nigeria`, vol: "—", diff: "Medium", intent: "Transactional" },
        { kw: `affordable ${query} Nigeria`, vol: "—", diff: "Low", intent: "Transactional" },
      ];
    }
    setResults(found);
    setSearched(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-700 text-snow text-2xl flex items-center gap-2">
          <Target size={20} className="text-electric" />
          Keyword Research Tool
        </h1>
        <p className="text-mist text-sm mt-1">Nigeria-focused keyword suggestions for blog and page SEO</p>
      </div>

      <div className="card-base mb-6">
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Enter a topic e.g. web development, e-commerce, mobile app..."
            className="flex-1 px-4 py-3 bg-ink border border-ink-border rounded-sm text-snow text-sm focus:outline-none focus:border-electric transition-colors placeholder-mist/30"
          />
          <button onClick={search} className="btn-primary px-6">
            <Search size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.keys(nigeriaKeywordData).map(k => (
            <button
              key={k}
              onClick={() => { setQuery(k); }}
              className="text-xs font-mono text-mist/60 border border-ink-border px-2.5 py-1 rounded-sm hover:border-electric/30 hover:text-electric transition-colors"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs text-mist/60 uppercase tracking-wider">
              {results.length} keywords found for &ldquo;{query}&rdquo;
            </p>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-electric">● Low</span>
              <span className="text-volt">● Medium</span>
              <span className="text-red-400">● High</span>
              <span className="text-mist/40">● Difficulty</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-border">
                  <th className="text-left py-3 px-4 font-mono text-xs text-mist/50 uppercase tracking-wider">Keyword</th>
                  <th className="text-left py-3 px-4 font-mono text-xs text-mist/50 uppercase tracking-wider">Volume</th>
                  <th className="text-left py-3 px-4 font-mono text-xs text-mist/50 uppercase tracking-wider">Difficulty</th>
                  <th className="text-left py-3 px-4 font-mono text-xs text-mist/50 uppercase tracking-wider">Intent</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-ink-border/50 hover:bg-electric/3 transition-colors">
                    <td className="py-3 px-4 text-snow">{r.kw}</td>
                    <td className="py-3 px-4 font-mono text-mist">{r.vol}/mo</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono border px-2 py-0.5 rounded-sm ${diffColor[r.diff] || "text-mist border-ink-border"}`}>
                        {r.diff}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-xs font-mono ${intentColor[r.intent] || "text-mist"}`}>
                      {r.intent}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/admin/blog/new?kw=${encodeURIComponent(r.kw)}`}
                        className="text-xs text-electric/60 hover:text-electric transition-colors font-mono"
                      >
                        → Write post
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-base mt-5 flex items-start gap-3">
            <Lightbulb size={16} className="text-volt flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-snow text-sm font-display font-600 mb-1">SEO Tip</p>
              <p className="text-mist text-xs leading-relaxed">
                Target low-difficulty keywords first for quick wins. Focus on transactional 
                and commercial intent keywords to drive leads. Include location qualifiers 
                (Abuja, Lagos, Nigeria) for local SEO dominance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
