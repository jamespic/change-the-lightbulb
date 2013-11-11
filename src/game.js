
Game = {
  // Initialize and start our game
  start: function() {
    // Start crafty and set a background color so that we can see it's working
    Crafty.modules({"http://localhost:8000/lib/TiledLevelImporter.js": "release"}, function() {
      Crafty.init(1050, 650);
      Crafty.background('grey');
      Crafty.scene("Load")
      window.onresize = function() {Crafty.viewport.reload()}
    })
    
  }
}
