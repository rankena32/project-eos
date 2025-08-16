window.Engine = (canvas, ctx) => {
  let scene = null;
  let last = performance.now();
  let onChange = () => {};

  function setScene(s) { scene = s; scene && scene.enter && scene.enter(); }
  function onChangeScene(cb){ onChange = cb; }
  function changeScene(name){ onChange(name); }

  function loop(now){
    const dt = Math.min(0.05, (now - last) / 1000); // saugus dt
    last = now;
    scene && scene.update && scene.update(dt);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    scene && scene.render && scene.render(ctx);
    requestAnimationFrame(loop);
  }

  return {
    canvas, ctx,
    start(){ requestAnimationFrame(loop); },
    setScene, onChangeScene, changeScene,
    keys: window.Input.keys,
    mouse: window.Input.mouse,
  };
};
