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
    Crafty.scene("MainMenu")
  })
})

function displayMsgWindow(msgs) {
  //Prevent Crafty.viewport getting all antsy about boundaries
  Crafty.e("2D").attr({x: 0, y: 0, w: 1100, h: 650})
  
  Crafty.background("#A3D1FF")
  var e = Crafty
    .e("Text, DOM, 2D")
    .text("Email: Speedy Electrical Contractors")
    .textFont({"size": "50px", "family": "Comic Sans MS"})
    .attr({"x": 50, "y": 50, "w": 950, "h": 400})
  var selectedLevel = null
  function playLevel() {
    if (selectedLevel) {
      Crafty.scene(selectedLevel)
    }
  }

  var msgBox = Crafty.e("2D, Canvas, Mouse, Color")
    .attr({"x": 500, "y": 150, "w": 550, "h": 450})
    .color("white")
    .bind("Click", playLevel)
    
  var msgPane = Crafty.e("HTML")
    .attr({"x": 500, "y": 150, "w": 550, "h": 450})
    
  var clickToStartHint = Crafty
    .e("Text, DOM, 2D")
    .textFont({"size": "12pt", "family": "Comic Sans MS"})
    .attr({"x": 500, "y": 125, "w": 550, "h": 25})
  
  var msgListBg = Crafty.e("2D, DOM, Color")
    .attr({"x": 50, "y": 150, "w": 400, "h": 450})
    .color("white")
  
  var i = 0
  msgs.forEach(function (item) {
    var text = item.title
    if (item.highlighted) text = '<b>' + text + '</b>'
    
    var listBox = Crafty.e("HTML")
      .attr({"x": 50, "y": 150 + i * 25, "w": 400, "h": 25})
      .replace('<div class="email-item">' + text + '</div>')
    
    var clickBox = Crafty.e("2D, Mouse")
      .attr({"x": 50, "y": 150 + i * 25, "w": 400, "h": 25})
      .bind("Click", function() {
        selectedLevel = item.level
        if (selectedLevel) {
          clickToStartHint.text("Click on the message to start the assignment")
        } else {
          clickToStartHint.text("")
          localStorage['read_"' + item.title + '"'] = true
        }
        msgPane.replace(item.body)
      })
      
    i++
  })
}

function generateMessageList() {
  var messages = []
  Levels.forEach(function(level) {
    var show = true
    level.depends.forEach(function(dependency) {
      if (!localStorage["completed_" + dependency])
      show = false
    })
    if (show) {
      var newMsg = {}
      newMsg.title       = level.title
      newMsg.level       = level.level
      newMsg.body        = level.body
      newMsg.highlighted = !(localStorage["completed_" + level.level]
                           || localStorage['read_"' + level.title + '"'])
      messages.push(newMsg)
    }
  })
  return messages
}

Crafty.scene("MainMenu", function() {
  Crafty.viewport.scroll("_x", 0)
  Crafty.viewport.scroll("_y", 0)
  
  displayMsgWindow(generateMessageList())
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
    var escapeListener = Crafty.e()
    escapeListener.bind("KeyDown", function(e) {
      if (e.key === Crafty.keys.ESC) {
        Crafty.scene("MainMenu")
      }
    })
    
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
generateTiledScene("Warehouse", "/levels/warehouse.json", Backgrounds.castle)
generateTiledScene("Loop", "/levels/loop.json", Backgrounds.grassland)
generateTiledScene("Bunker", "/levels/bunker.json", Backgrounds.desert)
generateTiledScene("Chimney", "/levels/chimney.json", Backgrounds.desert)
generateTiledScene("HeathRobinson", "/levels/heathrobinson.json", Backgrounds.castle)

Levels = [
  {
    "title": "Government Bunker",
    "level": "Bunker",
    "body":  "<p>We need you to change a lightbulb at a top-secret government" +
             " bunker. Needless to say, it's all very secretive, and you're" + 
             " not allowed to know what you're doing, where you're going," +
             " or why.</p>" +
             "<p>Anyway, good luck, The Boss</p>",
    "depends": ["HeathRobinson"]
  },
  {
    "title": "National Bank of The North",
    "level": "Loop",
    "body":  "<p>We've won a contract to change the lightbulb in" +
             " the NBN roof garden.</p>" + 
             "<p>The bank have outsourced the job to oompa-loompas," +
              " but they're too short to reach the lightbulbs, so the" +
              " oompa-loompas have subcontracted it to us</p>" + 
              "<p>We're hoping to demonstrate to the bank that they need" +
              " tall people to change lightbulbs, but the CEO is a big" +
              " believer in oompa-loompas. He used them extensively" +
              " in his previous role at a major confectionery brand.</p>" +
              "<p>Make us proud, The Boss</p>",
    "depends": ["HeathRobinson"]
  },
  {
    "title": "Heath and Robinson Boxes",
    "level": "HeathRobinson",
    "body":  "<p>Heath and Robinson need us to change the lightbulb" +
             " in their box factory.</p>" + 
             "<p>The details of how they make their boxes is a closely" +
             " guarded trade secret, so it must be either very clever," +
             " or embarassingly stupid.</p>" +
             "<p>Anyway, get to it, The Boss</p>",
    "depends": ["Chimney"]
  },
  {
    "title": "Southern Power",
    "level": "Chimney",
    "body":  "<p>Southern Power has asked us to change the lightbulb" +
             " in the chimney of their main power station. They keep" +
             " losing chimney sweeps up there, and they're running out" +
             " of orphans.</p>" + 
             "<p>See what you can do, The Boss</p>",
    "depends": ["Warehouse"]
  },
  {
    "title": "Welcome Aboard!",
    "level": "Warehouse",
    "body":  "<p>Welcome to Speedy Electrical Contractors, the world's" +
             " leading supplier of lighbulb replacement services to big" + 
             " businesses and governments.</p>" +
             "<p>We seek out exceptional individuals like yourself," + 
             " to work in this challenging and vibrant industry.</p>" +
             "<p>Since it's your first day, we'll start you off with" +
             " something easy. The lightbulb's gone in our warehouse. Go" +
             " take a look.</p>" +
             "<p>Cheers, The Boss</p>",
    "depends": []
  },
  {
    "title": "Controls - Best Practice",
    "body":  "<p>After a lengthy consultation, we have decided on our new" + 
             " strategic enterprise control system.</p>" +
             "<p>There are two major control systems used in the industry: " + 
             " The older <b>arrow keys</b> layout, and the newer <b>WASD</b> layout." + 
             " Both have their benefits, so we have selected a \"best-of-breed\"" + 
             " approach. We recommend that you move left and right with" +
             " the arrow keys, and jump with the W key.</p>" +
             "<p>Those of you with telekinetic powers should continue to" +
             " use the existing scheme. Hold <b>left mouse button</b> to drag items." +
             " If you need to hold something still, you can hold down" + 
             " the <b>right mouse button</b>, whilst dragging. This will" +
             " hold the dragged item still.</p>" +
             "<p>You can abort your current assignment and return to the" +
             " menu with <b>Esc</b>.</p>" +
             "<p>This new control system will synergise with our existing" +
             " frameworks, allowing us to effect a step change in " +
             " cost-optimisation.</p>" +
             "<p>\"Kind\" regards, The Boss</p>",
    "depends": []
  },
]
