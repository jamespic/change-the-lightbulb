Crafty.scene("Load", function() {
  Crafty.background("#A3D1FF")
  Crafty
    .e("Text, DOM, 2D")
    .text("Loading...")
    .textFont({size: "50px", family: 'Coming Soon'})
    .attr({x: 50, y: 50, w: 950, h: 400})
  
  Crafty.load(
    [
      "14x10.png",
      "15x15.png",
      "50x50.png",
      "93x51.png",
      "bg_castle.png",
      "bg_desert.png",
      "bg_grasslands.png",
      "bg_shroom.png",
      "blocker.png",
      "box.png",
      "castle.png",
      "dirt.png",
      "fish.png",
      "fly.png",
      "grass.png",
      "items.png",
      "lightbulb.png",
      "liquid.png",
      "p1_sprites.png",
      "p2_sprites.png",
      "p3_sprites.png",
      "poker.png",
      "sand.png",
      "shrooms.png",
      "slime.png",
      "snail.png",
      "snow.png",
      "stone.png",
      "round_end.ogg",
      "round_end.mp3",
      "round_end.wav",
      "death.ogg",
      "death.mp3",
      "death.wav",
      "jump_02.ogg",
      "jump_02.mp3",
      "jump_02.wav",
      "jump_10.ogg",
      "jump_10.mp3",
      "jump_10.wav",
      "coin7.ogg",
      "coin7.mp3",
      "coin7.wav",
      "coin10.ogg",
      "coin10.mp3",
      "coin10.wav",
      "music.ogg",
      "music.mp3"
    ], function() {
    Crafty.audio.add("death", [
      "death.ogg",
      "death.mp3",
      "death.wav"
    ])
    Crafty.audio.add("win", [
      "round_end.ogg",
      "round_end.mp3",
      "round_end.wav"
    ])
    Crafty.audio.add("jump", [
      "jump_02.ogg",
      "jump_02.mp3",
      "jump_02.wav"
    ])
    Crafty.audio.add("boing", [
      "jump_10.ogg",
      "jump_10.mp3",
      "jump_10.wav"
    ])
    Crafty.audio.add("unlock", [
      "coin10.ogg",
      "coin10.mp3",
      "coin10.wav"
    ])
    Crafty.audio.add("bribe", [
      "coin7.ogg",
      "coin7.mp3",
      "coin7.wav"
    ])
    Crafty.audio.add("music", [
      "music.ogg",
      "music.mp3"
    ])
    Crafty.sprite(52, 70, "p1_sprites.png", {
      p1_duck_r: [0, 0],
      p1_front_r: [1, 0],
      p1_hurt_r: [2, 0],
      p1_jump_r: [3, 0],
      p1_stand_r: [4, 0],
      p1_walk01_r: [5, 0],
      p1_walk02_r: [6, 0],
      p1_walk03_r: [7, 0],
      p1_walk04_r: [8, 0],
      p1_walk05_r: [9, 0],
      p1_walk06_r: [10, 0],
      p1_walk07_r: [11, 0],
      p1_walk08_r: [12, 0],
      p1_walk09_r: [13, 0],
      p1_walk10_r: [14, 0],
      p1_walk11_r: [15, 0],
    })
    if (localStorage["completed_JobCentre"]) {
      Crafty.scene("MainMenu")
    } else {
      Crafty.scene("JobCentre")
    }
  })
})

function displayMsgWindow(msgs) {
  //Prevent Crafty.viewport getting all antsy about boundaries
  Crafty.e("2D").attr({x: 0, y: 0, w: 1100, h: 650})
  
  Crafty.background("#A3D1FF")
  var e = Crafty
    .e("Text, DOM, 2D")
    .text("Email: Speedy Electrical Contractors")
    .textFont({size: "50px", family: 'Coming Soon'})
    .attr({x: 50, y: 50, w: 950, h: 400})
  var selectedLevel = null
  function playLevel() {
    if (selectedLevel) {
      Crafty.scene(selectedLevel)
    }
  }

  var msgBox = Crafty.e("2D, Canvas, Mouse, Color")
    .attr({x: 450, y: 150, w: 600, h: 450})
    .color("white")
    .bind("Click", playLevel)
    
  var msgPane = Crafty.e("HTML")
    .attr({x: 450, y: 150, w: 600, h: 450})
    
  var clickToStartHint = Crafty
    .e("Text, DOM, 2D")
    .textFont({size: "12pt", family: 'Coming Soon'})
    .attr({x: 450, y: 125, w: 600, h: 25})
  
  var msgListBg = Crafty.e("2D, DOM, Color")
    .attr({x: 50, y: 150, w: 350, h: 450})
    .color("white")
  
  var i = 0
  msgs.forEach(function (item) {
    var text = item.title
    if (item.highlighted) text = '<b>' + text + '</b>'
    
    var listBox = Crafty.e("HTML")
      .attr({x: 50, y: 150 + i * 25, w: 350, h: 25})
      .replace('<div class="email-item">' + text + '</div>')
    
    var clickBox = Crafty.e("2D, Mouse")
      .attr({x: 50, y: 150 + i * 25, w: 350, h: 25})
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
      if (!(localStorage["completed_" + dependency]
          || localStorage['read_"' + dependency + '"']))
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
  displayMsgWindow(generateMessageList())
  Crafty.viewport.scroll({_x: 0, _y: 0})
})

function followPlayerWithCamera(showCameraPos) {
  var player = Crafty("Player")
  var playerLeader = Crafty.e("LeadingFollower")
    .lead(player)
  var playerFollower
  if (showCameraPos) {
    playerFollower = Crafty.e("SHMFollower, 2D, Canvas, Color")
      .color("pink")
      .attr({w:16,h:16})
  } else {
    playerFollower = Crafty.e("SHMFollower")
  }
  playerFollower
    .followSHM(playerLeader)
    .physicsOn()
    .attr({
      yGravity: 0.0,
      xGravity: 0.0,
      vCoeff: -0.2,
      sCoeff: -0.01,
      x: player._x,
      y: player._y
      })
  var bulb = Crafty("Lightbulb")
  Crafty.map.remove(playerFollower)
  var camera = Crafty.e("Camera").follow(playerFollower)
}

function win() {
  localStorage["completed_" + Crafty("CurrentLevelHolder").currentLevel] = true
  Crafty.scene("MainMenu")
}

function generateTiledScene(sceneName, url, bg, disablePanning) {
  Crafty.scene(sceneName,
    function() {
      Crafty("CurrentLevelHolder").currentLevel = sceneName
      
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
        // Hook up blockers
        Crafty("PlayerBlocker").each(function(i) {
          if (this.has("PlayerBlocker")) {
            this.physicsOn().followSHM(player)
          }
        })
        if (!disablePanning) {
          followPlayerWithCamera(false)
        }
        Crafty.background(bg)
    })
  }, function() {
    Crafty("LevelEntity").each(function() {this.destroy()})
  })
}

var Backgrounds = {
  desert:    "#c0e8ec url('bg_desert.png') repeat-x top",
  grassland: "#c0e8ec url('bg_grasslands.png') repeat-x top",
  shroom:    "#6da41a url('bg_shroom.png') repeat-x top",
  castle:    "#869595 url('bg_castle.png')"
}
  

generateTiledScene("Untitled", "untitled.json", Backgrounds.castle)
generateTiledScene("JobCentre", "jobcentre.json", "#98FF69", true)
generateTiledScene("Warehouse", "warehouse.json", Backgrounds.castle)
generateTiledScene("Loop", "loop.json", Backgrounds.grassland)
generateTiledScene("Bunker", "bunker.json", Backgrounds.desert)
generateTiledScene("Chimney", "chimney.json", Backgrounds.desert)
generateTiledScene("HeathRobinson", "heathrobinson.json", Backgrounds.castle)
generateTiledScene("Bribery", "bribery.json", Backgrounds.grassland)
generateTiledScene("Volcano", "volcano.json", Backgrounds.desert)
generateTiledScene("Shrooms", "shrooms.json", Backgrounds.shroom)
generateTiledScene("Tower", "tower.json", Backgrounds.castle)
generateTiledScene("Ski", "ski.json", Backgrounds.grassland)
generateTiledScene("Credits", "credits.json", Backgrounds.grassland)

Levels = [
  {
    title: "Credits",
    body:  "<p>Thanks for playing!</p>" +
           "<p>I hope you've enjoyed playing Change The Lightbulb" +
           " as much as we enjoyed making it. It wouldn't have been possible " +
           " without the support of friends, and other" +
           " open source projects.</p>" +
           "<p>If you enjoyed Change The Lightbulb, why not create some" +
           " levels of your own, or even use it as a starting point for a game" +
           " of your own. The code is all" + 
           ' <a href="https://github.com/jamespic/change-the-lightbulb"' +
           ' target="_blank">' + 
           "on GitHub</a>.</p>" +
           '<p>Anyway, ' +
           '<a href="#" onclick="Crafty.scene(\'Credits\')">' +
           'click here for the credits</a></p>' +
           "<p>Thanks again, James</p>",
    depends: ["Ski", "Shrooms"]
  },
  {
    title: "Swiss Secretive Bank",
    level: "Ski",
    body:  "<p>Good news! We're giving you an opportunity to demonstrate" + 
           " your flexibility. We're sending you abroad at short notice.</p>" +
           "<p>We've got a job from SSB. They've got some very \"influential\"" +
           " clients, so they'll need to run a few background checks " +
           " (just to make sure you're not a cop). They've also got the" +
           " usual data loss prevention stuff - electronic surveilance," +
           " keyloggers, cavity searches, etc.</p>" +
           "<p>Try not to have any fun out there, The Boss</p>",
    depends: ["Volcano"]
  },
  {
    title: "National Bank of The South",
    level: "Tower",
    body:  "<p>NBS heard about our work with" +
           " their arch-rivals NBN. They're keen" +
           " to steal NBN's ideas, so they've asked" +
           " us to come and change a lightbulb for them.</p>" +
           "<p>In the long run, they're looking to simplify their" +
           " lightbulb changing setup, by implementing lots of disconnected" +
           " ideas they stole from their competitors or read about on" + 
           " LinkedIn, and don't really understand.</p>" + 
           "<p>We're facilitating that change process.  And taking their" +
           " money.</p>" +
           "<p>Show them how it's done, The Boss</p>",
    depends: ["Shrooms"]
  },
  {
    title: "Big-Mart Supermarkets",
    level: "Shrooms",
    body:  "<p>We've been asked to change for lightbulb by Big-Mart" +
           " supermarkets. The bulb's at one of their mushroom farms.</p>" +
           "<p>As you'll see, they're big believers in economies of scale," +
           " and vertical integration, so they're slightly embarassed" +
           " to be asking for our help. But, they've created something" +
           " they don't understand themselves, so they've called in" +
           " consultants.</p>" +
           "<p>Discretion, as always, The Boss</p>",
    depends: ["Bunker", "Loop"]
  },
  {
    title: "Happy Friendly Coffee Company",
    level: "Volcano",
    body:  "<p>We've got a job through from the Happy Friendly Coffee" +
           " Company. They need a lightbulb changing at their corporate" +
           " headquarters.</p>" +
           "<p>In the last five years, they've grown to be the largest" +
           " coffee concern in the world, through a series of hostile" +
           " takeovers, and cut-throat business tactics.</p>" +
           "<p>Be on your guard, The Boss</p>",
    depends: ["Bunker", "Loop"]
  },
  {
    title: "Thought you'd like this",
    body:  "<p>Hey, I saw this, and thought you'd appreciate it.</p>" +
           '<a href="http://xkcd.com/664/" target="_blank">' +
           '<img style="width: 600px"' +
           ' src="http://imgs.xkcd.com/comics/academia_vs_business.png"' +
           ' title="Some engineer out there has solved P=NP and it\'s' +
           ' locked up in an electric eggbeater calibration routine.' +
           '  For every 0x5f375a86 we learn about, there are thousands' +
           ' we never see."></a>' +
           "<p>Cheers, Steve</p>",
    depends: ["Bunker", "Loop"]
  },
  {
    title: "Government Bunker",
    level: "Bunker",
    body:  "<p>We need you to change a lightbulb at a top-secret government" +
             " bunker. Needless to say, it's all very secretive, and you're" + 
             " not allowed to know what you're doing, where you're going," +
             " or why.</p>" +
             "<p>Anyway, good luck, The Boss</p>",
    depends: ["HeathRobinson", "Bribery"]
  },
  {
    title: "National Bank of The North",
    level: "Loop",
    body:  "<p>We've won a contract to change the lightbulb in" +
             " the NBN roof garden.</p>" + 
             "<p>The bank have outsourced the job to oompa-loompas," +
              " but they're too short to reach the lightbulbs, so the" +
              " oompa-loompas have subcontracted it to us</p>" + 
              "<p>We're hoping to demonstrate to the bank that they need" +
              " tall people to change lightbulbs, but the CEO is a big" +
              " believer in oompa-loompas. He used them extensively" +
              " in his previous role at a major confectionery brand.</p>" +
              "<p>Make us proud, The Boss</p>",
    depends: ["HeathRobinson", "Bribery"]
  },
  {
    title: "Change Your Password",
    body:  "<p>It's time to change your password. Your new password must contain:</p>" +
           "<ul>" +
             "<li>at least 8 characters</li>" +
             "<li>at most 9 characters</li>" +
             "<li>at least 2 numbers</li>" +
             "<li>at least 2 punctuation characters</li>" +
             "<li>at least 1 uppercase character</li>" +
             "<li>at least 1 lowercase character</li>" +
             "<li>at least 2 hebrew characters</li>" +
             "<li>the BEL character (^G)</li>" +
             "<li>at least 2 non-BMP unicode characters</li>" +
           "</ul>" +
           "<p>You will be required to change your password again tomorrow.</p>",
    depends: ["HeathRobinson"]
  },
  {
    title: "Heath and Robinson Boxes",
    level: "HeathRobinson",
    body:  "<p>Heath and Robinson need us to change the lightbulb" +
             " in their box factory.</p>" + 
             "<p>The details of how they make their boxes is a closely" +
             " guarded trade secret, so it must be either very clever," +
             " or embarassingly stupid.</p>" +
             "<p>Anyway, get to it, The Boss</p>",
    depends: ["Chimney"]
  },
  {
    title: "Bribery Training",
    level: "Bribery",
    body:  "<p>We'll be working with some clients in the financial sector," +
           " so we need to put you through the company's mandatory" + 
           " bribery training. It's important to that we don't get caught" + 
           " giving out bribes.</p>" +
           "<p>Knock yourself out, The Boss</p>",
    depends: ["Chimney"]
  },
  {
    title: "Controls - Best Practice ",
    body:  "<p>After a lengthy consultation, we have decided on our new" + 
             " strategic enterprise control system.</p>" +
             "<p>There are two major control systems used in the industry: " + 
             " The older <b>arrow keys</b> layout, and the newer <b>WASD</b> layout." + 
             " Both have their benefits, so we have selected a \"best-of-breed\"" + 
             " approach. We recommend that you move left and right with" +
             " the arrow keys, jump with the W key, and use the down arrow to climb down from ledges.</p>" +
             "<p>Those of you with telekinetic powers should continue to" +
             " use the existing scheme. Hold <b>left mouse button</b> to levitate items." +
             " If you need to keep something still, you can hold down" + 
             " <b>Shift</b> while levitating. This will" +
             " keep the levitated item still.</p>" +
             "<p>You can abort your current assignment and return to the" +
             " menu with <b>Esc</b>.</p>" +
             "<p>This new control system will synergise with our existing" +
             " frameworks, allowing us to effect a step change in " +
             " cost-optimisation.</p>" +
             "<p>\"Kind\" regards, The Boss</p>",
    depends: ["Chimney"]
  },
  {
    title: "Southern Power",
    level: "Chimney",
    body:  "<p>Southern Power has asked us to change the lightbulb" +
             " in the chimney of their main power station. They keep" +
             " losing chimney sweeps up there, and they're running out" +
             " of orphans.</p>" + 
             "<p>See what you can do, The Boss</p>",
    depends: ["Warehouse"]
  },
  {
    title: "Welcome Aboard!",
    level: "Warehouse",
    body:  "<p>Welcome to Speedy Electrical Contractors, the world's" +
             " leading supplier of lightbulb replacement services to big" + 
             " businesses and governments.</p>" +
             "<p>We seek out exceptional individuals like yourself," + 
             " to work in this vibrant industry. " +
             " With our clients, you'll never be short of challenges.</p>" +
             "<p>Since it's your first day, we'll start you off with" +
             " something easy. The lightbulb's gone in our warehouse. Go" +
             " take a look.</p>" +
             "<p>Cheers, The Boss</p>",
    depends: []
  },
  {
    title: "Updated Controls",
    body:  "<p>Greetings Brave Play-tester!</p>" +
           "<p>I've made a change to " +
           " the controls. You now hold levitated items still with" +
           " <b>Shift</b>, rather than <b>Right Mouse Button</b>. Also," +
           " the item keeps levitating as long as you've got either" +
           " Shift or the left mouse button held down.</p>" +
           "<p>If you've never seen the old controls screen, you shouldn't" +
           " be able to read this message.</p>" +
           "<p>Thanks again for all the help with play-testing</p>" +
           "<p>James</p>",
    depends: ["Controls - Best Practice"]
  },
  {
    title: "Email Recovery - Job Seeker's Allowance",
    level: "JobCentre",
    body:  "<p>Our automated email recovery has recovered an old email:</p>" +
           "<blockquote><p>Under new regulations, we are required to refer" +
           " to all unemployed persons as \"scroungers\". Scroungers" +
           " must report to the Job Centre, and remain there" +
           " until they secure work.</p> <p>Please report you your nearest" +
           " job centre</p></blockquote>",
    depends: ["Credits"]
  },
  
]
