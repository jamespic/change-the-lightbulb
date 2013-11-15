Crafty.scene("Load", function() {
  Crafty.load(
    [
      "assets/p1_sprites.png",
      "assets/round_end.ogg",
      "assets/round_end.mp3",
      "assets/round_end.wav",
      "assets/death.ogg",
      "assets/death.mp3",
      "assets/death.wav",
      "assets/jump_02.ogg",
      "assets/jump_02.mp3",
      "assets/jump_02.wav",
      "assets/coin10.ogg",
      "assets/coin10.mp3",
      "assets/coin10.wav",
    ], function() {
    Crafty.audio.add("death", [
      "assets/death.ogg",
      "assets/death.mp3",
      "assets/death.wav"
    ])
    Crafty.audio.add("win", [
      "assets/round_end.ogg",
      "assets/round_end.mp3",
      "assets/round_end.wav"
    ])
    Crafty.audio.add("jump", [
      "assets/jump_02.ogg",
      "assets/jump_02.mp3",
      "assets/jump_02.wav"
    ])
    Crafty.audio.add("unlock", [
      "assets/coin10.ogg",
      "assets/coin10.mp3",
      "assets/coin10.wav"
    ])
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
    Crafty.scene("Loop")
  })
})

Crafty.scene("MainMenu", function() {
  Crafty.viewport.scroll("_x", 0)
  Crafty.viewport.scroll("_y", 0)
  var e = Crafty
    .e("Text, DOM, 2D")
    .text("Coming Soon: Main Menu")
    .textFont({"size": "50px", "family": "Comic Sans MS"})
    .attr({"x": 200, "y": 200, "w": 600, "h": 400})
})

function followPlayerWithCamera(showCameraPos) {
  var player = Crafty("Player")
  var playerLeader = Crafty.e("LeadingFollower")
    .lead(player)
  var playerFollower
  if (showCameraPos) {
    playerFollower = Crafty.e("SHMFollower, 2D, Canvas, Color")
      .color("pink")
      .attr({"w":16,"h":16})
  } else {
    playerFollower = Crafty.e("SHMFollower")
  }
  playerFollower
    .followSHM(playerLeader)
    .physicsOn()
    .attr({
      "yGravity": 0.0,
      "xGravity": 0.0,
      "vCoeff": -0.2,
      "sCoeff": -0.01,
      })
  Crafty.map.remove(playerFollower)
  var camera = Crafty.e("Camera").follow(playerFollower)
}

function win() {
  localStorage["completed_" + window.currentLevel] = true
  Crafty.scene("MainMenu")
}

function generateTiledScene(sceneName, url, bg) {
  Crafty.scene(sceneName, function() {
    window.currentLevel = sceneName
    //Crafty.e("FPS").attr({maxValues:1}).bind("MessureFPS", function(fps){console.log("FPS: " + fps.value);})
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
generateTiledScene("Loop", "/levels/loop.json", Backgrounds.grassland)
