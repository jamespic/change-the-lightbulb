Crafty.c("Platform", {
  "init": function() {
    this.requires("2D")
  }
})

Crafty.c("Wall", {
  "init": function() {
    this.requires("2D")
  }
})

Crafty.c("Ceiling", {
  "init": function() {
    this.requires("2D")
  }
})

Crafty.c("Obstacle", {
  "init": function() {
    this.requires("Platform, Wall, Ceiling")
  }
})

function signum(x) {
  var i = Math.round(x)
  if (i < 0) return -1
  if (i > 0) return 1
  if (i == 0) return 0
}

Crafty.c("Followable", {
  // Abstract class. Must define xPos() and yPos() methods, and emit
  // "FollowMe" events
  "init": function() {
  },
  "distFrom": function(o) {
    var dx = this.xPos() - o.xPos(),
        dy = this.yPos() - o.yPos()
    return Math.sqrt(dx * dx + dy * dy)
  }
})

Crafty.c("LeadingFollower", {
  "_xFactor": 30.0,
  "_yFactor": 15.0,
  "_target": null,
  "_followMeCallback": null,
  "init": function() {
    var self = this
    this.requires("Followable")
    this._followMeCallback = function() {
      self.trigger("FollowMe")
    }
  },
  "lead": function(target) {
    this.unlead()
    this._target = target
    target.bind("FollowMe", this._followMeCallback)
    return this
  },
  "unlead": function() {
    if (this._target !== null) {
      this._target.unbind("FollowMe", this._followMeCallback)
      this._target !== null
    }
    return this
  },
  "xPos": function() {
    return this._target.xPos() + this._xFactor * this._target.xVelocity
  },
  "yPos": function() {
    return this._target.yPos() + this._yFactor * this._target.yVelocity
  },
})

Crafty.c("SHMFollower", {
  "vCoeff": -0.3,
  "sCoeff": -0.1,
  "init": function() {
    this.requires("BasicPhys")
  },
  "followSHM": function(target) {
    this.unbind("EnterFrame", this._shmEnterFrame)
    this._target = target
    this.bind("EnterFrame", this._shmEnterFrame)
    return this
  },
  "unfollowSHM": function() {
    this.unbind("EnterFrame", this._shmEnterFrame)
    this._target = null
    return this
  },
  "_shmEnterFrame": function() {
    this.xAccel += this.vCoeff * this.xVelocity + this.sCoeff * (this.xPos() - this._target.xPos())
    this.yAccel += this.vCoeff * this.yVelocity + this.sCoeff * (this.yPos() - this._target.yPos())
  }
})

Crafty.c("MouseFollower", {
  "_following": false,
  "init": function() {
    var self = this
    
    self.requires("Followable")
    if (self.x === undefined) self.x = 0
    if (self.y === undefined) self.y = 0
    
    self._onMove = function(e) {
      var pos = Crafty.DOM.translate(e.clientX, e.clientY)
      self.x = pos.x
      self.y = pos.y
      self.trigger("FollowMe")
    }
  },
  
  
  
  "followMouse": function() {
    if (!this._following) {
      Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._onMove)
      this._following = true
    }
    return this
  },
  "unfollowMouse": function() {
    if (this._following) {
      Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._onMove)
      this._following = false
    }
    return this
  },
  "xPos": function() {
    return this.x
  },
  "yPos": function() {
    return this.y
  },
})

Crafty.c("Camera", {
  "_target": null,
  "init": function() {
    var self = this
    self._followMeHandler = function() {
      Crafty.viewport.scroll('_x', Crafty.viewport.width / 2 - self._target.xPos());
      Crafty.viewport.scroll('_y', Crafty.viewport.height / 2 - self._target.yPos());
      Crafty.viewport._clamp();
    }
  },
  "follow": function(target) {
    this.unfollow()
    this._target = target
    target.bind("FollowMe", this._followMeHandler)
    return this
  },
  "unfollow": function() {
    if (this._target !== null) {
      this._target.unbind("FollowMe", this._followMeHandler)
      this._target = null
    }
    return this
  },
})

Crafty.c("BasicPhys", {
  "xAccel": 0.0,
  "yAccel": 0.0,
  "xGravity": 0.0,
  "yGravity": 0.8,
  "xVelocity": 0.0,
  "yVelocity": 0.0,

  "init": function() {
    this.requires("Followable")
    if (this.x === undefined) this.x = 0
    if (this.y === undefined) this.y = 0
    if (this.w === undefined) this.w = 0
    if (this.h === undefined) this.h = 0
  },
  
  "physicsOn": function(params) {
    if (params !== undefined) {
      for (var param in params) {
        this[param] = params[param]
      }
    }
    this.unbind("EnterFrame", this._enterFrame)
    this.bind("EnterFrame", this._enterFrame)
    return this
  },
  
  "physicsOff": function() {
    this.unbind("EnterFrame", this._enterFrame)
    return this
  },
  
  "accelerate": function(x, y) {
    this.xAccel += x
    this.yAccel += y
    return this
  },
  
  "_enterFrame": function() {
    var self = this
    self.prevX = self.x
    self.prevY = self.y
    var oldXSignum = signum(self.xVelocity)
    var oldYSignum = signum(self.yVelocity)
    
    self.xVelocity += self.xAccel + self.xGravity
    self.xAccel = 0
    self.yVelocity += self.yAccel + self.yGravity
    self.yAccel = 0
    
    self.x += Math.round(self.xVelocity)
    self.y += Math.ceil(self.yVelocity)
    
    this.trigger("PhysicsCallbacks")
    
    // Trigger NewDirection listener.
    var newXSignum = signum(self.xVelocity)
    var newYSignum = signum(self.yVelocity)
    if ((newXSignum != oldXSignum) || (newYSignum != oldYSignum)) {
      self.trigger("NewDirection",{"x":Math.round(self.xVelocity), "y": Math.round(self.yVelocity)})
    }
    if ((self.prevX !== self.x) || (self.prevY !== self.y)) {
      self.trigger("FollowMe")
    }
  },
  
  "xPos": function() {return this.x + this.w / 2},
  "yPos": function() {return this.y + this.h / 2},
})

Crafty.c("Phys", {
  "groundFriction": 0.1,
  "_falling": true,
  
  "init": function() {
    this.requires("2D, BasicPhys")
    this.bind("PhysicsCallbacks", this._handleCollisions)
  },
  
  "_handleCollisions": function() {
    var self = this
    // Resolve collisions
    var pos = self.pos()
    
    pos.x = pos._x
    pos.y = pos._y
    pos.h = pos._h
    pos.w = pos._w
    
    var q = Crafty.map.search(pos);
    self._falling = true // Falling, unless proven otherwise
    
    var hit = false
    
    q.forEach(function(obj) {
        //check for an intersection directly below the player
        if ((obj !== self) && obj.intersect(pos)) {
            // Stop the player, and position them at the most sensible edge

            if ((self.prevY + self.h <= obj.y) && obj.has("Platform")) {
              // On top
              self.yVelocity = 0
              self.y = obj.y - self.h
              self._falling = false
            } else if ((self.prevX + self.w <= obj.x) && obj.has("Wall")) {
              //On left
              self.xVelocity = 0
              self.x = obj.x - self.w
            } else if ((self.prevX >= obj.x + obj.w) && obj.has("Wall")) {
              // On right
              self.xVelocity = 0
              self.x = obj.x + obj.w
            } else if ((self.prevY >= obj.y + obj.h) && obj.has("Ceiling")) {
              // below
              self.yVelocity = 0
              self.y = obj.y + obj.h
            }
        }
    })
    
    if (!self._falling) {
      self.xAccel -= self.xVelocity * self.groundFriction
    }
    
    if (hit) {
      self.trigger("hit")
    }
  }
})

Crafty.c("Telekinesis", {
  "maxRadius":400,
  "_player": null,
  "_held": false,
  "_tinted": false,
  "tintColour": "00D0FF",
  "tintOpacity": 0.3,
  "init": function() {
    var self = this
    
    self.requires("Phys, SHMFollower, Mouse, Tint")
    
    if (Crafty("MouseFollower").length !== 0) {
      self._mouseFollower = Crafty(Crafty("MouseFollower")[0])
    } else {
      self._mouseFollower = Crafty.e("MouseFollower").followMouse()
    }
    
    self._holdOn = function() {
      self.followSHM(self._mouseFollower)
      Crafty.addEvent(self, Crafty.stage.elem, "mouseup", self._telekinesisMouseUp)
      self._held = true
    }
    
    self._letGo = function() {
      self._held = false
      self.unfollowSHM(self._mouseFollower)
      Crafty.removeEvent(self, Crafty.stage.elem, "mouseup", self._telekinesisMouseUp)
      self.bind("MouseDown",self._telekinesisMouseDown)
    }
    
    self._mouseFollowMeHandler =  function() {
      if (!self._inRange() && self._held) {
        self._letGo()
      }
    }
  },
  
  "startTelekinesis": function(player) {
    this.endTelekinesis()
    this._player = player
    this.bind("MouseDown",this._telekinesisMouseDown)
    this._mouseFollower.bind("FollowMe", this._mouseFollowMeHandler)
    this.bind("PhysicsCallbacks", this._telekinesisPhysicsHandler)
    return this
  },
  
  "endTelekinesis": function() {
    this._letGo()
    this.unbind("PhysicsCallbacks", this._telekinesisPhysicsHandler)
    this._mouseFollower.unbind("FollowMe", this._mouseFollowMeHandler)
    this.unbind("MouseDown",this._telekinesisMouseDown)
    this._player = null
    return this
  },
  "_inRange": function() {
    var dist = this.distFrom(this._player)
    return dist <= this.maxRadius
  },
  "_telekinesisMouseDown": function(e) {
    if (e.mouseButton === Crafty.mouseButtons.LEFT && this._inRange()) {
      this._holdOn()
    }
  },
  "_telekinesisMouseUp": function(e) {
    if (e.mouseButton === Crafty.mouseButtons.LEFT) {
      this._letGo()
    }
  },
  "_telekinesisPhysicsHandler": function(e) {
    if (this._tinted) {
      if (!this._inRange()) {
        this.tint("#ffffff", 0.0)
        this._tinted = false
      }
    } else {
      if (this._inRange()) {
        this.tint(this.tintColour, this.tintOpacity)
        this._tinted = true
      }
    }
  }
})

Crafty.c("Platformer", {
  "speed": 9,
  "jump": 17,
  "acceleration": 3,
  "airAcceleration": 0.4,
  "disableControls": false,
  "_leftKeyDown": false,
  "_rightKeyDown": false,
  "init": function() {
    this.requires("Phys, Keyboard")
  },
  "platformer": function(params) {
    if (params !== undefined) {
      for (var param in params) {
        this[param] = params[param]
      }
    }
    this.unbind("KeyDown", this._keyDown)
    this.unbind("KeyUp", this._keyUp)
    this.unbind("EnterFrame", this._platformerEnterFrame)
    this.bind("KeyDown", this._keyDown)
    this.bind("KeyUp", this._keyUp)
    this.bind("EnterFrame", this._platformerEnterFrame)
    this.physicsOn()
    return this
  },
  "_keyDown": function(e) {
    if ((e.key == Crafty.keys.LEFT_ARROW) || (e.key == Crafty.keys.A)) this._leftKeyDown = true
    if ((e.key == Crafty.keys.RIGHT_ARROW) || (e.key == Crafty.keys.D)) this._rightKeyDown = true
    if ((e.key == Crafty.keys.UP_ARROW) || (e.key == Crafty.keys.W)) {
      if (!this._falling) {
        this.yVelocity -= this.jump
        this._falling = true
        this.trigger("NewDirection",{"x":Math.round(self.xVelocity), "y": Math.round(self.yVelocity)})
      }
    }
  },
  "_keyUp": function(e) {
    if ((e.key == Crafty.keys.LEFT_ARROW) || (e.key == Crafty.keys.A)) this._leftKeyDown = false
    if ((e.key == Crafty.keys.RIGHT_ARROW) || (e.key == Crafty.keys.D)) this._rightKeyDown = false
  },
  "_platformerEnterFrame": function () {
    if (this.disableControls) return
    
    if (this._falling) {
      this._accel = this.airAcceleration
    } else {
      this._accel = this.acceleration
    }
    
    if (this._leftKeyDown && !this._rightKeyDown) this._goLeft()
    else if (this._rightKeyDown && !this._leftKeyDown) this._goRight()
    else this._stopMoving()
  },
  "_goRight": function() {
    if (this.xVelocity < this.speed) {
      this.xAccel += Math.min(this._accel, this.speed - this.xVelocity)
    }
  },
  "_goLeft": function() {
    if (this.xVelocity > (-this.speed)) {
      this.xAccel -= Math.min(this._accel, this.speed + this.xVelocity)
    }
  },
  "_stopMoving": function() {
    if (!this._falling) {
      if (this.xVelocity > 0.0) {
        this.xAccel -= Math.min(this._accel, this.xVelocity)
      } else if (this.xVelocity < 0.0) {
        this.xAccel += Math.min(this._accel, (-this.xVelocity))
      }
    }
  }
    
})

Crafty.c("Player", {
  "init": function() {
    this.requires("2D, Canvas, p1_front_r, SpriteAnimation, Platformer")
    //this.twoway(9, 15)
    this.attr({
      "w": 52, "h": 70
    })
    this.platformer()
    this.animate("WalkLeft", 5, 1, 15)
    this.animate("JumpLeft", 3, 1, 3)
    this.animate("StillLeft", 4, 1, 4)
    this.animate("WalkRight", 5, 0, 15)
    this.animate("JumpRight", 3, 0, 3)
    this.animate("StillRight", 4, 0, 4)
    animation_speed = 10
    this.bind('NewDirection', function(data) {
      if (data.x > 0) {
        this._direction = "r"
        if (this._falling) {
          this.stop()
          this.animate("JumpRight", 1000, -1);
        } else {
          this.stop()
          this.animate('WalkRight', animation_speed, -1);
        }
      } else if (data.x < 0) {
        this._direction = "l"
        if (this._falling) {
          this.stop()
          this.animate("JumpLeft", 0, 0);
        } else {
          this.stop()
          this.animate('WalkLeft', animation_speed, -1);
        }
      } else {
        if (this._direction == "l") {
          if (this._falling) {
            this.stop()
            this.animate("JumpLeft", 0, 0);
          } else {
            this.stop()
            this.animate("StillLeft", animation_speed, -1)
          }
        } else {
          if (this._falling) {
            this.stop()
            this.animate("JumpRight", 0, 0);
          } else {
            this.stop()
            this.animate("StillRight", animation_speed, -1)
          }
        }
      }
    })
  }
})

function followPlayerWithCamera(showCameraPos) {
  var playerId = Crafty("Player")[0]
  var player = Crafty(playerId)
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
      "vCoeff": -0.4,
      "sCoeff": -0.02,
      })
  Crafty.map.remove(playerFollower)
  var camera = Crafty.e("Camera").follow(playerFollower)
}
