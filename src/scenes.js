var box
var box2
var player
var mouseFollower
Crafty.scene("Game", function() {
  Crafty.e("2D,DOM,Text")
    .attr({maxValues:10})
  Crafty.e("2D, Canvas, Color, Platform")
    .attr({
      "x": 0,
      "y": 630,
      "h": 70,
      "w": 1050
    })
    .color("blue")
  Crafty.e("2D, Canvas, Color, Platform")
    .attr({
      "x": 630,
      "y": 420,
      "h": 70,
      "w": 140
    })
    .color("blue")
  Crafty.e("2D, Canvas, Color, Obstacle")
    .attr({
      "x": 0,
      "y": 0,
      "w": 16,
      "h": 700
    })
    .color("black")
  player = Crafty.e("Player")
    .attr({"x": 320, "y": 100})
  box = Crafty.e("2D, Canvas, Color, Telekinesis, Platform")
    .attr({"x": 70, "y": 0, "w": 70, "h":70})
    .color("green")
    .physicsOn()
    .startTelekinesis(player)
  box2 = Crafty.e("2D, Canvas, Color, Telekinesis, Platform")
    .attr({"x": 210, "y": 0, "w": 70, "h":70})
    .color("green")
    .physicsOn()
    .startTelekinesis(player)
  Crafty.e("2D,DOM,FPS,Text")
    .attr({maxValues:10, x: 100})
    .bind("MessureFPS", function(fps){
      this.text("FPS: "+fps.value); //Display Current FPS
      //console.log(this.values); // Display last x Values
    })
  followPlayerWithCamera(false)
})

Crafty.scene("Untitled", function() {
  var map = Crafty.e("TiledLevel")
  map.tiledLevel("/levels/untitled.json")
  map.bind("TiledLevelLoaded", function () {
    player = Crafty.e("Player")
      .attr({"x": 300, "y": 100})
    var telekinetics = Crafty("Telekinesis")
    telekinetics.each(function(i) {
      var o = Crafty(telekinetics[i])
      if (o.has("Telekinesis")) {
        o.physicsOn().startTelekinesis(player)
      }
    })
    Crafty.e("2D,DOM,FPS,Text")
      .attr({maxValues:10, x: 100})
      .bind("MessureFPS", function(fps){
        this.text("FPS: "+fps.value); //Display Current FPS
        //console.log(this.values); // Display last x Values
      })
    followPlayerWithCamera(false)
  })
  
})

Crafty.scene("Load", function() {
  Crafty.load(["assets/p1_sprites.png"], function() {
    Crafty.sprite(52, 70, "assets/p1_sprites.png", {
      "p1_duck_l": [0, 0],
      "p1_duck_r": [0, 1],
      "p1_front_l": [1, 0],
      "p1_front_r": [1, 1],
      "p1_hurt_l": [2, 0],
      "p1_hurt_r": [2, 1],
      "p1_jump_l": [3, 0],
      "p1_jump_r": [3, 1],
      "p1_stand_l": [4, 0],
      "p1_stand_r": [4, 1],
      "p1_walk01_l": [5, 0],
      "p1_walk01_r": [5, 1],
      "p1_walk02_l": [6, 0],
      "p1_walk02_r": [6, 1],
      "p1_walk03_l": [7, 0],
      "p1_walk03_r": [7, 1],
      "p1_walk04_l": [8, 0],
      "p1_walk04_r": [8, 1],
      "p1_walk05_l": [9, 0],
      "p1_walk05_r": [9, 1],
      "p1_walk06_l": [10, 0],
      "p1_walk06_r": [10, 1],
      "p1_walk07_l": [11, 0],
      "p1_walk07_r": [11, 1],
      "p1_walk08_l": [12, 0],
      "p1_walk08_r": [12, 1],
      "p1_walk09_l": [13, 0],
      "p1_walk09_r": [13, 1],
      "p1_walk10_l": [14, 0],
      "p1_walk10_r": [14, 1],
      "p1_walk11_l": [15, 0],
      "p1_walk11_r": [15, 1],
    })
    Crafty.scene("Untitled")
  })
})
