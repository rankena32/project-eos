(function(){
  function Camera(width, height) {
    this.width = width; this.height = height;
    this.x = 0; this.y = 0;
  }
  Camera.prototype.follow = function(target, mapWidth, mapHeight){
    this.x = target.x - this.width/2;
    this.y = target.y - this.height/2;
    this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));
  };
  Camera.prototype.apply = function(ctx){
    ctx.translate(-this.x, -this.y);
  };
  window.Camera = Camera;
})();
