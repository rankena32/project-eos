// public_html/js/state/scene_characters.js
window.SceneCharacters = (engine) => {
  const c = engine.canvas, ctx = engine.ctx;
  let items = [], sel = 0, info = 'Kraunama...', loading = true, error = null;

  async function api(url, method='GET', body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await res.json().catch(()=>({error:'bad_json'}));
    return { status: res.status, body: j };
  }

  async function loadList() {
    loading = true; error = null; info = 'Kraunama...';
    const { status, body } = await api('/api/character.php?action=list', 'GET');
    if (status === 200 && Array.isArray(body.characters)) {
      items = body.characters;
      if (!items.length) info = 'Veikėjų nėra. Paspausk C, kad sukurtum.';
      loading = false; sel = 0;
    } else {
      loading = false; error = 'Nepavyko gauti sąrašo';
    }
  }

  async function selectCurrent() {
    if (!items.length) return;
    const id = items[sel].id;
    const { status, body } = await api('/api/character.php?action=select','POST',{ character_id: id });
    if (status === 200 && body?.ok) {
      try { localStorage.setItem('active_character_id', String(id)); } catch(_){}
      engine.changeScene('world');
    } else {
      info = 'Nepavyko pasirinkti veikėjo.';
    }
  }

  async function createCharacter() {
    let name = prompt('Įveskite naujo veikėjo vardą:', 'Herojus');
    if (!name) return;
    name = name.trim();
    if (!name) return;

    const { status, body } = await api('/api/character.php?action=create','POST',{
      name, gender:'x', slot: 1
    });
    if (status === 201 && body?.ok) {
      info = 'Sukurta. Atnaujinamas sąrašas...';
      await loadList();
    } else {
      info = body?.error === 'slot_or_name_taken' ? 'Vardas/slot užimtas.' : 'Nepavyko sukurti veikėjo.';
    }
  }

  async function deleteCharacter() {
    if (!items.length) return;
    const char = items[sel];
    if (!confirm(`Ar tikrai ištrinti veikėją "${char.name}"?`)) return;
    const { status, body } = await api('/api/character.php?action=delete', 'POST', { character_id: char.id });
    if (status === 200 && body?.ok) {
      info = `Veikėjas "${char.name}" ištrintas.`;
      await loadList();
    } else {
      info = 'Nepavyko ištrinti veikėjo.';
    }
  }

  function enter(){ loadList(); }

  function update(dt){
    const k = engine.keys;
    if (k['ArrowUp'])   { k['ArrowUp']=false; if (items.length) sel = (sel-1+items.length)%items.length; }
    if (k['ArrowDown']) { k['ArrowDown']=false; if (items.length) sel = (sel+1)%items.length; }
    if (k['Enter'])     { k['Enter']=false; selectCurrent(); }
    if (k['KeyC'])      { k['KeyC']=false; createCharacter(); }
    if (k['Delete'])    { k['Delete']=false; deleteCharacter(); }
    if (k['KeyV'])      {
      k['KeyV']=false;
      const id = items.length ? items[sel].id : null;
      if (id) {
        try { localStorage.setItem('active_character_id', String(id)); } catch(_){}
        engine.changeScene('character_view');
      }
    }
    if (k['Escape'])    { k['Escape']=false; try { window.__backToMenu && window.__backToMenu(); } catch(_){ } }
  }

  function renderList(){
    const x = 80, y0 = 110, lh = 26;
    ctx.font = '15px system-ui';
    items.forEach((it, i) => {
      const y = y0 + i*lh;
      ctx.fillStyle = i===sel ? '#e7ecf5' : '#9fb0c7';
      const last = it.last_played_at ? ` • žaista: ${it.last_played_at}` : '';
      ctx.fillText(`${i===sel?'▶':' '} ${it.name} (slot ${it.slot})${last}`, x, y);
    });
    if (!items.length) {
      ctx.fillStyle = '#9fb0c7';
      ctx.fillText('Veikėjų nėra. Paspausk C, kad sukurtum.', x, y0);
    }
  }

  function renderHeader(){
    ctx.fillStyle = '#e7ecf5';
    ctx.font = '20px system-ui';
    ctx.fillText('Veikėjai', 80, 60);
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#9fb0c7';
    ctx.fillText('[↑/↓] pasirinkti  •  [Enter] patvirtinti  •  [C] sukurti  •  [V] peržiūra  •  [Delete] ištrinti  •  [Esc] atgal', 80, 80);
  }

  function renderBg(){
    ctx.fillStyle = '#0f1115'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#1b2130'; ctx.fillRect(50,40,c.width-100,c.height-80);
  }

  function render(){
    renderBg();
    renderHeader();
    if (loading) {
      ctx.fillStyle = '#9fb0c7'; ctx.font='14px system-ui'; ctx.fillText(info, 80, 110);
    } else if (error) {
      ctx.fillStyle = '#ff6b6b'; ctx.font='14px system-ui'; ctx.fillText(error, 80, 110);
    } else {
      renderList();
      if (info) { ctx.fillStyle='#9fb0c7'; ctx.font='13px system-ui'; ctx.fillText(info, 80, c.height-40); }
    }
  }

  return { enter, update, render };
};
