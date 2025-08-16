window.Input = (() => {
  const keys = {};
  const mouse = { x:0, y:0, down:false };

  addEventListener('keydown', e => keys[e.code] = true);
  addEventListener('keyup',   e => keys[e.code] = false);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('mousedown', () => mouse.down = true);
  addEventListener('mouseup',   () => mouse.down = false);

  return { keys, mouse };
})();
