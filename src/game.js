
Game = {
  // Initialize and start our game
  start: function() {
    Crafty.init(1100, 650);
    var escapeListener = Crafty.e()
    escapeListener.bind("KeyDown", function(e) {
      if (e.key === Crafty.keys.ESC) {
        Crafty.scene("MainMenu")
      }
    })

    Crafty.scene("Load")
  }
}
