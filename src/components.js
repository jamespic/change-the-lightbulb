/**
 * Class to allow objects to have non-standard bounding boxes
 */
Crafty.c("AABB", {
  "_aabbInitialised": false,
  "init": function() {
    this.requires("2D")
    this._l || (this._l = 0)
    this._r || (this._r = this._w)
    this._t || (this._t = 0)
    this._b || (this._b = this._h)
    this.bind("Move", this._aabbMove)
  },
  "aabb": function(aabb) {
    this._l = aabb._l || aabb.l
    this._r = aabb._r || aabb.r
    this._t = aabb._t || aabb.t
    this._b = aabb._b || aabb.b
    this._aabbInitialised = true
  },
  "intersects": function(o) {
    return (
      (this._x + this._l < o._x + o._r)
      && (o._x + o._l < this._x + this._r)
      && (this._y + this._t < o._y + o._b)
      && (o._y + o._t < this._y + this._b)
    )
  },
  "_aabbMove": function (old) {
    if (!this._aabbInitialised) {
      this._r = this._w
      this._b = this._h
    }
  }
})

Crafty.c("HandlesCollisions", {
  "init": function() {
    this.requires("AABB")
    this.bind("PhysicsCollision", this._genericHandleCollision)
  },
  "_genericHandleCollision": function(c) {
    // WARNING: This assumes the hitbox for the object matches its 2D co-ords
    if (this.obstructFromAbove && (c.prevY + c._b <= this._y + this._t)) {
      // On top
      c.y = this._y + this._t - c._b
      if (c.yVelocity > 0) c.yVelocity = 0
      c._falling = false
    } else if (this.obstructFromSides && (c.prevX + c._r <= this._x + this._l)) {
      //On left
      if (c.xVelocity > 0) c.xVelocity = 0
      c.x = this._x + this._l - c._r
    } else if (this.obstructFromSides && (c.prevX + c._l >= this._x + this._r)) {
      // On right
      if (c.xVelocity < 0) c.xVelocity = 0
      c.x = this._x + this._r - c._l
    } else if (this.obstructFromBelow && (c.prevY + c._t >= this._y + this._b)) {
      // below
      if (c.yVelocity < 0) c.yVelocity = 0
      c.y = this._y + this._b - c._t
    }
  }
})

Crafty.c("ForwardSlope", {
  "init": function() {
    this.requires("HandlesCollisions")
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._forwardSlopeCollision)
  },
  "_forwardSlopeCollision": function(c) {
    var cX = c._x + c._r
    var cY = c._y + c._b
    var intersectPoint = this._y + this._h - (cX - this._x)
    if ((cX <= this._x + this._w) && (cX >= this._x) && (cY > intersectPoint)) {
      c._y = intersectPoint - c._b
      c._falling = false
      if (c.xVelocity + c.yVelocity > 0) {
        // Project velocity
        c.xVelocity = (c.xVelocity - c.yVelocity) / 2
        c.yVelocity = -(c.xVelocity)
      }
    }
      
  }
})

Crafty.c("BackwardSlope", {
  "init": function() {
    this.requires("HandlesCollisions")
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._backwardSlopeCollision)
  },
  "_backwardSlopeCollision": function(c) {
    var cX = c._x + c._l
    var cY = c._y + c._b
    var intersectPoint = this._y +  (cX - this._x)
    if ((cX <= this._x + this._w) && (cX >= this._x) && (cY > intersectPoint)) {
      c._y = intersectPoint - c._b
      c._falling = false
      if (c.yVelocity - c.xVelocity > 0) {
        // Project velocity
        c.xVelocity = (c.xVelocity + c.yVelocity) / 2
        c.yVelocity = c.xVelocity
      }
    }
      
  }
})

Crafty.c("Platform", {
  "obstructFromAbove": true,
  "init": function() {
    this.requires("HandlesCollisions")
  }
})

Crafty.c("Wall", {
  "obstructFromBelow": true,
  "obstructFromSides": true,
  "init": function() {
    this.requires("HandlesCollisions")
  }
})

Crafty.c("Obstacle", {
  "init": function() {
    this.requires("Wall, Platform")
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
  "_paused": false,
  "pausable": false,
  "_absX":0,
  "_absY":0,
  "init": function() {
    var self = this
    
    self.requires("Followable")
    if (self.x === undefined) self.x = 0
    if (self.y === undefined) self.y = 0
    
    self._followerOnMove = function(e) {
      self._absX = e.clientX
      self._absY = e.clientY
      self._updatePos()
    }
    
    self._followerOnMouseDown = function(e) {
      if (self.pausable && (e.mouseButton === Crafty.mouseButtons.RIGHT)) {
        self._paused = true
      }
    }
    
    self._followerOnMouseUp = function(e) {
      if (self.pausable && (e.mouseButton === Crafty.mouseButtons.RIGHT)) {
        self._paused = false
        self._updatePos()
      }
    }
    
    self._followerOnPan = function() {
      self._updatePos()
    }
  },
  
  "followMouse": function(pausable) {
    if (pausable !== undefined) {
      this.pausable = pausable
    }
    if (!this._following) {
      Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._followerOnMove)
      Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._followerOnMouseUp)
      Crafty.addEvent(this, Crafty.stage.elem, "mousedown", this._followerOnMouseDown)
      Crafty.bind("ViewportPanned", this._followerOnPan)
      this._following = true
    }
    return this
  },
  "unfollowMouse": function() {
    if (this._following) {
      this._following = false
      Crafty.unbind("ViewportPanned", this._followerOnPan)
      Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", this._followerOnMouseDown)
      Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._followerOnMouseUp)
      Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._followerOnMove)
    }
    return this
  },
  "xPos": function() {
    return this.x
  },
  "yPos": function() {
    return this.y
  },
  "_updatePos": function() {
    if (!this._paused) {
      var pos = Crafty.DOM.translate(this._absX, this._absY)
      this.x = pos.x
      this.y = pos.y
      this.trigger("FollowMe")
    }
  }
})

Crafty.c("Camera", {
  "_target": null,
  "init": function() {
    var self = this
    self._followMeHandler = function() {
      // Get bounds
      var bound = Crafty.map.boundaries()
      
      var leftBound = bound.min.x
      var rightBound = bound.max.x - Crafty.viewport.width
      var topBound = bound.min.y
      var bottomBound = bound.max.y - Crafty.viewport.height
      
      //Clamp
      var newXPos = Math.floor(Crafty.viewport.width / 2 - self._target.xPos())
      if (newXPos < -rightBound) newXPos = -rightBound
      if (newXPos > -leftBound) newXPos = -leftBound
      
      var newYPos = Math.floor(Crafty.viewport.height / 2 - self._target.yPos())
      if (newYPos < -bottomBound) newYPos = -bottomBound
      if (newYPos > -topBound) newYPos = -topBound

      var panned = false
      if (newXPos !== Crafty.viewport._x) {
        Crafty.viewport.scroll('_x', newXPos);
        panned = true
      }
      if (newYPos !== Crafty.viewport._y) {
        Crafty.viewport.scroll('_y', newYPos);
        panned = true
      }
      if (panned) Crafty.trigger("ViewportPanned");
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
    
    // Limit velocity to 50 in any direction, to avoid clipping issues
    if (self.xVelocity < -50.0) self.xVelocity = -50.0
    if (self.xVelocity > 50.0) self.xVelocity = 50.0
    if (self.yVelocity < -50.0) self.yVelocity = -50.0
    if (self.yVelocity > 50.0) self.yVelocity = 50.0
    
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
    this.requires("2D, BasicPhys, AABB")
    this.bind("PhysicsCallbacks", this._handleCollisions)
  },
  
  "_handleCollisions": function() {
    var self = this
    // Resolve collisions
    
    var q = Crafty.map.search(self, false);
    self._falling = true // Falling, unless proven otherwise
    
    if (q) q.forEach(function(o) {
      if ((o !== self) && o.has("HandlesCollisions") && o.intersects(self)) {
        /*
         * Both sides get an event - so far I'm only using PhysicsCollision,
         * but I can imagine cases where we'd want the behaviour to be on
         * the part of the moving object - maybe.
         */
        o.trigger("PhysicsCollision", self)
      }
    })
    
    if (!self._falling) {
      self.xAccel -= self.xVelocity * self.groundFriction
    }
  }
})

Crafty.c("Telekinesis", {
  "maxRadius":400,
  "_player": null,
  "_held": false,
  "_tinted": false,
  "tintColour": "00D0FF",
  "tintOpacity": 0.15,
  "init": function() {
    var self = this
    
    self.requires("Phys, SHMFollower, Mouse, Tint")
    
    if (Crafty("MouseFollower").length !== 0) {
      self._mouseFollower = Crafty(Crafty("MouseFollower")[0])
    } else {
      self._mouseFollower = Crafty.e("MouseFollower").followMouse(true)
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

Crafty.c("TelekinesisBlocker", {
  "init": function() {
    this.requires("HandlesCollisions")
    this.obstructFromAbove = true
    this.obstructFromSides = true
    this.obstructFromBelow = true
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._restrictedHandleCollision)
  },
  "_restrictedHandleCollision": function(o) {
    if (o.has("Telekinesis")) {
      this._genericHandleCollision(o)
    }
  }
})



Crafty.c("Platformer", {
  "speed": 9,
  "jump": 17.5,
  "acceleration": 3,
  "airAcceleration": 0.7,
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
      this._tryJump()
    }
  },
  "_tryJump": function() {
    if (!this._falling) {
      this.yVelocity = -(this.jump)
      this._falling = true
      this.trigger("NewDirection",{"x":Math.round(self.xVelocity), "y": Math.round(self.yVelocity)})
      this.trigger("Jump")
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

Crafty.c("Checkpoint", {
  "init": function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._checkpointCollision)
  },
  "_checkpointCollision": function(o) {
    if (o.has("Player")) {
      o.lastCheckpoint = this
    }
  }
})

Crafty.c("Scriptable", {
  "_scriptTriggered": false,
  "init": function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._scriptableCollision)
  },
  "_scriptableCollision": function(o) {
    if (o.has("Player") && !this._scriptTriggered) {
      this._scriptTriggered = true
      var callback = Callbacks[this.callback]
      callback.call(this, o)
    }
  }
})

Crafty.c("Talker", {
  "message": "This character currently has no message...",
  "_msgEntity": null,
  "msgWidth": "100",
  "msgHeight": "100",
  "msgBg": "#FFE0EE",
  "msgFont": "Comic Sans MS",
  "init": function() {
    this.requires("2D")
    this.bind("EnterFrame", this._talkerEnterFrame)
  },
  "_talkerEnterFrame": function() {
    if (Crafty("Player").intersect(this)) {
      if (this._msgEntity === null) {
        var e = Crafty.e("HTML")
        this._msgEntity = e
        var msgWidth = parseInt(this.msgWidth)
        var msgHeight = parseInt(this.msgHeight)
        e.x = Math.round(this.x + this.w / 2) - msgWidth / 2 - 25
        e.y = this.y - msgHeight - 100
        e.w = msgWidth
        e.h = msgHeight
        e.replace(
          '<div style="text-align: center; background: ' + this.msgBg +
            '; font-family: ' + this.msgFont + '; width: 100%; height: 100%;' +
            'border-radius: 15px; padding: 25px">' + this.message + '</div>')
      }
    } else {
      if (this._msgEntity !== null) {
        this._msgEntity.destroy()
        this._msgEntity = null
      }
    }
  }
})

Crafty.c("Player", {
  "lastCheckpoint": null,
  "init": function() {
    this.requires("2D, Canvas, p1_front_r, SpriteAnimation, Platformer")
    this.attr({
      "w": 52, "h": 70
    })
    this.aabb({"l": 6, "r": 46, "t": 6, "b": 70})
    this.platformer()
    this.animate("WalkRight", 5, 0, 15)
    this.animate("JumpRight", 3, 0, 3)
    this.animate("StillRight", 4, 0, 4)
    animation_speed = 10
    this.bind('NewDirection', function(data) {
      this.stop()
      if (this._falling) {
        this.animate("JumpRight", 1000, -1);
      } else if (Math.abs(data.x) > 1.0) {
        this.animate('WalkRight', animation_speed, -1);
      } else {
        this.animate("StillRight", animation_speed, -1)
      }
      if (data.x > 0) {
        this._direction = "r"
        this.unflip("X")
      } else if (data.x < 0) {
        this._direction = "l"
        this.flip("X")
      }
    })
    
    this.bind("Jump", function() {Crafty.audio.play("jump", 1, 0.6)})
  }, 
  "respawn": function() {
    var spawnPoint = this.lastCheckpoint || Crafty("PlayerSpawn")
    this.attr(
      {
      "x": spawnPoint.x + spawnPoint.w / 2 - this._w,
      "y": spawnPoint.y + spawnPoint.h / 2 - this._h,
      "xVelocity": 0.0,
      "yVelocity": 0.0
      }
    )
    return this
  },
  "die": function() {
    Crafty.audio.play("death", 1, 0.5)
    // Will improve later
    this.respawn()
  }
})

Crafty.c("Lightbulb", {
  "_winning": false,
  "init": function() {
    this.requires("2D, HandlesCollisions, Sprite, Tween")
    this.bind("PhysicsCollision", this._lightbulbCollision)
  },
  "_lightbulbCollision": function(o) {
    if (!this._winning && o.has("Player")) {
      this._winning = true
      this.sprite(1, 0, 1, 1)
      Crafty.audio.play("win", 1, 0.3)
      this.tween({
        "x": this.x - 100,
        "w": 250,
        "h": 250,
        "alpha":0}, 100)
      this.bind("TweenEnd", function() {
        win()
      })
    }
  }
})

Crafty.c("LockedDoor", {
  "obstructFromAbove": true,
  "obstructFromBelow": true,
  "obstructFromSides": true,
  "_disappearing": false,
  "init": function() {
    this.requires("2D, HandlesCollisions, Tween")
    this.bind("PhysicsCollision", this._doorCollisionHandler)
  },
  "doorColour": function(colour) {
    this.colour = colour
    return this
  },
  "_doorCollisionHandler": function(obj) {
    if (obj.has("DoorKey") && (obj.colour === this.colour)) {
      this._disappear()
    }
  },
  "_disappear": function() {
    if (!this._disappearing) {
      Crafty.audio.play("unlock", 1)
      this._disappearing = true
      this.obstructFromAbove = false
      this.obstructFromBelow = false
      this.obstructFromSides = false
      this.tween({"alpha": 0.0}, 50)
      this.bind("TweenEnd", function(props) {
        this.destroy()
      })
    }
  }
})

Crafty.c("DoorKey", {
  "init": function() {
    this.requires("Telekinesis")
  },
  "keyColour": function(colour) {
    this.colour = colour
    return true
  }
})

var buttonPressedSprites = {
  "Red": [0, 1],
  "Green": [6, 0],
  "Blue": [4, 0],
  "Yellow": [2, 1]
}

Crafty.c("Button", {
  "_pressed": false,
  "init": function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._buttonPress)
  },
  "buttonColour": function(colour) {
    this.colour = colour
  },
  "_buttonPress": function() {
    if (!this._pressed) {
      Crafty(this.colour + "Door").each(function () {
        this._disappear()
      })
      var spr = buttonPressedSprites[this.colour]
      this.sprite(spr[0], spr[1], 1, 1)
      this._pressed = true
    }
  }
})

Crafty.c("Deadly", {
  "init": function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._deadlyCollision)
  },
  "_deadlyCollision": function(obj) {
    if (obj.has("Player")
        && (obj.prevY + obj._b > this._y + this._t)) { // Only die on the second frame - allows you to stand on the water's edge
      obj.die()
    }
  }
})

Crafty.c("Liquid", {
  "init": function() {
    this.requires("Deadly")
  }
})

Crafty.c("HalfHeight", {
  "init": function() {
    this.requires("AABB")
    this.aabb({"l": 0, "r": 50, "t": 25, "b": 50})
  }
})

var colours = ["Red", "Green", "Blue", "Yellow"]
colours.forEach(function(colour) {
  Crafty.c(colour + "Door", {
    "init": function() {
      this.requires("LockedDoor")
      this.doorColour(colour)
    }
  })
  
  Crafty.c(colour + "Key", {
    "init": function() {
      this.requires("DoorKey")
      this.keyColour(colour)
    }
  })
  
  Crafty.c(colour + "Button", {
    "init": function() {
      this.requires("Button")
      this.buttonColour(colour)
    }
  })
})
