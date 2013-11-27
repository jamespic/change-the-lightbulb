/**
 * Class to allow objects to have non-standard bounding boxes
 */
Crafty.c("AABB", {
  _aabbInitialised: false,
  init: function() {
    this.requires("LevelEntity, 2D")
    this._l || (this._l = 0)
    this._r || (this._r = this._w)
    this._t || (this._t = 0)
    this._b || (this._b = this._h)
    this.bind("Resize", this._aabbResize)
  },
  aabb: function(aabb) {
    this._l = aabb._l || aabb.l
    this._r = aabb._r || aabb.r
    this._t = aabb._t || aabb.t
    this._b = aabb._b || aabb.b
    this._aabbInitialised = true
  },
  intersects: function(o) {
    return (
      (this._x + this._l < o._x + o._r)
      && (o._x + o._l < this._x + this._r)
      && (this._y + this._t < o._y + o._b)
      && (o._y + o._t < this._y + this._b)
    )
  },
  _aabbResize: function (old) {
    if (!this._aabbInitialised) {
      this._r = this._w
      this._b = this._h
    }
  }
})

Crafty.c("HandlesCollisions", {
  init: function() {
    this.requires("AABB")
    this.bind("PhysicsCollision", this._genericHandleCollision)
  },
  _genericHandleCollision: function(c) {
    // WARNING: This assumes the hitbox for the object matches its 2D co-ords
    if (this.obstructFromAbove && (c.prevY + c._b <= this._y + this._t)) {
      // Special case to allow you to drag boxes back through platforms
      if (!this.obstructFromBelow && c._dropThrough) return
      // On top
      c.y = this._y + this._t - c._b
      c.yVelocity = 0
      c._falling = false
    } else if (this.obstructFromSides && (c.prevX + c._r <= this._x + this._l)) {
      //On left
      c.xVelocity = 0
      c.x = this._x + this._l - c._r
    } else if (this.obstructFromSides && (c.prevX + c._l >= this._x + this._r)) {
      // On right
      c.xVelocity = 0
      c.x = this._x + this._r - c._l
    } else if (this.obstructFromBelow && (c.prevY + c._t >= this._y + this._b)) {
      // below
      c.yVelocity = 0
      c.y = this._y + this._b - c._t
    }
  }
})

Crafty.c("ForwardSlope", {
  init: function() {
    this.requires("HandlesCollisions")
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._forwardSlopeCollision)
  },
  _forwardSlopeCollision: function(c) {
    var cX = c._x + c._r
    var cY = c._y + c._b
    var intersectPoint = this._y + this._h - (cX - this._x)
    
    var prevCX = c.prevX + c._r
    var prevCY = c.prevY + c._b
    var prevIP = this._y + this._h - (prevCX - this._x)
    
    if ((prevCX <= this._x) && (prevCY > prevIP)) {
      c.xVelocity = 0
      c.x = this._x - c._r
    } else if ((cX <= this._x + this._w) && (cX >= this._x) && (cY > intersectPoint)) {
      c.y = intersectPoint - c._b
      c._falling = false
      if (c.xVelocity + c.yVelocity > 0) {
        if (c._platformer) {
          //Special case player, to avoid jumps at ridges
          c.yVelocity = Math.max(0, -c.xVelocity)
        } else {
          //Project velocity
          c.xVelocity = (c.xVelocity - c.yVelocity) / 2
          c.yVelocity = -(c.xVelocity)
        }
      }
    } else if (cX > this._x + this._w) {
      c.y = this._y + this._t - c._b
      if (c.yVelocity > 0) c.yVelocity = 0
      c._falling = false
    }
      
  }
})

Crafty.c("BackwardSlope", {
  init: function() {
    this.requires("HandlesCollisions")
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._backwardSlopeCollision)
  },
  _backwardSlopeCollision: function(c) {
    var cX = c._x + c._l
    var cY = c._y + c._b
    var intersectPoint = this._y +  (cX - this._x)
    
    var prevCX = c.prevX + c._l
    var prevCY = c.prevY + c._b
    var prevIP = this._y +  (prevCX - this._x)
    
    if ((prevCX >= this._x + this._w) && (prevCY > prevIP)) {
      c.xVelocity = 0
      c.x = this._x + this._w - c._l
    } else if ((cX <= this._x + this._w) && (cX >= this._x) && (cY > intersectPoint)) {
      c.y = intersectPoint - c._b
      c._falling = false
      if (c.yVelocity - c.xVelocity > 0) {
        if (c._platformer) {
          //Special case player, to avoid jumps at ledges
          c.yVelocity = Math.max(0, c.xVelocity)
        } else {
          // Project velocity
          c.xVelocity = (c.xVelocity + c.yVelocity) / 2
          c.yVelocity = c.xVelocity
        }
      }
    } else if (cX < this._x) {
      c.y = this._y + this._t - c._b
      if (c.yVelocity > 0) c.yVelocity = 0
      c._falling = false
    }
      
  }
})

Crafty.c("Platform", {
  obstructFromAbove: true,
  init: function() {
    this.requires("HandlesCollisions")
  }
})

Crafty.c("Wall", {
  obstructFromBelow: true,
  obstructFromSides: true,
  init: function() {
    this.requires("HandlesCollisions")
  }
})

Crafty.c("Obstacle", {
  init: function() {
    this.requires("Wall, Platform")
  }
})

var signumPadding = 1.0
function floatSignum(x) {
  if (x < -signumPadding) return -1
  if (x > signumPadding) return 1
  else return 0
}

Crafty.c("Followable", {
  // Abstract class. Must define xPos() and yPos() methods, and emit
  // "FollowMe" events
  init: function() {
    this.requires("LevelEntity")
  },
  distFrom: function(o) {
    var dx = this.xPos() - o.xPos(),
        dy = this.yPos() - o.yPos()
    return Math.sqrt(dx * dx + dy * dy)
  }
})

Crafty.c("LeadingFollower", {
  _xFactor: 30.0,
  _yFactor: 15.0,
  _target: null,
  _followMeCallback: null,
  init: function() {
    var self = this
    this.requires("Followable")
    this._followMeCallback = function() {
      self.trigger("FollowMe")
    }
  },
  lead: function(target) {
    this.unlead()
    this._target = target
    target.bind("FollowMe", this._followMeCallback)
    return this
  },
  unlead: function() {
    if (this._target !== null) {
      this._target.unbind("FollowMe", this._followMeCallback)
      this._target !== null
    }
    return this
  },
  xPos: function() {
    return this._target.xPos() + this._xFactor * this._target.xVelocity
  },
  yPos: function() {
    return this._target.yPos() + this._yFactor * this._target.yVelocity
  },
})

Crafty.c("SHMFollower", {
  vCoeff: -0.3,
  sCoeff: -0.1,
  xFollow: true,
  yFollow: true,
  init: function() {
    this.requires("BasicPhys")
  },
  followSHM: function(target) {
    this.unbind("EnterFrame", this._shmEnterFrame)
    this._target = target
    this.bind("EnterFrame", this._shmEnterFrame)
    return this
  },
  unfollowSHM: function() {
    this.unbind("EnterFrame", this._shmEnterFrame)
    this._target = null
    return this
  },
  _shmEnterFrame: function() {
    if (this.xFollow) {
      this.xAccel += this.vCoeff * this.xVelocity + this.sCoeff * (this.xPos() - this._target.xPos())
    }
    if (this.yFollow) {
      this.yAccel += this.vCoeff * this.yVelocity + this.sCoeff * (this.yPos() - this._target.yPos())
    }
  }
})

Crafty.c("MouseFollower", {
  _following: false,
  _paused: false,
  pausable: false,
  _absX:0,
  _absY:0,
  leftButtonDown: false,
  init: function() {
    var self = this
    
    self.requires("Followable")
    if (self.x === undefined) self.x = 0
    if (self.y === undefined) self.y = 0
    
    self._followerOnPan =  function() {
      self._updatePos()
    }
  },
  
  _followerOnMove: function(e) {
    this._absX = e.clientX
    this._absY = e.clientY
    this._updatePos()
  },
  
  _followerKeyDown: function(e) {
    if (this.pausable && (e.key === Crafty.keys.SHIFT)) {
      this._paused = true
    }
  },
  
  _followerKeyUp: function(e) {
    if (this.pausable && (e.key === Crafty.keys.SHIFT)) {
      this._paused = false
      this._updatePos()
    }
  },
  
  _followerMouseDown: function(e) {
    if (e.mouseButton === Crafty.mouseButtons.LEFT) {
      this.leftButtonDown = true
    }
  },
  
  _followerMouseUp: function(e) {
    if (e.mouseButton === Crafty.mouseButtons.LEFT) {
      this.leftButtonDown = false
    }
  },
  
  followMouse: function(pausable) {
    if (pausable !== undefined) {
      this.pausable = pausable
    }
    if (!this._following) {
      Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._followerOnMove)
      Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._followerMouseUp)
      Crafty.addEvent(this, Crafty.stage.elem, "mousedown", this._followerMouseDown)
      this.bind("KeyDown", this._followerKeyDown)
      this.bind("KeyUp", this._followerKeyUp)
      Crafty.bind("ViewportScroll", this._followerOnPan)
      this._following = true
    }
    return this
  },
  unfollowMouse: function() {
    if (this._following) {
      this._following = false
      Crafty.unbind("ViewportScroll", this._followerOnPan)
      this.unbind("KeyUp", this._followerKeyUp)
      this.unbind("KeyDown", this._followerKeyDown)
      Crafty.removeEvent(this, Crafty.stage.elem, "mousedown", this._followerMouseDown)
      Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._followerMouseUp)
      Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._followerOnMove)
    }
    return this
  },
  xPos: function() {
    return this.x
  },
  yPos: function() {
    return this.y
  },
  _updatePos: function() {
    if (!this._paused) {
      var pos = Crafty.DOM.translate(this._absX, this._absY)
      this.x = pos.x
      this.y = pos.y
      this.trigger("FollowMe")
    }
  }
})

Crafty.c("Camera", {
  _target: null,
  init: function() {
    this.requires("LevelEntity")
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
      if ((newXPos !== Crafty.viewport._x) || (newYPos !== Crafty.viewport._y))  {
        Crafty.viewport.scroll("_x", newXPos);
        Crafty.viewport.scroll("_y", newYPos);
      }
    }
  },
  follow: function(target) {
    this.unfollow()
    this._target = target
    target.bind("FollowMe", this._followMeHandler)
    return this
  },
  unfollow: function() {
    if (this._target !== null) {
      this._target.unbind("FollowMe", this._followMeHandler)
      this._target = null
    }
    return this
  },
})

Crafty.c("BasicPhys", {
  xAccel: 0.0,
  yAccel: 0.0,
  xGravity: 0.0,
  yGravity: 0.8,
  xVelocity: 0.0,
  yVelocity: 0.0,
  speedLimit: 35.0,
  
  init: function() {
    this.requires("Followable")
    if (this.x === undefined) this.x = 0
    if (this.y === undefined) this.y = 0
    if (this.w === undefined) this.w = 0
    if (this.h === undefined) this.h = 0
  },
  
  physicsOn: function(params) {
    if (params !== undefined) {
      for (var param in params) {
        this[param] = params[param]
      }
    }
    this.unbind("EnterFrame", this._enterFrame)
    this.bind("EnterFrame", this._enterFrame)
    return this
  },
  
  physicsOff: function() {
    this.unbind("EnterFrame", this._enterFrame)
    return this
  },
  
  accelerate: function(x, y) {
    this.xAccel += x
    this.yAccel += y
    return this
  },
  
  _enterFrame: function() {
    var self = this
    self.prevX = self.x
    self.prevY = self.y
    self._forceNewDirection = false
    var oldXSignum = floatSignum(self.xVelocity)
    var oldYSignum = floatSignum(self.yVelocity)
    
    self.xVelocity += self.xAccel + self.xGravity
    self.xAccel = 0
    self.yVelocity += self.yAccel + self.yGravity
    self.yAccel = 0
    
    // Limit velocity, to avoid clipping issues
    var l = this.speedLimit
    if (self.xVelocity < -l) self.xVelocity = -l
    if (self.xVelocity > l) self.xVelocity = l
    if (self.yVelocity < -l) self.yVelocity = -l
    if (self.yVelocity > l) self.yVelocity = l
    
    self.x += Math.round(self.xVelocity)
    self.y += Math.ceil(self.yVelocity)
    
    this.trigger("PhysicsCallbacks")
    
    // Trigger NewDirection listener.
    var newXSignum = floatSignum(self.xVelocity)
    var newYSignum = floatSignum(self.yVelocity)
    if ((newXSignum != oldXSignum)
        || (newYSignum != oldYSignum)
        || self._forceNewDirection) {
      self.trigger("NewDirection",{x: newXSignum, y: newYSignum})
    }
    if ((self.prevX !== self.x) || (self.prevY !== self.y)) {
      self.trigger("FollowMe")
    }
  },
  
  xPos: function() {return this.x + this.w / 2},
  yPos: function() {return this.y + this.h / 2},
})

Crafty.c("Phys", {
  groundFriction: 0.1,
  airFriction: 0.02,
  _falling: true,
  
  init: function() {
    this.requires("2D, BasicPhys, AABB")
    this.bind("PhysicsCallbacks", this._handleCollisions)
  },
  
  _handleCollisions: function() {
    var self = this
    // Resolve collisions
    var wasFalling = self._falling
    
    var q = Crafty.map.search(self, false);
    var handled = {}
    self._falling = true // Falling, unless proven otherwise
    
    if (q) q.forEach(function(o) {
      if ((o !== self) && o.has("HandlesCollisions") && o.intersects(self) && !handled[o[0]]) {
        /*
         * Both sides get an event - so far I'm only using PhysicsCollision,
         * but I can imagine cases where we'd want the behaviour to be on
         * the part of the moving object - maybe.
         */
        o.trigger("PhysicsCollision", self)
        handled[o[0]] = true
      }
    })
    
    if (self._falling !== wasFalling) self._forceNewDirection = true
    
    if (!self._falling) {
      self.xAccel -= self.xVelocity * self.groundFriction
    } else {
      self.xAccel -= self.xVelocity * self.airFriction
      self.yAccel -= self.yVelocity * self.airFriction
    }
  }
})

Crafty.c("Sign", {
  init: function() {
    this.requires("Text, Canvas, 2D")
    .textFont({size: "50px", family: "Coming Soon"})
  }
})

Crafty.c("BackgroundMusic", {
  init: function() {
    this.requires("LevelEntity")
    Crafty.audio.play("music", 1, 0.4)
  }
})

Crafty.c("GameLogo", {
  init: function() {
    this.requires("Text, Canvas, 2D")
    .textFont({size: "50px", family: "Coming Soon"})
    .textColor("#ffffff")
    .text("Change The Lightbulb")
    .attr({z: 200})
  }
})

Crafty.c("HintText", {
  _timeoutSet: false,
  init: function() {
    this.requires("HTML")
    if (this.hintTimeout !== undefined) {
      this._setHintTimeout(this.hintTimeout)
    } else {
      this.bind("Change", function(data) {
        if (!this._timeoutSet && (data.hintTimeout !== undefined)) {
          this._setHintTimeout(this.hintTimeout)
        }
      })
    }
  },
  _setHintTimeout: function(timeout) {
    this.timeout(
      function() {
        this.replace('<div class="hint-text">' + this.message + '</div>')
      },
      timeout
    )
    this._timeoutSet = true
  }
})

var telekinesisRadius = 400

Crafty.c("Telekinesis", {
  maxRadius: telekinesisRadius,
  _player: null,
  _held: false,
  _tinted: false,
  tintColour: "#00D0FF",
  tintOpacity: 0.25,
  init: function() {
    var self = this
    
    self.requires("Phys, SHMFollower, Mouse, Tint, Keyboard")
    
    self.vCoeff = -0.52
    self.sCoeff = -0.22
    self.speedLimit = 20.0 // Limit speed of telekinetics, to keep them from escaping
  
    
    if (Crafty("MouseFollower").length !== 0) {
      self._mouseFollower = Crafty(Crafty("MouseFollower")[0])
    } else {
      self._mouseFollower = Crafty.e("MouseFollower").followMouse(true)
    }
    
    self._holdOn = function() {
      if (!this._held) {
        self.followSHM(self._mouseFollower)
        Crafty.addEvent(self, Crafty.stage.elem, "mouseup", self._telekinesisMouseUp)
        this.bind("KeyUp", this._telekinesisKeyUp)
        self._held = true
        self._dropThrough = true
        // Increase speed limit when dragging, to make it more responsive
        this.speedLimit = 35.0
      }
    }
    
    self._letGo = function() {
      if (this._held) {
        // Reduce speed limit on letting go
        this.speedLimit = 20.0
        self._dropThrough = false
        self._held = false
        self.unfollowSHM(self._mouseFollower)
        this.unbind("KeyUp", this._telekinesisKeyUp)
        Crafty.removeEvent(self, Crafty.stage.elem, "mouseup", self._telekinesisMouseUp)
        self.bind("MouseDown",self._telekinesisMouseDown)
      }
    }
    
    self._mouseFollowMeHandler =  function() {
      if (!self._inRange()) {
        self._letGo()
      }
    }
  },
  
  startTelekinesis: function(player) {
    this.endTelekinesis()
    this._player = player
    this.bind("MouseDown",this._telekinesisMouseDown)
    this._mouseFollower.bind("FollowMe", this._mouseFollowMeHandler)
    this.bind("EnterFrame", this._telekinesisEnterFrame)
    return this
  },
  
  endTelekinesis: function() {
    this._letGo()
    this.unbind("EnterFrame", this._telekinesisEnterFrame)
    this._mouseFollower.unbind("FollowMe", this._mouseFollowMeHandler)
    this.unbind("MouseDown",this._telekinesisMouseDown)
    this._player = null
    return this
  },
  _inRange: function() {
    var dist = this.distFrom(this._player)
    return dist <= this.maxRadius
  },
  _telekinesisMouseDown: function(e) {
    // Special case SHIFT - if SHIFT is down, don't pick anything else up
    if (e.mouseButton === Crafty.mouseButtons.LEFT
        && this._inRange()
        && !this.isDown(Crafty.keys.SHIFT)) {
      this._holdOn()
    }
  },
  
  _telekinesisMouseUp: function(e) {
    // Special case SHIFT - if SHIFT is down, keep hold until it's released
    if ((e.mouseButton === Crafty.mouseButtons.LEFT)
      && !this.isDown(Crafty.keys.SHIFT)) {
      this._letGo()
    }
  },
  
  _telekinesisKeyUp: function(e) {
    // Don't let go if left mouse button down
    if ((e.key === Crafty.keys.SHIFT)
        && !this._mouseFollower.leftButtonDown) {
      this._letGo()
    }
  },
  
  _telekinesisEnterFrame: function(e) {
    if (this._tinted) {
      if (!this._inRange()) {
        this.tint("#ffffff", 0.0)
        this._tinted = false
        this._letGo()
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
  _blockingActive: true,
  init: function() {
    this.requires("HandlesCollisions")
    this.obstructFromAbove = true
    this.obstructFromSides = true
    this.obstructFromBelow = true
    this.speedLimit = 50.0
    this.unbind("PhysicsCollision", this._genericHandleCollision)
    this.bind("PhysicsCollision", this._restrictedHandleCollision)
  },
  _restrictedHandleCollision: function(o) {
    if (this._blockingActive && o.has("Telekinesis") && !o.has("Money")) {
      this._genericHandleCollision(o)
    }
  }
})

Crafty.c("Money", {
  init: function() {
    this.requires("Telekinesis")
    this.aabb({l: 5, r: 45, t: 5, b: 50})
  }
})

Crafty.c("AngryPoker", {
  init: function() {
    this.requires("TelekinesisBlocker, Sprite")
    this.bind("PhysicsCollision", this._handleMoneyCollision)
  },
  _handleMoneyCollision: function(o) {
    if (this._blockingActive && o.has("Money")) {
      o.destroy()
      this.sprite(0, 0, 1, 1)
      this._blockingActive = false
      Crafty.audio.play("bribe", 1)
    }
  }
})

Crafty.c("PlayerBlocker", {
  "_blocking": true,
  init: function() {
    this.requires("SHMFollower, Phys, HandlesCollisions")
    this.xFollow = false
    this.bind("PhysicsCollision", this._handleMoneyCollision)
    this.obstructFromAbove = true
    this.obstructFromBelow = true
    this.obstructFromSides = true
    this.vCoeff = -0.4
    this.sCoeff = -0.6
    this.xGravity = 0
    this.yGravity = 0
  },
  _handleMoneyCollision: function(o) {
    if (this._blocking && o.has("Money")) {
      o.destroy()
      this.sprite(0, 0, 1, 1)
      this._blocking = false
      this.obstructFromAbove = false
      this.obstructFromBelow = false
      this.obstructFromSides = false
      this.physicsOff().unfollowSHM()
      Crafty.audio.play("bribe", 1)
    }
  }
  
})

Crafty.c("Platformer", {
  speed: 9,
  jump: 20.0,
  acceleration: 3,
  airAcceleration: 1.5,
  disableControls: false,
  _leftKeyDown: false,
  _rightKeyDown: false,
  _dropThrough: false,
  _platformer: true, // Always true
  init: function() {
    this.requires("Phys, Keyboard")
  },
  platformer: function(params) {
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
  _keyDown: function(e) {
    if ((e.key == Crafty.keys.LEFT_ARROW) || (e.key == Crafty.keys.A)) this._leftKeyDown = true
    if ((e.key == Crafty.keys.RIGHT_ARROW) || (e.key == Crafty.keys.D)) this._rightKeyDown = true
    if ((e.key == Crafty.keys.UP_ARROW) || (e.key == Crafty.keys.W)) {
      this._tryJump()
    }
    if ((e.key == Crafty.keys.DOWN_ARROW) || (e.key == Crafty.keys.S)) {
      this._dropThrough = true
    }
  },
  _tryJump: function() {
    if (!this._falling) {
      this.yVelocity = -(this.jump)
      this._falling = true
      this.trigger("NewDirection",{x:Math.round(self.xVelocity), y: Math.round(self.yVelocity)})
      this.trigger("Jump")
    }
  },
  _keyUp: function(e) {
    if ((e.key == Crafty.keys.LEFT_ARROW) || (e.key == Crafty.keys.A)) this._leftKeyDown = false
    if ((e.key == Crafty.keys.RIGHT_ARROW) || (e.key == Crafty.keys.D)) this._rightKeyDown = false
    if ((e.key == Crafty.keys.DOWN_ARROW) || (e.key == Crafty.keys.S)) {
      this._dropThrough = false
    }
  },
  _platformerEnterFrame: function () {
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
  _goRight: function() {
    if (this.xVelocity < this.speed) {
      var accelAmount = Math.min(this._accel, this.speed - this.xVelocity)
      this.xAccel += accelAmount
      if (!this._falling) {
        // If on the ground, accelerate downwards too, to hug slopes
        this.yAccel += accelAmount
      }
    }
  },
  _goLeft: function() {
    if (this.xVelocity > (-this.speed)) {
      var accelAmount = Math.min(this._accel, this.speed + this.xVelocity)
      this.xAccel -= accelAmount
      if (!this._falling) {
        // If on the ground, accelerate downwards too, to hug slopes
        this.yAccel += accelAmount
      }
    }
  },
  _stopMoving: function() {
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
  init: function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._checkpointCollision)
  },
  _checkpointCollision: function(o) {
    if (o.has("Player")) {
      o.lastCheckpoint = this
    }
  }
})

Crafty.c("PlayerSpawn", {
  init: function() {
    this.requires("Checkpoint")
  }
})

Crafty.c("Scriptable", {
  _scriptTriggered: false,
  init: function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._scriptableCollision)
  },
  _scriptableCollision: function(o) {
    if (o.has("Player") && !this._scriptTriggered) {
      this._scriptTriggered = true
      var callback = Callbacks[this.callback]
      callback.call(this, o)
    }
  }
})

Crafty.c("Talker", {
  message: "This character currently has no message...",
  _msgEntity: null,
  msgWidth: 100,
  msgHeight: 100,
  init: function() {
    this.requires("2D, AABB")
    this._talkerTick()
  },
  _talkerTick: function() {
    var player = Crafty("Player")
    if ((player.length > 0) && player.intersects(this)) {
      if (this._msgEntity === null) {
        var e = Crafty.e("HTML")
        this._msgEntity = e
        var msgWidth = this.msgWidth
        var msgHeight = this.msgHeight
        e.x = Math.round(this.x + this.w / 2) - msgWidth / 2 - 25
        e.y = this.y - msgHeight - 100
        e.w = msgWidth
        e.h = msgHeight
        e.replace(
          '<div class="talker">' + this.message + '</div>')
      }
    } else {
      if (this._msgEntity !== null) {
        this._msgEntity.destroy()
        this._msgEntity = null
      }
    }
    this.timeout(this._talkerTick, 200)
  }
})

Crafty.c("Player", {
  dotCount: 32,
  dotSize: 4,
  dotColors: ["#3BDBFF", "#009ABD"],
  lastCheckpoint: null,
  init: function() {
    this.requires("2D, Canvas, p1_front_r, SpriteAnimation, Platformer")
    
    this.attr({
      w: 52, h: 70
    })
    this.aabb({l: 6, r: 46, t: 6, b: 70})
    
    this.platformer()
    
    this.reel("WalkRight", 500, 5, 0, 11)
    this.reel("JumpRight", 1000, 3, 0, 1)
    this.reel("StillRight", 1000, 4, 0, 1)
    animation_speed = 10
    this.bind('NewDirection', function(data) {
      //this.stop()
      if (this._falling) {
        this.animate("JumpRight", 1);
        this.hideDots()
      } else if (data.x !== 0) {
        this.animate('WalkRight', -1);
        this.hideDots()
      } else {
        this.animate("StillRight", 1)
        this.showDots()
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

    this.dots = []
  },
  hideDots: function() {
    this.dots.forEach(function(dot) {
      dot.destroy()
    })
    this.dots = []
  },
  showDots: function () {
    this.hideDots()

    var leftBound = -Crafty.viewport._x
    var rightBound = Crafty.viewport.width - Crafty.viewport._x
    var topBound = -Crafty.viewport._y
    var bottomBound = Crafty.viewport.height - Crafty.viewport._y
      
    var colors = this.dotColors
    var c = this.dotCount
    var sz = this.dotSize
    var hf = sz / 2
    for (var i = 0; i < c; i++) {
      // Draw dots in a circle around player
      var xDotPos = telekinesisRadius * Math.sin(2 * Math.PI * i / c) + this.xPos()
      var yDotPos = telekinesisRadius * Math.cos(2 * Math.PI * i / c) + this.yPos()
      if ((xDotPos > leftBound + hf)
           && (xDotPos < rightBound - hf)
           && (yDotPos > topBound + hf)
           && (yDotPos < bottomBound - hf)) {
             
        var dot = Crafty.e("2D, Canvas, Color")
          .attr(
            {
              w: sz,
              h: sz,
              x: xDotPos - hf,
              y: yDotPos - hf,
              z: -100,
              alpha: 0.0
            }
          )
          .color(colors[i % colors.length])
          .timeout(function() {this.alpha = 0.2}, 250)
          .timeout(function() {this.alpha = 0.6}, 375)
          .timeout(function() {this.alpha = 1.0}, 500)
          //.tween({alpha: 1.0}, 35)
        //this.attach(dot)
        this.dots.push(dot)
      }
    }
  },
  respawn: function() {
    this.hideDots()
    var spawnPoint = this.lastCheckpoint || Crafty("PlayerSpawn")
    this.attr(
      {
      x: spawnPoint.x + spawnPoint.w / 2 - this._w / 2,
      y: spawnPoint.y + spawnPoint.h / 2 - this._h / 2,
      xVelocity: 0.0,
      yVelocity: 0.0
      }
    )
    return this
  },
  die: function() {
    Crafty.audio.play("death", 1, 0.5)
    // Will improve later
    this.respawn()
  }
})

Crafty.c("Lightbulb", {
  _winning: false,
  init: function() {
    this.requires("2D, HandlesCollisions, Sprite, Tween")
    this.bind("PhysicsCollision", this._lightbulbCollision)
  },
  _lightbulbCollision: function(o) {
    if (!this._winning && o.has("Player")) {
      this._winning = true
      this.sprite(1, 0, 1, 1)
      Crafty.audio.play("win", 1, 0.3)
      this.tween({
        x: this.x - 100,
        w: 250,
        h: 250,
        alpha:0}, 2000)
      this.bind("TweenEnd", function() {
        win()
      })
    }
  }
})

Crafty.c("LockedDoor", {
  obstructFromAbove: true,
  obstructFromBelow: true,
  obstructFromSides: true,
  _disappearing: false,
  init: function() {
    this.requires("2D, HandlesCollisions, Tween")
    this.bind("PhysicsCollision", this._doorCollisionHandler)
  },
  doorColour: function(colour) {
    this.colour = colour
    return this
  },
  _doorCollisionHandler: function(obj) {
    if (obj.has("DoorKey") && (obj.colour === this.colour)) {
      this._disappear()
    }
  },
  _disappear: function() {
    if (!this._disappearing) {
      this._maybePlaySound()
      this._disappearing = true
      this.obstructFromAbove = false
      this.obstructFromBelow = false
      this.obstructFromSides = false
      this.tween({alpha: 0.0}, 1000)
      this.bind("TweenEnd", function(props) {
        this.destroy()
      })
    }
  }
  ,_maybePlaySound: function() {
    var playing = false
    //Stupid Chrome.. doesn't report "ended" events
    Crafty.audio.channels.forEach(function(ch) {
      if (ch && (ch.id == "unlockDoor") && !ch.obj.ended)
      playing = true
    })
    
    if (!playing) Crafty.audio.play("unlockDoor", 1, 0.9)
  }
})

Crafty.c("DoorKey", {
  init: function() {
    this.requires("Telekinesis")
    this.aabb({l: 5, r: 45, t: 5, b: 50})
  },
  keyColour: function(colour) {
    this.colour = colour
    return true
  }
})

var buttonPressedSprites = {
  Red: [0, 1],
  Green: [6, 0],
  Blue: [4, 0],
  Yellow: [2, 1]
}

Crafty.c("Button", {
  _pressed: false,
  init: function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._buttonPress)
  },
  buttonColour: function(colour) {
    this.colour = colour
  },
  _buttonPress: function() {
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
  init: function() {
    this.requires("HandlesCollisions")
    this.bind("PhysicsCollision", this._deadlyCollision)
  },
  _deadlyCollision: function(obj) {
    if (obj.has("Player")
        && (obj.prevY + obj._b > this._y + this._t)) { // Only die on the second frame - allows you to stand on the water's edge
      obj.die()
    }
  }
})

Crafty.c("Liquid", {
  init: function() {
    this.requires("Deadly")
    animateLiquids()
  },
})

function animateLiquids() {
  if (Crafty("LiquidAnimator").length === 0) {
    Crafty.e("LiquidAnimator")
  }
}

// Singleton to animate liquids, to ensure they stay in sync
Crafty.c("LiquidAnimator", {
  flipTimeout: 500,
  init: function() {
    this.requires("LevelEntity")
    this._flip()
  },
  _flip: function() {
    Crafty("Liquid").each(function() {
      this.flip("X")
    })
    this.timeout(this._unflip, this.flipTimeout)
  },
  _unflip: function() {
    Crafty("Liquid").each(function() {
      this.unflip("X")
    })
    this.timeout(this._flip, this.flipTimeout)
  }
})

Crafty.c("HalfHeight", {
  init: function() {
    this.requires("AABB")
    this.aabb({l: 0, r: 50, t: 25, b: 50})
  }
})

Crafty.c("Springer", {
  init: function() {
    this.requires("HalfHeight, HandlesCollisions, Sprite")
    this.bind("PhysicsCollision", this._springCollisionHandler)
  },
  _springCollisionHandler: function(o) {
    if (o.prevY + o._b <= this._y + this._t) {
      Crafty.audio.play("boing", 1, 0.6)
      o.yVelocity = Math.min(-35, o.speedLimit)
      this.sprite(5,5,1,1)
      this.timeout(function() {
        this.sprite(4, 5, 1, 1)
      }, 500)
    }
  }
})

Crafty.c("Torch", {
  init: function() {
    this.requires("SpriteAnimation")
    this.reel("flame", 700, 4, 3, 2)
    this.animate("flame", -1)
  }
})

var colours = ["Red", "Green", "Blue", "Yellow"]
colours.forEach(function(colour) {
  Crafty.c(colour + "Door", {
    init: function() {
      this.requires("LockedDoor")
      this.doorColour(colour)
    }
  })
  
  Crafty.c(colour + "Key", {
    init: function() {
      this.requires("DoorKey")
      this.keyColour(colour)
    }
  })
  
  Crafty.c(colour + "Button", {
    init: function() {
      this.requires("Button")
      this.buttonColour(colour)
    }
  })
})
