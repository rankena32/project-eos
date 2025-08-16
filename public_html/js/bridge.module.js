// Tiltas tarp ESM ir seno "window.*" pasaulio

// 1) Pasaulio scena (mūsiškis ESM → window.SceneWorld factory)
import SceneWorld from "./state/scene_world.js";
window.SceneWorld = (engine) => new SceneWorld(engine, {
  character_id: window.__CHAR_ID__ || 0
});

// 2) Jei tavo Engine irgi ESM — atkomentuok ir pririšk:
// import Engine from "./core/engine.js";
// window.Engine = (canvas, ctx) => new Engine({ canvas, ctx });

// 3) Jei turi modularizuotas kitas scenas, gali pririšti panašiai:
// import SceneCharacters from "./state/scene_characters.js";
// window.SceneCharacters = (engine) => new SceneCharacters(engine);

// import SceneCharacterView from "./state/scene_character_view.js";
// window.SceneCharacterView = (engine) => new SceneCharacterView(engine);
