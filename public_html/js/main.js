(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const engine = window.Engine(canvas, ctx);
  const scenes = {
    // login scenos NEBENAUDOJAM (prisijungimas vyksta HTML puslapyje)
    characters:     window.SceneCharacters(engine),
    character_view: window.SceneCharacterView(engine),
    world:          window.SceneWorld(engine),
  };

  window.__ENGINE__ = engine;

  engine.onChangeScene((name) => {
    if (!scenes[name]) return;
    engine.setScene(scenes[name]);
  });

  const startScene = window.__startScene || 'world';
  engine.setScene(scenes[startScene]);
  engine.start();
})();
