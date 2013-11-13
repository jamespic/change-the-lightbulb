Crafty.scene("Load", function() {
  Crafty.load(["assets/p1_sprites.png"], function() {
    Crafty.sprite(52, 70, "assets/p1_sprites.png", {
      "p1_duck_r": [0, 0],
      "p1_front_r": [1, 0],
      "p1_hurt_r": [2, 0],
      "p1_jump_r": [3, 0],
      "p1_stand_r": [4, 0],
      "p1_walk01_r": [5, 0],
      "p1_walk02_r": [6, 0],
      "p1_walk03_r": [7, 0],
      "p1_walk04_r": [8, 0],
      "p1_walk05_r": [9, 0],
      "p1_walk06_r": [10, 0],
      "p1_walk07_r": [11, 0],
      "p1_walk08_r": [12, 0],
      "p1_walk09_r": [13, 0],
      "p1_walk10_r": [14, 0],
      "p1_walk11_r": [15, 0],
    })
    Crafty.scene("Untitled")
  })
})

function generateTiledScene(sceneName, url, bg) {
  Crafty.scene(sceneName, function() {
    var map = Crafty.e("TiledLevel")
    map.tiledLevel(url)
    
    map.bind("TiledLevelLoaded", function () {
      var player = Crafty.e("Player").respawn()
      // Hook up telekinesis
      Crafty("Telekinesis").each(function(i) {
        if (this.has("Telekinesis")) {
          this.physicsOn().startTelekinesis(player)
        }
      })
      followPlayerWithCamera(false)
      Crafty.background(bg)
    })
  })
}

var Backgrounds = {
  "desert":    "#c0e8ec url('assets/bg_desert.png') repeat-x top",
  "grassland": "#c0e8ec url('assets/bg_grasslands.png') repeat-x top",
  "shroom":    "#6da41a url('assets/bg_shroom.png') repeat-x top",
  "castle":    "#869595 url('assets/bg_castle.png')"
}
  

generateTiledScene("Untitled", "/levels/untitled.json", Backgrounds.castle)
