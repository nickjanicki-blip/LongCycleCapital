import { Redis } from '@upstash/redis';

const K = {
  latest: 'dash:latest',
  history: 'dash:history',
  inputs: 'dash:inputs',
  journal: 'dash:journal',
};

function redis() {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Redis (KV_REST_API_URL/TOKEN) not configured');
  return new Redis({ url, token });
}

const parse = v => (typeof v === 'string' ? JSON.parse(v) : v);

export async function getLatest() { return parse(await redis().get(K.latest)); }
export async function getInputs() { return parse(await redis().get(K.inputs)) || {}; }
export async function getJournal() { return parse(await redis().get(K.journal)) || []; }
export async function setInputs(v) { await redis().set(K.inputs, JSON.stringify(v)); }
export async function setJournal(v) { await redis().set(K.journal, JSON.stringify(v)); }

export async function saveSnapshot(snapshot, summary) {
  const r = redis();
  await r.set(K.latest, JSON.stringify(snapshot));
  await r.lpush(K.history, JSON.stringify(summary));
  await r.ltrim(K.history, 0, 399);
}

export async function getHistory(n = 60) {
  return (await redis().lrange(K.history, 0, n - 1)).map(parse);
}
