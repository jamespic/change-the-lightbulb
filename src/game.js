
Game = {
  // Initialize and start our game
  start: function() {
    // Override ctrl key defaults
    // Start crafty and set a background color so that we can see it's working
    Crafty.init(1100, 650);
    Crafty.background('grey');
    Crafty.viewport.clampToEntities = false
    Crafty.scene("Load")
    
  }
}
