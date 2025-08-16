(function(){
  function normalizeMap(map){
    map = map || {};
    map.tilewidth  = map.tilewidth  || 32;
    map.tileheight = map.tileheight || 32;
    map.width  = map.width  || 50;
    map.height = map.height || 50;
    map.layers = Array.isArray(map.layers) ? map.layers : [];
    var ground = map.layers.find(function(l){return l.name==='ground' && Array.isArray(l.data);});
    if (!ground) {
      map.layers.push({ name:'ground', width: map.width, height: map.height, data: new Array(map.width*map.height).fill(0) });
    }
    return map;
  }

  function loadMap(name){
    return fetch('/maps/' + name + '.json', { credentials:'include' })
      .then(function(res){
        if (!res.ok) throw new Error("Žemėlapis '"+name+"' nepasiekiamas ("+res.status+")");
        return res.json();
      })
      .then(normalizeMap)
      .catch(function(){
        return normalizeMap({ width:50,height:50,tilewidth:32,tileheight:32,layers:[{name:'ground',width:50,height:50,data:new Array(2500).fill(0)}]});
      });
  }

  function drawMap(ctx, map, tileset){
    var ground = (map.layers||[]).find(function(l){return l.name==='ground';});
    var data = (ground && ground.data) || [];
    var tw = map.tilewidth, th = map.tileheight;
    var cols = tileset.columns || 1;
    var img  = tileset.image;
    if (!(img && img.complete)) return;
    for (var y=0; y<map.height; y++){
      for (var x=0; x<map.width; x++){
        var idx = y*map.width + x;
        var tile = (data[idx] || 0) - 1;
        if (tile >= 0){
          var sx = (tile % cols) * tw;
          var sy = Math.floor(tile / cols) * th;
          ctx.drawImage(img, sx, sy, tw, th, x*tw, y*th, tw, th);
        }
      }
    }
  }

  window.loadMap = loadMap;
  window.drawMap = drawMap;
})();
