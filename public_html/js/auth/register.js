(function(){
  const form  = document.getElementById('regForm');
  const email = document.getElementById('email');
  const pass  = document.getElementById('pass');
  const pass2 = document.getElementById('pass2');
  const tos   = document.getElementById('tos');
  const msg   = document.getElementById('msg');
  const ok    = document.getElementById('ok');

  function showErr(t){ msg.textContent = t || ''; ok.textContent=''; }
  function showOk(t){ ok.textContent  = t || ''; msg.textContent=''; }

  async function apiRegister(email, password){
    const res = await fetch('/api/auth.php?action=register', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const j = await res.json().catch(()=>({error:'bad_json'}));
    return { status: res.status, body: j };
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    showErr('');

    const vEmail = email.value.trim().toLowerCase();
    const vPass  = pass.value;
    const vPass2 = pass2.value;

    if (!vEmail) return showErr('Įvesk el. paštą.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vEmail)) return showErr('Neteisingas el. pašto formatas.');
    if (vPass.length < 8) return showErr('Slaptažodis per trumpas (min. 8).');
    if (vPass !== vPass2) return showErr('Slaptažodžiai nesutampa.');
    if (!tos.checked) return showErr('Reikia sutikti su taisyklėmis.');

    showOk('Kuriama paskyra...');
    const { status, body } = await apiRegister(vEmail, vPass);

    if (status === 201 && body && body.ok) {
      showOk('Paskyra sukurta! Peradresuojama...');
      // Variantas A: po sėkmės – į veikėjo kūrimą (HTML forma)
      window.location.href = '/auth/character-create.html';
      // Variantas B (jei norėsi, perjunk): tiesiai į Canvas
      // window.location.href = '/';
      return;
    }
    // Klaidos iš API
    switch (body?.error) {
      case 'email_in_use':  showErr('Šis el. paštas jau naudojamas.'); break;
      case 'invalid_input': showErr('Patikrink įvestus duomenis.'); break;
      default:              showErr('Nepavyko užsiregistruoti. Bandyk dar kartą.');
    }
  });
})();
