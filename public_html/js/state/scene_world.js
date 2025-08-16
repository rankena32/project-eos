(function(){
  function api(url, method, body){
    method = method || 'GET';
    var opts = { method: method, headers:{'Content-Type':'application/json'}, credentials:'include' };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res){
      return res.json().catch(function(){ return {error:'bad_json'}; }).then(function(j){ return { status: res.status, body: j }; });
    }).catch(function(){ return { status: 0, body:{error:'network_error'} }; });
  }

  function throttle(fn, ms){
    var t = 0;
    return function(){
      var now = performance.now();
      if (now - t >= ms){ t = now; fn.apply(null, arguments); }
    };
  }

  window.SceneWorld = function(engine, opts){
    opts = opts || {};
    var canvas = engine.canvas, ctx = engine.ctx;

    var map = null;
    var tileset = new Image();
    tileset.columns = 8;
    var tilesetLoaded = false;

    var player = { x:64, y:64, speed:2, character_id: opts.character_id || 0, map:'start_village' };
    var camera = new window.Camera(canvas.width, canvas.height);

    var saveThrottled = throttle(savePosition, 1500);

    function savePosition(){
      if (!player.character_id) return;
      return api('/api/character.php?action=save_position','POST',{
        character_id: player.character_id, map: player.map,
        x: Math.round(player.x), y: Math.round(player.y)
      });
    }

    function init(){
      var p = Promise.resolve();
      if (player.character_id){
        p = api('/api/character.php?action=get_position&character_id='+player.character_id,'GET').then(function(r){
          if (r.status===200 && r.body && r.body.character){
            player.map = r.body.character.map || 'start_village';
            player.x = Number.isFinite(r.body.character.pos_x) ? r.body.character.pos_x : 64;
            player.y = Number.isFinite(r.body.character.pos_y) ? r.body.character.pos_y : 64;
          }
        });
      }
      return p.then(function(){
        return window.loadMap(player.map).then(function(m){ map = m; });
      }).then(function(){
        return new Promise(function(res){
          tileset.onload = function(){ tilesetLoaded = true; res(); };
          tileset.onerror = function(){ tilesetLoaded = false; res(); };
          tileset.src = "/assets/tilesets/basic.png";
        });
      });
    }

    function update(input){
      if (!map) return;
      var nextX = player.x, nextY = player.y, moved = false;
      if (input.keys['ArrowUp'])    { nextY -= player.speed; moved = true; }
      if (input.keys['ArrowDown'])  { nextY += player.speed; moved = true; }
      if (input.keys['ArrowLeft'])  { nextX -= player.speed; moved = true; }
      if (input.keys['ArrowRight']) { nextX += player.speed; moved = true; }
      if (moved && !window.checkCollision(player, map, nextX, nextY)){
        player.x = nextX; player.y = nextY; saveThrottled();
      }
      var mw = (map.width||1)*(map.tilewidth||32);
      var mh = (map.height||1)*(map.tileheight||32);
      camera.follow(player, mw, mh);
    }

    function draw(drawCtx){
      var c = drawCtx || ctx;
      c.save();
      camera.apply(c);

      if (tilesetLoaded){
        window.drawMap(c, map, { image: tileset, columns: tileset.columns });
      } else {
        c.fillStyle = '#2b2f3a';
        c.fillRect(0, 0, (map && map.width||1)*(map && map.tilewidth||32), (map && map.height||1)*(map && map.tileheight||32));
      }

      c.fillStyle = 'red';
      c.fillRect(player.x - 8, player.y - 8, 16, 16);
      c.restore();
    }

    return {
      init: init,
      update: update,
      draw: draw
    };
  };
})();
