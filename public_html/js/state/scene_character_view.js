window.SceneCharacterView = (engine, opts = {}) => {
  const c = engine.canvas, ctx = engine.ctx;
  let charId = opts.characterId || null;
  let data = null, loading = true, info = 'Kraunama...', error = null;

  function genderLabel(g){
    return g === 'm' ? 'Vyras' : (g === 'f' ? 'Moteris' : 'Nenurodyta');
  }

  async function api(url, method='GET', body){
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await res.json().catch(()=>({error:'bad_json'}));
    return { status: res.status, body: j };
  }

  async function load(){
    loading = true; error = null; info = 'Kraunama...';
    try{
      if (!charId) {
        // bandome paimti aktyvų veikėją iš localStorage
        try { charId = parseInt(localStorage.getItem('active_character_id') || '0', 10) || null; } catch(_){}
      }
      if (!charId) {
        // jei vis dar nėra – paimk pirmą iš sąrašo
        const li = await api('/api/character.php?action=list','GET');
        const arr = (li.status===200 && Array.isArray(li.body?.characters)) ? li.body.characters : [];
        if (arr.length) charId = arr[0].id;
      }
      if (!charId) { error = 'Nėra veikėjo peržiūrai. Grįžkite į sąrašą (Esc).'; loading=false; return; }

      const { status, body } = await api(`/api/character.php?action=view&character_id=${charId}`, 'GET');
      if (status === 200 && body?.character) {
        data = body.character; info = '';
      } else {
        error = body?.error || 'Nepavyko gauti duomenų';
      }
    }catch(e){ error = 'Klaida kraunant duomenis'; }
    loading = false;
  }

  async function del(){
    if (!data) return;
    if (!confirm(`Ar tikrai ištrinti veikėją „${data.name}“?`)) return;
    const { status, body } = await api('/api/character.php?action=delete','POST',{ character_id: data.id });
    if (status === 200 && body?.ok) {
      try { localStorage.removeItem('active_character_id'); } catch(_){}
      info = 'Ištrinta. Grįžtama į sąrašą...';
      setTimeout(()=> engine.changeScene('characters'), 500);
    } else {
      info = 'Nepavyko ištrinti veikėjo.';
    }
  }

  function enter(){ load(); }
  function update(dt){
    const k = engine.keys;
    if (k['Enter'])  { k['Enter']=false; engine.changeScene('world'); }
    if (k['Delete']) { k['Delete']=false; del(); }
    if (k['Escape']) { k['Escape']=false; engine.changeScene('characters'); }
  }

  function line(t, x, y, bold=false){
    ctx.font = (bold?'16px':'14px')+' system-ui';
    ctx.fillStyle = '#e7ecf5';
    ctx.fillText(t, x, y);
  }

  function renderBg(){
    ctx.fillStyle = '#0f1115'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#1b2130'; ctx.fillRect(60,50,c.width-120,c.height-100);
  }

  function renderCard(){
    if (!data) return;
    const x=100, y=120; let yy=y;
    line(`Vardas: ${data.name}`, x, yy, true); yy+=24;
    line(`Lytis: ${genderLabel(data.gender)}`, x, yy); yy+=20;
    line(`Slot: ${data.slot}`, x, yy); yy+=20;
    if (data.created_at)     { line(`Sukurta: ${data.created_at}`, x, yy); yy+=20; }
    if (data.last_played_at) { line(`Pask. žaista: ${data.last_played_at}`, x, yy); yy+=20; }
    if (data.appearance) {
      yy+=6; line('Appearance:', x, yy, true); yy+=20;
      const ap = JSON.stringify(data.appearance);
      ctx.fillStyle='#9fb0c7'; ctx.font='12px system-ui';
      ctx.fillText(ap.length>80?ap.slice(0,77)+'...':ap, x, yy);
    }
  }

  function render(ctx){
    renderBg();
    ctx.fillStyle='#e7ecf5'; ctx.font='20px system-ui';
    ctx.fillText('Veikėjo peržiūra', 100, 90);
    ctx.fillStyle='#9fb0c7'; ctx.font='12px system-ui';
    ctx.fillText('[Enter] Play  •  [Delete] Ištrinti  •  [Esc] Atgal', 100, 110);

    if (loading) {
      ctx.fillStyle='#9fb0c7'; ctx.font='14px system-ui'; ctx.fillText(info, 100, 150);
    } else if (error) {
      ctx.fillStyle='#ff6b6b'; ctx.font='14px system-ui'; ctx.fillText(error, 100, 150);
    } else {
      renderCard();
    }
  }

  return { enter, update, render };
};
