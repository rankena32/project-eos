window.SceneLogin = (engine) => {
  let email = '', pass = '', info = 'Prisijunk arba susikurk paskyrą (API JSON).';
  const c = engine.canvas, ctx = engine.ctx;

  async function api(url, method='GET', body){
    const res = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    return await res.json();
  }

  function drawUI(){
    ctx.fillStyle = '#e7ecf5';
    ctx.font = '16px system-ui';
    ctx.fillText('Email: ' + email, 40, 60);
    ctx.fillText('Pass:  ' + (pass ? '••••••' : ''), 40, 84);
    ctx.fillText('[L] Login   [R] Register   [C] Create Character   [W] → World', 40, 120);
    ctx.fillStyle = '#9fb0c7';
    ctx.fillText(info, 40, 150);
  }

  async function tryLogin(){
    const out = await api('/api/auth.php?action=login','POST',{email, password:pass});
    info = out.ok ? 'Prisijungta' : 'KLAIDA: ' + (out.error || '???');
  }

  async function tryRegister(){
    const out = await api('/api/auth.php?action=register','POST',{email, password:pass});
    info = out.ok ? 'Sukurta ir prisijungta' : 'KLAIDA: ' + (out.error || '???');
  }

  async function tryCreateCharacter(){
    const name = prompt('Įveskite veikėjo vardą:', 'Herojus');
    if (!name) return;
    const out = await api('/api/character.php?action=create','POST',{
      name, gender:'m', slot:1
    });
    info = out.ok ? 'Veikėjas sukurtas (ID: '+out.character_id+')' : 'KLAIDA: ' + (out.error || '???');
  }

  function update(dt){
    // demo įvedimas: 1 = email, 2 = password
    if (engine.keys['Digit1']) email = 'test@example.com';
    if (engine.keys['Digit2']) pass  = 'secret12';
    if (engine.keys['KeyL']) { engine.keys['KeyL']=false; tryLogin(); }
    if (engine.keys['KeyR']) { engine.keys['KeyR']=false; tryRegister(); }
    if (engine.keys['KeyC']) { engine.keys['KeyC']=false; tryCreateCharacter(); }
    if (engine.keys['KeyW']) { engine.keys['KeyW']=false; engine.changeScene('world'); }
  }

  function render(){
    ctx.fillStyle = '#151923';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#8fd14f'; ctx.fillRect(30,30,4,120);
    drawUI();
  }

  return { enter(){}, update, render };
};
