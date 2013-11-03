Crafty.c("Platform", {
  "init": function() {
    this.requires("2D")
  }
})

Crafty.c("Obstacle", {
  "init": function() {
    this.requires("2D, Collision")
  }
})

/* An unholy amalgam of Gravity and Twoway - the two have some weird
 * interactions, which make collision detection difficult, so
 * we combine their EnterFrame handlers
 */
Crafty.c("Physics", {
    // From Gravity
    _gravityConst: 0.5,
    _gy: 0,
    _falling: true,
    _anti: null,
    // From Twoway
    _speed: 3,
    _up: false,
    _jump: 6,

    init: function () {
        this.requires("2D, Fourway, Keyboard, Collision")
        this.gravity("Platform")
    },

    gravity: function (comp) {
        if (comp) this._anti = comp;
        this._prevY = this.y

        this.bind("EnterFrame", this._enterFrame);

        return this;
    },

    gravityConst: function (g) {
        this._gravityConst = g;
        return this;
    },

    _enterFrame: function () {
        this._twowayEnterFrame()
        if (this._falling) {
            //if falling, move the players Y
            this._gy += this._gravityConst;
            this.y += this._gy;
        } else {
            this._gy = 0; //reset change in y
        }

        var obj, hit = false,
            pos = this.pos(),
            q, i = 0,
            l;

        //Increase by 1 to make sure map.search() finds the floor
        pos._y++;

        //map.search wants _x and intersect wants x...
        pos.x = pos._x;
        pos.y = pos._y;
        pos.w = pos._w;
        pos.h = pos._h;

        q = Crafty.map.search(pos);
        l = q.length;
        
        for (; i < l; ++i) {
            obj = q[i];
            //check for an intersection directly below the player
            if (obj !== this
                  && obj.has(this._anti)
                  && obj.intersect(pos)
                  // Ignore collisions that weren't below the player
                  && (this._prevY + this.h <= obj.y)) {
                hit = obj;
                break;
            }
        }

        if (hit) { //stop falling if found
            if (this._falling) this.stopFalling(hit);
        } else {
            this._falling = true; //keep falling otherwise
        }
        this._prevY = this.y
    },

    stopFalling: function (e) {
        if (e) this.y = e._y - this._h; //move object

        //this._gy = -1 * this._bounce;
        this._falling = false;
        if (this._up) this._up = false;
        this.trigger("hit");
        this.trigger("NewDirection", this._movement)
    },

    antigravity: function () {
      // Modified, to allow it to be called from within the Gravity handler
      this._twowayEnabled = false
    },
    
    twoway: function (speed, jump) {

        this.multiway(speed, {
            RIGHT_ARROW: 0,
            LEFT_ARROW: 180,
            D: 0,
            A: 180,
            Q: 180
        });

        if (speed) this._speed = speed;
        if (arguments.length < 2) jump = this._speed * 2;
        this._jump = jump

        // Replaces bind - it's called in the Gravity handler
        this._twowayEnabled = true
        this.bind("KeyDown", function () {
            if (this.isDown("UP_ARROW") || this.isDown("W") || this.isDown("Z")) this._up = true;
            this.trigger("NewDirection", this._movement)
        });

        return this;
    },
    
    _twowayEnabled: false,
    _twowayEnterFrame: function () {
      if (this.disableControls || !this._twowayEnabled) return;
      if (this._up) {
          this.y -= this._jump;
          this._falling = true;
      }
    },
    
    // Stop on obstacle
    _stopMovement: function() {
      console.log("Hit!")
      this.stopFalling()
      if (this._movement) {
        this.x -= this._movement.x;
        this.y -= this._movement.y;
      }
    }
});

Crafty.c("Player", {
  "init": function() {
    this.requires("2D, Canvas, p1_front_r, Physics, SpriteAnimation")
    this.twoway(9, 15)
    this.attr({
      "w": 72, "h": 97
    })
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
        if (this._up) {
          this.stop()
          this.animate("JumpRight", 1000, -1);
        } else {
          this.stop()
          this.animate('WalkRight', animation_speed, -1);
        }
      } else if (data.x < 0) {
        this._direction = "l"
        if (this._up) {
          this.stop()
          this.animate("JumpLeft", 0, 0);
        } else {
          this.stop()
          this.animate('WalkLeft', animation_speed, -1);
        }
      } else {
        if (this._direction == "l") {
          if (this._up) {
            this.stop()
            this.animate("JumpLeft", 0, 0);
          } else {
            this.stop()
            this.animate("StillLeft", animation_speed, -1)
          }
        } else {
          if (this._up) {
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
