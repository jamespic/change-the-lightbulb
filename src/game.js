
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
    
    Crafty.e("CurrentLevelHolder")
    // Work around for Chrome bug 30452 - no ended event for short sounds
    Crafty.audio.setChannels(32)

    Crafty.scene("Load")
  }
}
