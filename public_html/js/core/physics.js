(function(){
  function checkCollision(player, map, nextX, nextY){
    if (!map) return false;
    var tw = map.tilewidth || 32, th = map.tileheight || 32;
    var colLayer = (map.layers||[]).find(function(l){return l.name==='collision' && Array.isArray(l.data);});
    if (!colLayer) return false;
    var colX = Math.floor(nextX / tw), colY = Math.floor(nextY / th);
    if (colX < 0 || colY < 0 || colX >= (map.width||1) || colY >= (map.height||1)) return true;
    var idx = colY * map.width + colX;
    return ((colLayer.data[idx]||0) > 0);
  }
  window.checkCollision = checkCollision;
})();
