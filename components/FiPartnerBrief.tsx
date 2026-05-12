import { useState } from "react";

const EXAMPLE_COMPANIES = ["Robinhood", "Acorns", "Betterment", "Chime", "Wealthfront"];

const FIT_COLORS = {
  high: { bg: "#EAF3DE", text: "#3B6D11", border: "#639922", label: "Strong fit" },
  medium: { bg: "#FAEEDA", text: "#854F0B", border: "#BA7517", label: "Moderate fit" },
  low: { bg: "#FCEBEB", text: "#A32D2D", border: "#E24B4A", label: "Low fit" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#639922" : score >= 45 ? "#BA7517" : "#E24B4A";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 20, fontWeight: 500, fill: color }}>{score}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 10, fill: "var(--color-text-secondary)" }}>/ 100</text>
    </svg>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 16, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 16, color: "var(--color-text-secondary)" }} aria-hidden="true" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Tag({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const styles: Record<string, any> = {
    gray: { bg: "var(--color-background-secondary)", text: "var(--color-text-secondary)", border: "var(--color-border-tertiary)" },
    blue: { bg: "#E6F1FB", text: "#185FA5", border: "#378ADD" },
    green: { bg: "#EAF3DE", text: "#3B6D11", border: "#639922" },
    amber: { bg: "#FAEEDA", text: "#854F0B", border: "#BA7517" },
  };
  const s = styles[color] || styles.gray;
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, marginRight: 6, marginBottom: 6 }}>
      {children}
    </span>
  );
}

interface Brief {
  companyName: string;
  tagline: string;
  score: number;
  fitTier: "high" | "medium" | "low";
  fitRationale: string;
  partnershipAngle: string;
  integrationPath: string;
  sharedCustomers: string;
  signals: string[];
  risks: string[];
  tags: string[];
  outreach: {
    subject: string;
    body: string;
  };
  comparables: string[];
}

export default function FiPartnerBrief() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outreachCopied, setOutreachCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("brief");

  async function generateBrief(companyName: string) {
    setLoading(true);
    setBrief(null);
    setError(null);
    setActiveTab("brief");

    const systemPrompt = `You are a partnerships intelligence analyst for Fi, a modern financial wellness company that helps employees access earned wages, budgeting tools, and financial health benefits through employer partnerships.

Fi's core offering: on-demand pay (earned wage access), financial wellness tools, and employer-sponsored financial benefits. Fi partners with HR platforms, benefits brokers, payroll providers, and employers directly.

Given a company name, you will research it and return a structured partnership brief as JSON only. No markdown, no explanation, just valid JSON.

Return this exact structure:
{
  "companyName": "official company name",
  "tagline": "one-line description of what they do",
  "score": <integer 0-100 representing Fi partnership fit>,
  "fitTier": "high" | "medium" | "low",
  "fitRationale": "2-3 sentence explanation of fit score, specific to Fi's model",
  "partnershipAngle": "the most compelling single reason to partner — what does each side gain?",
  "integrationPath": "how would a Fi integration actually work here? (technical or commercial)",
  "sharedCustomers": "what customer/user segment do both companies serve?",
  "signals": ["positive signal 1", "positive signal 2", "positive signal 3"],
  "risks": ["risk or obstacle 1", "risk or obstacle 2"],
  "tags": ["tag1", "tag2", "tag3"],
  "outreach": {
    "subject": "email subject line (specific, not generic)",
    "body": "a 4-6 sentence cold outreach email from Fi's partnerships team. Specific, value-forward, references something real about their company. No fluff."
  },
  "comparables": ["similar company Fi has/would partner with 1", "comparable 2"]
}`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("Missing ANTHROPIC_API_KEY environment variable");
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Research "${companyName}" and generate a Fi partnership brief. Use web search to find current info about their product, customers, and recent news.` }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error((data as any).error?.message || "API error");

      const textBlocks = (data as any).content.filter((b: any) => b.type === "text");
      const raw = textBlocks.map((b: any) => b.text).join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response");
      const parsed = JSON.parse(jsonMatch[0]);
      setBrief(parsed);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const name = company.trim();
    if (!name) return;
    generateBrief(name);
  }

  function copyOutreach() {
    if (!brief?.outreach) return;
    const text = `Subject: ${brief.outreach.subject}\n\n${brief.outreach.body}`;
    navigator.clipboard.writeText(text);
    setOutreachCopied(true);
    setTimeout(() => setOutreachCopied(false), 2000);
  }

  const fitStyle = brief ? (FIT_COLORS[brief.fitTier] || FIT_COLORS.medium) : null;

  return (
    <div style={{ padding: "1.5rem 0", fontFamily: "var(--font-sans)", maxWidth: 660, margin: "0 auto" }}>
      <h2 className="sr-only">Fi Partner Brief — Partnership intelligence tool</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-chart-bubble" style={{ fontSize: 16, color: "#534AB7" }} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Fi partner brief</span>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
          Enter any company to get an AI-powered partnership fit score, integration angle, and ready-to-send outreach.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Company name (e.g. Gusto, Rippling, Betterment…)"
          value={company}
          onChange={e => setCompany(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ flex: 1, fontSize: 15 }}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !company.trim()}
          style={{ padding: "0 20px", fontSize: 14, whiteSpace: "nowrap", opacity: (!company.trim() || loading) ? 0.5 : 1, cursor: (!company.trim() || loading) ? "default" : "pointer" }}
        >
          {loading ? <><i className="ti ti-loader-2" style={{ fontSize: 15, verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />Researching…</> : <>Run brief <i className="ti ti-arrow-right" style={{ fontSize: 14, verticalAlign: -2, marginLeft: 4 }} aria-hidden="true" /></>}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {EXAMPLE_COMPANIES.map(c => (
          <button key={c} onClick={() => { setCompany(c); generateBrief(c); }}
            style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", color: "var(--color-text-secondary)" }}
            disabled={loading}>
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #E24B4A", borderRadius: "var(--border-radius-md)", padding: "12px 16px", color: "#A32D2D", fontSize: 14 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 8 }} aria-hidden="true" />{error}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          {["Searching for company info…", "Scoring partnership fit…", "Drafting outreach…"].map((msg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7F77DD", animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }} />
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{msg}</span>
            </div>
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3}50%{opacity:1} }`}</style>
        </div>
      )}

      {brief && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>{brief.companyName}</h3>
                <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--color-text-secondary)" }}>{brief.tagline}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                  {(brief.tags || []).map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <ScoreRing score={brief.score} />
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, background: fitStyle.bg, color: fitStyle.text, border: `0.5px solid ${fitStyle.border}` }}>
                  {fitStyle.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            {["brief", "outreach"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 500, background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #534AB7" : "2px solid transparent", color: activeTab === tab ? "#534AB7" : "var(--color-text-secondary)", cursor: "pointer", transition: "all 0.15s" }}>
                {tab === "brief" ? "Partnership brief" : "Draft outreach"}
              </button>
            ))}
          </div>

          <div style={{ padding: "0 20px 20px" }}>
            {activeTab === "brief" && (
              <>
                <Section icon="target" title="Fit rationale">
                  <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>{brief.fitRationale}</p>
                </Section>

                <Section icon="plug" title="Partnership angle">
                  <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>{brief.partnershipAngle}</p>
                </Section>

                <Section icon="users" title="Shared customers">
                  <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>{brief.sharedCustomers}</p>
                </Section>

                <Section icon="settings" title="Integration path">
                  <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>{brief.integrationPath}</p>
                </Section>

                <Section icon="chart-bar" title="Signals & risks">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      {(brief.signals || []).map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                          <i className="ti ti-circle-check" style={{ fontSize: 14, color: "#3B6D11", marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                          <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {(brief.risks || []).map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                          <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: "#BA7517", marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                          <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {brief.comparables?.length > 0 && (
                  <Section icon="building" title="Comparable partners">
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {brief.comparables.map(c => <Tag key={c} color="blue">{c}</Tag>)}
                    </div>
                  </Section>
                )}
              </>
            )}

            {activeTab === "outreach" && brief.outreach && (
              <div style={{ paddingTop: 16 }}>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject</span>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{brief.outreach.subject}</p>
                </div>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Body</span>
                  <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{brief.outreach.body}</p>
                </div>
                <button onClick={copyOutreach} style={{ fontSize: 13, padding: "8px 16px" }}>
                  {outreachCopied
                    ? <><i className="ti ti-check" style={{ fontSize: 14, verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />Copied!</>
                    : <><i className="ti ti-copy" style={{ fontSize: 14, verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />Copy to clipboard</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!brief && !loading && !error && (
        <div style={{ textAlign: "center", padding: "32px 0 16px", color: "var(--color-text-tertiary)" }}>
          <i className="ti ti-building-bank" style={{ fontSize: 32, display: "block", marginBottom: 10 }} aria-hidden="true" />
          <p style={{ fontSize: 13, margin: 0 }}>Enter a company above or try an example to generate a brief</p>
        </div>
      )}

      <div style={{ marginTop: 28, padding: "16px 20px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>About this tool</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 8px", lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 500 }}>Problem it solves:</strong> BD and partnerships teams at Fi spend hours researching potential partners before a first call — reading their website, guessing at mutual fit, and drafting cold emails from scratch. This tool does that research in seconds, surfacing a fit score with reasoning, integration path, and a ready-to-send outreach draft.
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 8px", lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 500 }}>What I'd build next:</strong> CRM sync (push brief to HubSpot/Salesforce as a contact note), a "watchlist" to monitor saved companies for news/funding signals, and a batch mode to score a list of prospects at once.
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 500 }}>How I built it:</strong> Claude + React artifact with the Anthropic API (web search tool enabled). Claude searches for live company info, then scores fit against Fi's partnership model and drafts outreach. Built in one session using Claude Sonnet 4.
        </p>
      </div>
    </div>
  );
}
