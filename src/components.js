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

Crafty.c("Phys", {
  "xAccel": 0.0,
  "yAccel": 0.0,
  "xGravity": 0.0,
  "yGravity": 0.4,
  "xVelocity": 0.0,
  "yVelocity": 0.0,
  "groundFriction": 0.1,
  "density": 1.0,
  "_falling": true,
  
  "init": function() {
    this.requires("2D")
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
  
  "_mass": function() {
    return this.h * this.w * this.density
  },
  
  "_enterFrame": function() {
    var self = this
    var prevX = self.x
    var prevY = self.y
    var oldXSignum = signum(self.xVelocity)
    var oldYSignum = signum(self.yVelocity)
    
    if (!self._falling) {
      self.xAccel -= self.xVelocity * self.groundFriction
    }
    self.xVelocity += self.xAccel + self.xGravity
    self.xAccel = 0
    self.yVelocity += self.yAccel + self.yGravity
    self.yAccel = 0
    
    self.x += Math.round(self.xVelocity)
    self.y += Math.ceil(self.yVelocity)
    
    // Resolve collisions
    var pos = self.pos()
    
    pos.x = pos._x
    pos.y = pos._y
    pos.h = pos._h
    pos.w = pos._w
    
    var q = Crafty.map.search(pos);
    self._falling = true // Falling, unless proven otherwise
    
    q.forEach(function(obj) {
        //check for an intersection directly below the player
        if ((obj !== self) && obj.intersect(pos)) {
            // Stop the player, and position them at the most sensible edge

            if ((prevY + self.h <= obj.y) && obj.has("Platform")) {
              // On top
              self.yVelocity = 0
              self.y = obj.y - self.h
              self._falling = false
            } else if ((prevX + self.w <= obj.x) && obj.has("Wall")) {
              //On left
              self.xVelocity = 0
              self.x = obj.x - self.w
            } else if ((prevX >= obj.x + obj.w) && obj.has("Wall")) {
              // On right
              self.xVelocity = 0
              self.x = obj.x + obj.w
            } else if ((prevY >= obj.y + obj.h) && obj.has("Ceiling")) {
              // below
              self.yVelocity = 0
              self.y = obj.y + obj.h
            }
        }
    })
    
    // Trigger NewDirection listener.
    var newXSignum = signum(self.xVelocity)
    var newYSignum = signum(self.yVelocity)
    if ((newXSignum != oldXSignum) || (newYSignum != oldYSignum)) {
      self.trigger("NewDirection",{"x":Math.round(self.xVelocity), "y": Math.round(self.yVelocity)})
    }
  }
})

Crafty.c("Platformer", {
  "speed": 9,
  "jump": 15,
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
    if (e.key == Crafty.keys.LEFT_ARROW) this._leftKeyDown = true
    if (e.key == Crafty.keys.RIGHT_ARROW) this._rightKeyDown = true
    if (e.key == Crafty.keys.Z) {
      if (!this._falling) {
        this.yVelocity -= this.jump
        this._falling = true
        this.trigger("NewDirection",{"x":Math.round(self.xVelocity), "y": Math.round(self.yVelocity)})
      }
    }
  },
  "_keyUp": function(e) {
    if (e.key == Crafty.keys.LEFT_ARROW) this._leftKeyDown = false
    if (e.key == Crafty.keys.RIGHT_ARROW) this._rightKeyDown = false
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
      "w": 72, "h": 97
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
