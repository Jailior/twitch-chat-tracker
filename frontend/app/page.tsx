type ChannelTopWord = {
  channel: string;
  words: { word: string; count: number }[];
};

type Snapshot = {
  word: string;
  count: number;
  captured_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

async function fetchTopWords(): Promise<ChannelTopWord[]> {
  const res = await fetch(`${API_BASE}/top-words`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error("Failed to fetch top words");
  const data = await res.json();
  return data.results as ChannelTopWord[];
}

async function fetchHistory(
  channel: string,
  limit = 10
): Promise<Snapshot[]> {
  const res = await fetch(
    `${API_BASE}/history?channel=${encodeURIComponent(channel)}&limit=${limit}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.snapshots ?? []) as Snapshot[];
}

export default async function Page() {
  const topWords = await fetchTopWords();
  const firstChannel = topWords[0]?.channel;
  const history = firstChannel ? await fetchHistory(firstChannel) : [];

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Twitch Chat Tracker</p>
          <h1>Most common words per channel</h1>
          <p className="subhead">
            Live counts from Twitch IRC, with periodic snapshots for history.
          </p>
        </div>
      </header>

      <section className="grid">
        {topWords.map((entry) => (
          <article key={entry.channel} className="card">
            <p className="channel">#{entry.channel}</p>
            {entry.words.length > 0 ? (
              <div>
                <p className="label">Top word</p>
                <p className="word">{entry.words[0].word}</p>
                <p className="count">{entry.words[0].count} mentions</p>
              </div>
            ) : (
              <p className="muted">No data yet</p>
            )}
          </article>
        ))}
      </section>

      {firstChannel && (
        <section className="history">
          <h2>Recent snapshots for #{firstChannel}</h2>
          <div className="table">
            <div className="row head">
              <span>Captured</span>
              <span>Word</span>
              <span>Count</span>
            </div>
            {history.map((snap, idx) => (
              <div key={`${snap.word}-${idx}`} className="row">
                <span>{new Date(snap.captured_at).toLocaleString()}</span>
                <span>{snap.word}</span>
                <span>{snap.count}</span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="muted">No snapshots yet. Check back soon.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

