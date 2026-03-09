const adminStatus = document.getElementById('adminStatus');
const loadAdminBtn = document.getElementById('loadAdminBtn');
const gameForm = document.getElementById('gameForm');
const newsForm = document.getElementById('newsForm');
const adminGames = document.getElementById('adminGames');
const adminNews = document.getElementById('adminNews');

function a(v){ return v ?? ''; }
function client(){ return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); }

async function loadAdminData(){
  try{
    adminStatus.textContent = 'Cargando panel…';
    const supabase = client();

    const [gameRes, gamesRes, newsRes] = await Promise.all([
      supabase.from('games').select('*').eq('featured', true).limit(1).maybeSingle(),
      supabase.from('games').select('*').order('game_date', { ascending:true }).order('game_time', { ascending:true }),
      supabase.from('news_items').select('*').order('id', { ascending:false }).limit(8),
    ]);

    [gameRes, gamesRes, newsRes].forEach(r => { if(r.error) throw r.error; });

    const g = gameRes.data;
    if(g){
      document.getElementById('game_id').value = g.id ?? '';
      document.getElementById('home_team').value = a(g.home_team);
      document.getElementById('away_team').value = a(g.away_team);
      document.getElementById('home_score').value = g.home_score ?? '';
      document.getElementById('away_score').value = g.away_score ?? '';
      document.getElementById('status').value = a(g.status);
      document.getElementById('game_date').value = a(g.game_date);
      document.getElementById('game_time').value = a(g.game_time);
      document.getElementById('venue').value = a(g.venue);
      document.getElementById('city').value = a(g.city);
      document.getElementById('featured').value = String(g.featured);
    }

    adminGames.innerHTML = (gamesRes.data || []).map(g => `
      <div class="admin-item">
        <strong>${a(g.home_team)} vs ${a(g.away_team)}</strong>
        ${a(g.game_date)} · ${a(g.game_time)}<br>
        Estado: ${a(g.status)} · Score: ${a(g.home_score ?? '')} - ${a(g.away_score ?? '')}<br>
        ${a(g.venue)} · ${a(g.city)}
      </div>
    `).join('') || 'Sin juegos.';

    adminNews.innerHTML = (newsRes.data || []).map(n => `
      <div class="admin-item">
        <strong>${a(n.title)}</strong>
        ${a(n.published_label)}<br>
        ${a(n.summary)}
      </div>
    `).join('') || 'Sin noticias.';

    adminStatus.textContent = 'Panel listo.';
  }catch(err){
    console.error(err);
    adminStatus.textContent = 'Error cargando el panel.';
  }
}

gameForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try{
    const supabase = client();
    const id = document.getElementById('game_id').value;
    const payload = {
      home_team: document.getElementById('home_team').value,
      away_team: document.getElementById('away_team').value,
      home_score: document.getElementById('home_score').value || null,
      away_score: document.getElementById('away_score').value || null,
      status: document.getElementById('status').value,
      game_date: document.getElementById('game_date').value || null,
      game_time: document.getElementById('game_time').value || null,
      venue: document.getElementById('venue').value,
      city: document.getElementById('city').value,
      featured: document.getElementById('featured').value === 'true'
    };

    let res;
    if(id){
      res = await supabase.from('games').update(payload).eq('id', id);
    }else{
      res = await supabase.from('games').insert(payload);
    }
    if(res.error) throw res.error;
    adminStatus.textContent = 'Juego guardado.';
    loadAdminData();
  }catch(err){
    console.error(err);
    adminStatus.textContent = 'Error guardando juego.';
  }
});

newsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try{
    const supabase = client();
    const payload = {
      title: document.getElementById('news_title').value,
      summary: document.getElementById('news_summary').value,
      published_label: document.getElementById('news_label').value
    };
    const res = await supabase.from('news_items').insert(payload);
    if(res.error) throw res.error;
    newsForm.reset();
    adminStatus.textContent = 'Noticia publicada.';
    loadAdminData();
  }catch(err){
    console.error(err);
    adminStatus.textContent = 'Error publicando noticia.';
  }
});

loadAdminBtn?.addEventListener('click', loadAdminData);
loadAdminData();
