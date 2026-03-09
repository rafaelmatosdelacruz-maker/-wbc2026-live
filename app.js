const statusText = document.getElementById('statusText');
const featuredGame = document.getElementById('featuredGame');
const gamesGrid = document.getElementById('gamesGrid');
const standingsGrid = document.getElementById('standingsGrid');
const scheduleBody = document.getElementById('scheduleBody');
const battingBody = document.getElementById('battingBody');
const pitchingBody = document.getElementById('pitchingBody');
const newsList = document.getElementById('newsList');
const ticker = document.getElementById('ticker');
const refreshBtn = document.getElementById('refreshBtn');
const notifyBtn = document.getElementById('notifyBtn');

function t(v){ return v ?? ''; }
function client(){ return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); }

function flagForTeam(name){
  const n = (name || '').toLowerCase();
  if(n.includes('dominicana') || n.includes('dominican')) return '🇩🇴';
  if(n.includes('israel')) return '🇮🇱';
  if(n.includes('venezuela')) return '🇻🇪';
  if(n.includes('netherlands') || n.includes('países bajos')) return '🇳🇱';
  if(n.includes('nicaragua')) return '🇳🇮';
  if(n.includes('japan') || n.includes('japón')) return '🇯🇵';
  if(n.includes('usa') || n.includes('estados unidos') || n.includes('united states')) return '🇺🇸';
  if(n.includes('mexico') || n.includes('méxico')) return '🇲🇽';
  if(n.includes('puerto rico')) return '🇵🇷';
  if(n.includes('italy') || n.includes('italia')) return '🇮🇹';
  if(n.includes('canada') || n.includes('canadá')) return '🇨🇦';
  return '🏟️';
}

function requestBrowserNotifications(){
  if(!('Notification' in window)){ alert('Tu navegador no soporta notificaciones.'); return; }
  Notification.requestPermission().then(p => {
    if(p === 'granted') alert('Alertas activadas.');
    else alert('No se permitieron las alertas.');
  });
}

function maybeNotifyScoreChange(game){
  if(!game || game.status !== 'live' || !('Notification' in window) || Notification.permission !== 'granted') return;
  const key = 'featured_game_score';
  const current = `${game.id}|${game.home_score ?? 0}|${game.away_score ?? 0}|${game.status}`;
  const prev = localStorage.getItem(key);
  if(prev && prev !== current){
    new Notification('Cambio en el juego destacado', {
      body: `${game.home_team} ${game.home_score ?? 0} - ${game.away_score ?? 0} ${game.away_team}`
    });
  }
  localStorage.setItem(key, current);
}

function renderFeaturedGame(game){
  if(!game){
    featuredGame.className = 'featured-card loading';
    featuredGame.textContent = 'No hay juego destacado.';
    return;
  }
  const scheduled = game.status === 'scheduled';
  const label = scheduled ? 'PRÓXIMO JUEGO' : (game.status === 'live' ? 'EN VIVO' : 'FINAL');
  const center = scheduled ? `${t(game.home_team)} vs ${t(game.away_team)}` : `${game.home_score ?? 0} - ${game.away_score ?? 0}`;
  const sub = scheduled ? `${t(game.game_date)} · ${t(game.game_time)}` : `${t(game.status).toUpperCase()} · ${t(game.game_date)} ${t(game.game_time)}`;
  featuredGame.className = 'featured-card';
  featuredGame.innerHTML = `
    <div class="featured-score">
      <div class="team">
        <div class="flag">${flagForTeam(game.home_team)}</div>
        <div class="team-name">${t(game.home_team)}</div>
        <div class="team-meta">${t(game.venue)}</div>
      </div>
      <div class="mid">
        <div class="game-status">${label}</div>
        <div class="main-score">${center}</div>
        <div class="sub-score">${sub}</div>
        <div class="meta-chips">
          <span class="chip">${t(game.city)}</span>
          <span class="chip">${t(game.status)}</span>
          <span class="chip">${t(game.venue)}</span>
        </div>
      </div>
      <div class="team">
        <div class="flag">${flagForTeam(game.away_team)}</div>
        <div class="team-name">${t(game.away_team)}</div>
        <div class="team-meta">${t(game.venue)}</div>
      </div>
    </div>
  `;
  maybeNotifyScoreChange(game);
}

function renderGames(rows){
  if(!rows?.length){ gamesGrid.innerHTML = '<div class="loading-card">Sin juegos</div>'; return; }
  gamesGrid.innerHTML = rows.map(g => `
    <article class="game-card">
      <div class="game-top">
        <span>${t(g.game_date)}</span>
        <span>${t(g.status).toUpperCase()}</span>
      </div>
      <div class="game-match">${t(g.home_team)} vs ${t(g.away_team)}</div>
      <div class="game-line">${g.status === 'scheduled' ? t(g.game_time) : `${g.home_score ?? 0} - ${g.away_score ?? 0}`}</div>
      <div class="game-line">${t(g.venue)} · ${t(g.city)}</div>
    </article>
  `).join('');
}

function renderStandings(rows){
  if(!rows?.length){ standingsGrid.innerHTML = '<div class="card">Sin standings</div>'; return; }
  const pools = [...new Set(rows.map(r => r.pool))];
  standingsGrid.innerHTML = pools.map(pool => {
    const group = rows.filter(r => r.pool === pool).sort((a,b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    return `
      <div class="card">
        <div class="section-head small"><h2>Pool ${pool}</h2><p>Standings actualizados</p></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Equipo</th><th>W</th><th>L</th><th>PCT</th></tr></thead>
            <tbody>
              ${group.map(r => `<tr><td>${t(r.team_name)}</td><td>${t(r.wins)}</td><td>${t(r.losses)}</td><td>${t(r.pct)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function renderSchedule(rows){
  if(!rows?.length){ scheduleBody.innerHTML = '<tr><td colspan="6">Sin juegos</td></tr>'; return; }
  scheduleBody.innerHTML = rows.map(g => `
    <tr>
      <td>${t(g.game_date)}</td>
      <td>${t(g.game_time)}</td>
      <td>${t(g.home_team)} vs ${t(g.away_team)}</td>
      <td>${t(g.status)}</td>
      <td>${t(g.venue)}</td>
      <td>${t(g.city)}</td>
    </tr>
  `).join('');
}

function renderBatting(rows){
  battingBody.innerHTML = !rows?.length
    ? '<tr><td colspan="5">Sin datos</td></tr>'
    : rows.map(r => `<tr><td>${t(r.player_name)}</td><td>${t(r.team_abbr)}</td><td>${t(r.avg)}</td><td>${t(r.hr)}</td><td>${t(r.rbi)}</td></tr>`).join('');
}

function renderPitching(rows){
  pitchingBody.innerHTML = !rows?.length
    ? '<tr><td colspan="5">Sin datos</td></tr>'
    : rows.map(r => `<tr><td>${t(r.player_name)}</td><td>${t(r.team_abbr)}</td><td>${t(r.era)}</td><td>${t(r.ip)}</td><td>${t(r.so)}</td></tr>`).join('');
}

function renderNews(rows){
  newsList.innerHTML = !rows?.length
    ? '<article class="news-card">Sin noticias</article>'
    : rows.map(r => `<article class="news-card"><div class="news-title">${t(r.title)}</div><div class="news-meta">${t(r.published_label)}</div><p>${t(r.summary)}</p></article>`).join('');
}

function renderTicker(games){
  if(!games?.length){ ticker.textContent = 'Sin juegos cargados.'; return; }
  const line = games.map(g => {
    const score = g.status === 'scheduled' ? `${t(g.game_time)}` : `${g.home_score ?? 0}-${g.away_score ?? 0}`;
    return `${t(g.home_team)} vs ${t(g.away_team)} · ${score} · ${t(g.status).toUpperCase()}`;
  }).join('  •  ');
  ticker.textContent = line + '  •  ' + line;
}

async function loadData(){
  try{
    statusText.textContent = 'Actualizando…';
    if(!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY){
      statusText.textContent = 'Falta configuración de Supabase.';
      return;
    }
    const supabase = client();
    const [featuredRes, gamesRes, standingsRes, battingRes, pitchingRes, newsRes] = await Promise.all([
      supabase.from('games').select('*').eq('featured', true).limit(1).maybeSingle(),
      supabase.from('games').select('*').order('game_date', { ascending:true }).order('game_time', { ascending:true }),
      supabase.from('standings').select('*').order('pool', { ascending:true }).order('sort_order', { ascending:true }),
      supabase.from('batting_leaders').select('*').order('sort_order', { ascending:true }).limit(10),
      supabase.from('pitching_leaders').select('*').order('sort_order', { ascending:true }).limit(10),
      supabase.from('news_items').select('*').order('id', { ascending:false }).limit(6)
    ]);

    [featuredRes, gamesRes, standingsRes, battingRes, pitchingRes, newsRes].forEach(r => { if(r.error) throw r.error; });

    renderFeaturedGame(featuredRes.data);
    renderGames(gamesRes.data);
    renderStandings(standingsRes.data);
    renderSchedule(gamesRes.data);
    renderBatting(battingRes.data);
    renderPitching(pitchingRes.data);
    renderNews(newsRes.data);
    renderTicker(gamesRes.data);

    const now = new Date();
    statusText.textContent = 'Última actualización: ' + now.toLocaleTimeString('es-DO', { hour:'numeric', minute:'2-digit', second:'2-digit' });
  }catch(err){
    console.error(err);
    statusText.textContent = 'Error cargando datos.';
  }
}

refreshBtn?.addEventListener('click', loadData);
notifyBtn?.addEventListener('click', requestBrowserNotifications);
loadData();
setInterval(loadData, 30000);
