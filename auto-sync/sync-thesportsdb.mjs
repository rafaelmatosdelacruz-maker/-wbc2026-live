import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

const SUPABASE_URL = env('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const SPORTSDB_API_BASE = env('SPORTSDB_API_BASE', 'https://www.thesportsdb.com/api/v1/json/1');
const WBC_LEAGUE_ID = env('WBC_LEAGUE_ID', '5755');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeTeam(name = '') {
  const trimmed = String(name).trim();
  const replacements = {
    'Dominican Republic': 'República Dominicana',
    'Dominican Rep.': 'República Dominicana',
    'Mexico': 'México',
    'Japan': 'Japón',
    'Italy': 'Italia',
    'United States': 'USA',
    'Korea Republic': 'Korea'
  };
  return replacements[trimmed] || trimmed;
}

function inferPool(home, away) {
  const all = [home, away];
  const set = new Set(all.map(t => normalizeTeam(t)));
  const pools = {
    A: ['Canada', 'Colombia', 'Cuba', 'Panama', 'Puerto Rico'],
    B: ['Japón', 'Australia', 'Korea', 'Czech Republic', 'Chinese Taipei'],
    C: ['USA', 'México', 'Italia', 'Great Britain', 'Canada'],
    D: ['República Dominicana', 'Venezuela', 'Israel', 'Netherlands', 'Nicaragua']
  };
  for (const [pool, teams] of Object.entries(pools)) {
    if ([...set].every(team => teams.includes(team))) return pool;
  }
  return null;
}

function mapStatus(raw = '') {
  const s = String(raw).toUpperCase();
  if (s === 'NS') return 'scheduled';
  if (s === 'FT' || s === 'AOT') return 'final';
  if (s.startsWith('IN')) return 'live';
  return 'scheduled';
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'accept': 'application/json' }});
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchSportsDbGames() {
  const [past, next] = await Promise.all([
    fetchJson(`${SPORTSDB_API_BASE}/eventspastleague.php?id=${WBC_LEAGUE_ID}`),
    fetchJson(`${SPORTSDB_API_BASE}/eventsnextleague.php?id=${WBC_LEAGUE_ID}`)
  ]);

  const combined = [...(past.events || []), ...(next.events || [])];
  return combined.map(event => {
    const homeTeam = normalizeTeam(event.strHomeTeam || '');
    const awayTeam = normalizeTeam(event.strAwayTeam || '');
    return {
      provider_id: `sportsdb:${event.idEvent}`,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: event.intHomeScore ? Number(event.intHomeScore) : null,
      away_score: event.intAwayScore ? Number(event.intAwayScore) : null,
      status: mapStatus(event.strStatus),
      game_date: event.dateEvent || null,
      game_time: event.strTime ? event.strTime.slice(0,5) : null,
      venue: event.strVenue || null,
      city: event.strCity || null,
      featured: homeTeam === 'República Dominicana' || awayTeam === 'República Dominicana',
      pool: inferPool(homeTeam, awayTeam),
      provider_source: 'thesportsdb',
      updated_at: new Date().toISOString()
    };
  });
}

function pct(w, l) {
  const total = w + l;
  if (!total) return '.000';
  return (w / total).toFixed(3);
}

function computeStandings(games) {
  const finished = games.filter(g => g.status === 'final' && g.pool && g.home_score != null && g.away_score != null);
  const map = new Map();

  function ensure(pool, team) {
    const key = `${pool}|${team}`;
    if (!map.has(key)) map.set(key, { pool, team_name: team, wins: 0, losses: 0, pct: '.000', sort_order: 999, updated_at: new Date().toISOString() });
    return map.get(key);
  }

  for (const g of finished) {
    const home = ensure(g.pool, g.home_team);
    const away = ensure(g.pool, g.away_team);
    if (g.home_score > g.away_score) {
      home.wins += 1;
      away.losses += 1;
    } else if (g.away_score > g.home_score) {
      away.wins += 1;
      home.losses += 1;
    }
  }

  const rows = [...map.values()].map(r => ({ ...r, pct: pct(r.wins, r.losses) }));
  const byPool = {};
  for (const row of rows) {
    byPool[row.pool] ||= [];
    byPool[row.pool].push(row);
  }

  const out = [];
  for (const pool of Object.keys(byPool)) {
    byPool[pool]
      .sort((a,b) => b.wins - a.wins || a.losses - b.losses || a.team_name.localeCompare(b.team_name))
      .forEach((row, idx) => out.push({ ...row, sort_order: idx + 1 }));
  }
  return out;
}

async function upsertGames(games) {
  if (!games.length) return;
  const { error } = await supabase.from('games').upsert(games, { onConflict: 'provider_id' });
  if (error) throw error;
}

async function replaceStandings(standings) {
  await supabase.from('standings').delete().neq('id', 0);
  if (!standings.length) return;
  const { error } = await supabase.from('standings').insert(standings);
  if (error) throw error;
}

async function sync() {
  console.log('Iniciando sync con TheSportsDB…');
  const games = await fetchSportsDbGames();
  await upsertGames(games);
  const standings = computeStandings(games);
  await replaceStandings(standings);
  console.log(`Sync completado. Juegos: ${games.length}, standings: ${standings.length}`);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
