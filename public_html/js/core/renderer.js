window.Renderer = () => {
  const camera = { x:0, y:0, zoom:1 };
  function worldToScreen(x,y){ return { x: (x - camera.x), y: (y - camera.y) }; }
  return { camera, worldToScreen };
};
