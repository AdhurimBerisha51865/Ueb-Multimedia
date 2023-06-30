class Bump {
  constructor(renderingEngine = PIXI) {
    if (renderingEngine === undefined) throw new Error("Please assign a rendering engine in the constructor before using bump.js"); 

    this.renderer = "pixi";
  
  }


  addCollisionProperties(sprite) {

    if (this.renderer === "pixi") {

      if (sprite.gx === undefined) {
        Object.defineProperty(sprite, "gx", {
          get(){return sprite.getGlobalPosition().x},
          enumerable: true, configurable: true
        });
      }

      if (sprite.gy === undefined) {
        Object.defineProperty(sprite, "gy", {
          get(){return sprite.getGlobalPosition().y},
          enumerable: true, configurable: true
        });
      }
      
      if (sprite.centerX === undefined) {
        Object.defineProperty(sprite, "centerX", {
          get(){return sprite.x + sprite.width / 2},
          enumerable: true, configurable: true
        });
      }

      if (sprite.centerY === undefined) {
        Object.defineProperty(sprite, "centerY", {
          get(){return sprite.y + sprite.height / 2},
          enumerable: true, configurable: true
        });
      }
      
      if (sprite.halfWidth === undefined) {
        Object.defineProperty(sprite, "halfWidth", {
          get(){return sprite.width / 2},
          enumerable: true, configurable: true
        });
      }
      
      if (sprite.halfHeight === undefined) {
        Object.defineProperty(sprite, "halfHeight", {
          get(){return sprite.height / 2},
          enumerable: true, configurable: true
        });
      }
      
      if (sprite.xAnchorOffset === undefined) {
        Object.defineProperty(sprite, "xAnchorOffset", {
          get(){
            if (sprite.anchor !== undefined) {
              return sprite.width * sprite.anchor.x;
            } else {
              return 0;
            }
          },
          enumerable: true, configurable: true
        });
      }
      
      if (sprite.yAnchorOffset === undefined) {
        Object.defineProperty(sprite, "yAnchorOffset", {
          get(){
            if (sprite.anchor !== undefined) {
              return sprite.height * sprite.anchor.y;
            } else {
              return 0;
            }
          },
          enumerable: true, configurable: true
        });
      }

      if (sprite.circular && sprite.radius === undefined) {
        Object.defineProperty(sprite, "radius", {
          get(){return sprite.width / 2},
          enumerable: true, configurable: true
        });
      }

     
    }


    sprite._bumpPropertiesAdded = true;
  }



  hitTestPoint(point, sprite) {

    if (!sprite._bumpPropertiesAdded) this.addCollisionProperties(sprite); 

    let shape, left, right, top, bottom, vx, vy, magnitude, hit;


    if (sprite.radius) {
      shape = "circle";
    } else {
      shape = "rectangle";
    }

    if (shape === "rectangle") {

      left = sprite.x - sprite.xAnchorOffset;
      right = sprite.x + sprite.width - sprite.xAnchorOffset;
      top = sprite.y - sprite.yAnchorOffset;
      bottom = sprite.y + sprite.height - sprite.yAnchorOffset;

      hit = point.x > left && point.x < right && point.y > top && point.y < bottom;
    }

    if (shape === "circle") {


      let vx = point.x - sprite.x - (sprite.width / 2) + sprite.xAnchorOffset,
          vy = point.y - sprite.y - (sprite.height / 2) + sprite.yAnchorOffset,
          magnitude = Math.sqrt(vx * vx + vy * vy);


      hit = magnitude < sprite.radius;
    }

    return hit;
  }



  hitTestCircle(c1, c2, global = false) {

    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 
    if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2); 

    let vx, vy, magnitude, combinedRadii, hit;

    if (global) {
      vx = (c2.gx + (c2.width / 2) - c2.xAnchorOffset) - (c1.gx + (c1.width / 2) - c1.xAnchorOffset);
      vy = (c2.gy + (c2.width / 2) - c2.yAnchorOffset) - (c1.gy + (c1.width / 2) - c1.yAnchorOffset);
    } else {
      vx = (c2.x + (c2.width / 2) - c2.xAnchorOffset) - (c1.x + (c1.width / 2) - c1.xAnchorOffset);
      vy = (c2.y + (c2.width / 2) - c2.yAnchorOffset) - (c1.y + (c1.width / 2) - c1.yAnchorOffset);
    }


    magnitude = Math.sqrt(vx * vx + vy * vy);

    combinedRadii = c1.radius + c2.radius;


    hit = magnitude < combinedRadii;

    return hit;
  } 



  circleCollision(c1, c2, bounce = false, global = false) {

    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 
    if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2); 

    let magnitude, combinedRadii, overlap,
      vx, vy, dx, dy, s = {},
      hit = false;


    if (global) {
      vx = (c2.gx + (c2.width / 2) - c2.xAnchorOffset) - (c1.gx + (c1.width / 2) - c1.xAnchorOffset);
      vy = (c2.gy + (c2.width / 2) - c2.yAnchorOffset) - (c1.gy + (c1.width / 2) - c1.yAnchorOffset);
    } else {
      vx = (c2.x + (c2.width / 2) - c2.xAnchorOffset) - (c1.x + (c1.width / 2) - c1.xAnchorOffset);
      vy = (c2.y + (c2.width / 2) - c2.yAnchorOffset) - (c1.y + (c1.width / 2) - c1.yAnchorOffset);
    }


    magnitude = Math.sqrt(vx * vx + vy * vy);

    combinedRadii = c1.radius + c2.radius;

    if (magnitude < combinedRadii) {

      hit = true;

      overlap = combinedRadii - magnitude;


      let quantumPadding = 0.3;
      overlap += quantumPadding;


      dx = vx / magnitude;
      dy = vy / magnitude;

      c1.x -= overlap * dx;
      c1.y -= overlap * dy;

      if (bounce) {

        s.x = vy;
        s.y = -vx;

        this.bounceOffSurface(c1, s);
      }
    }
    return hit;
  }



  movingCircleCollision(c1, c2, global = false) {

    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 
    if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2); 

    let combinedRadii, overlap, xSide, ySide,
      s = {},
      p1A = {},
      p1B = {},
      p2A = {},
      p2B = {},
      hit = false;

    c1.mass = c1.mass || 1;
    c2.mass = c2.mass || 1;

    if (global) {

      s.vx = (c2.gx + c2.radius - c2.xAnchorOffset) - (c1.gx + c1.radius - c1.xAnchorOffset);
      s.vy = (c2.gy + c2.radius - c2.yAnchorOffset) - (c1.gy + c1.radius - c1.yAnchorOffset);
    } else {

      s.vx = (c2.x + c2.radius - c2.xAnchorOffset) - (c1.x + c1.radius - c1.xAnchorOffset);
      s.vy = (c2.y + c2.radius - c2.yAnchorOffset) - (c1.y + c1.radius - c1.yAnchorOffset);
    }


    s.magnitude = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

    combinedRadii = c1.radius + c2.radius;

    if (s.magnitude < combinedRadii) {

      hit = true;

      overlap = combinedRadii - s.magnitude;

      overlap += 0.3;


      s.dx = s.vx / s.magnitude;
      s.dy = s.vy / s.magnitude;


      s.vxHalf = Math.abs(s.dx * overlap / 2);
      s.vyHalf = Math.abs(s.dy * overlap / 2);

      (c1.x > c2.x) ? xSide = 1 : xSide = -1;
      (c1.y > c2.y) ? ySide = 1 : ySide = -1;


      c1.x = c1.x + (s.vxHalf * xSide);
      c1.y = c1.y + (s.vyHalf * ySide);

      c2.x = c2.x + (s.vxHalf * -xSide);
      c2.y = c2.y + (s.vyHalf * -ySide);

 
      s.lx = s.vy;
      s.ly = -s.vx;


      let dp1 = c1.vx * s.dx + c1.vy * s.dy;

      p1A.x = dp1 * s.dx;
      p1A.y = dp1 * s.dy;

      let dp2 = c1.vx * (s.lx / s.magnitude) + c1.vy * (s.ly / s.magnitude);

      p1B.x = dp2 * (s.lx / s.magnitude);
      p1B.y = dp2 * (s.ly / s.magnitude);


      let dp3 = c2.vx * s.dx + c2.vy * s.dy;

      p2A.x = dp3 * s.dx;
      p2A.y = dp3 * s.dy;

      let dp4 = c2.vx * (s.lx / s.magnitude) + c2.vy * (s.ly / s.magnitude);

      p2B.x = dp4 * (s.lx / s.magnitude);
      p2B.y = dp4 * (s.ly / s.magnitude);



      c1.bounce = {};
      c1.bounce.x = p1B.x + p2A.x;
      c1.bounce.y = p1B.y + p2A.y;


      c2.bounce = {};
      c2.bounce.x = p1A.x + p2B.x;
      c2.bounce.y = p1A.y + p2B.y;


      c1.vx = c1.bounce.x / c1.mass;
      c1.vy = c1.bounce.y / c1.mass;
      c2.vx = c2.bounce.x / c2.mass;
      c2.vy = c2.bounce.y / c2.mass;
    }
    return hit;
  }


  multipleCircleCollision(arrayOfCircles, global = false) {
    for (let i = 0; i < arrayOfCircles.length; i++) {

      var c1 = arrayOfCircles[i];
      for (let j = i + 1; j < arrayOfCircles.length; j++) {

        let c2 = arrayOfCircles[j];


        this.movingCircleCollision(c1, c2, global);
      }
    }
  }



  rectangleCollision(
    r1, r2, bounce = false, global = true
  ) {

    if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1);
    if (!r2._bumpPropertiesAdded) this.addCollisionProperties(r2);

    let collision, combinedHalfWidths, combinedHalfHeights,
      overlapX, overlapY, vx, vy;

    if (global) {
      vx = (r1.gx + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.gx + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
      vy = (r1.gy + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.gy + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
    } else {

      vx = (r1.x + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
      vy = (r1.y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
    }

    combinedHalfWidths = Math.abs(r1.halfWidth) + Math.abs(r2.halfWidth);
    combinedHalfHeights = Math.abs(r1.halfHeight) + Math.abs(r2.halfHeight);

    if (Math.abs(vx) < combinedHalfWidths) {


      if (Math.abs(vy) < combinedHalfHeights) {


        overlapX = combinedHalfWidths - Math.abs(vx);
        overlapY = combinedHalfHeights - Math.abs(vy);



        if (overlapX >= overlapY) {


          if (vy > 0) {
            collision = "top";
            r1.y = r1.y + overlapY;
          } else {
            collision = "bottom";
            r1.y = r1.y - overlapY;
          }

          if (bounce) {
            r1.vy *= -1;



          }
        } else {


          if (vx > 0) {
            collision = "left";
            r1.x = r1.x + overlapX;
          } else {
            collision = "right";
            r1.x = r1.x - overlapX;
          }

          if (bounce) {
            r1.vx *= -1;



          }
        }
      } else {
      }
    } else {
    }


    return collision;
  }



  hitTestRectangle(r1, r2, global = false) {

    if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1); 
    if (!r2._bumpPropertiesAdded) this.addCollisionProperties(r2); 

    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    hit = false;

    if (global) {
      vx = (r1.gx + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.gx + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
      vy = (r1.gy + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.gy + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
    } else {
      vx = (r1.x + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
      vy = (r1.y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
    }

    combinedHalfWidths = Math.abs(r1.halfWidth) + Math.abs(r2.halfWidth);
    combinedHalfHeights = Math.abs(r1.halfHeight) + Math.abs(r2.halfHeight);

    if (Math.abs(vx) < combinedHalfWidths) {

      if (Math.abs(vy) < combinedHalfHeights) {

        hit = true;
      } else {

        hit = false;
      }
    } else {

      hit = false;
    }

    return hit;
  }

 

  hitTestCircleRectangle(c1, r1, global = false) {

    if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1); 
    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 

    let region, collision, c1x, c1y, r1x, r1y;

    if (global) {
      c1x = c1.gx;
      c1y = c1.gy
      r1x = r1.gx;
      r1y = r1.gy;
    } else {
      c1x = c1.x;
      c1y = c1.y;
      r1x = r1.x;
      r1y = r1.y;
    }

    if (c1y - c1.yAnchorOffset < r1y - Math.abs(r1.halfHeight) - r1.yAnchorOffset) {


      if (c1x - c1.xAnchorOffset < r1x - 1 - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "topLeft";
      } else if (c1x - c1.xAnchorOffset > r1x + 1 + Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "topRight";
      } else {
        region = "topMiddle";
      }
    }

    else if (c1y - c1.yAnchorOffset > r1y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) {


      if (c1x - c1.xAnchorOffset < r1x - 1 - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "bottomLeft";
      } else if (c1x - c1.xAnchorOffset > r1x + 1 + Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "bottomRight";
      } else {
        region = "bottomMiddle";
      }
    }


    else {
      if (c1x - c1.xAnchorOffset < r1x - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "leftMiddle";
      } else {
        region = "rightMiddle";
      }
    }


    if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

      collision = this.hitTestRectangle(c1, r1, global);
    }


    else {
      let point = {};

      switch (region) {
        case "topLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
          break;

        case "topRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
          break;

        case "bottomLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
          break;

        case "bottomRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
      }

      collision = this.hitTestCirclePoint(c1, point, global);
    }


    if (collision) {
      return region;
    } else {
      return collision;
    }
  }



  hitTestCirclePoint(c1, point, global = false) {

    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 


    point.diameter = 1;
    point.width = point.diameter;
    point.radius = 0.5;
    point.centerX = point.x;
    point.centerY = point.y;
    point.gx = point.x;
    point.gy = point.y;
    point.xAnchorOffset = 0;
    point.yAnchorOffset = 0;
    point._bumpPropertiesAdded = true;
    return this.hitTestCircle(c1, point, global);
  }
 


  circleRectangleCollision(
    c1, r1, bounce = false, global = false
  ) {

    if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1); 
    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 

    let region, collision, c1x, c1y, r1x, r1y;

    if (global) {
      c1x = c1.gx;
      c1y = c1.gy;
      r1x = r1.gx;
      r1y = r1.gy;
    } else {
      c1x = c1.x;
      c1y = c1.y;
      r1x = r1.x;
      r1y = r1.y;
    }

    if (c1y - c1.yAnchorOffset < r1y - Math.abs(r1.halfHeight) - r1.yAnchorOffset) {


      if (c1x - c1.xAnchorOffset < r1x - 1 - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "topLeft";
      } else if (c1x - c1.xAnchorOffset > r1x + 1 + Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "topRight";
      } else {
        region = "topMiddle";
      }
    }


    else if (c1y - c1.yAnchorOffset > r1y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) {


      if (c1x - c1.xAnchorOffset < r1x - 1 - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "bottomLeft";
      } else if (c1x - c1.xAnchorOffset > r1x + 1 + Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "bottomRight";
      } else {
        region = "bottomMiddle";
      }
    }


    else {
      if (c1x - c1.xAnchorOffset < r1x - Math.abs(r1.halfWidth) - r1.xAnchorOffset) {
        region = "leftMiddle";
      } else {
        region = "rightMiddle";
      }
    }


    if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

      collision = this.rectangleCollision(c1, r1, bounce, global);
    }

    else {
      let point = {};

      switch (region) {
        case "topLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
          break;

        case "topRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y - r1.yAnchorOffset;
          break;

        case "bottomLeft":
          point.x = r1x - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
          break;

        case "bottomRight":
          point.x = r1x + r1.width - r1.xAnchorOffset;
          point.y = r1y + r1.height - r1.yAnchorOffset;
      }

      collision = this.circlePointCollision(c1, point, bounce, global);
    }

    if (collision) {
      return region;
    } else {
      return collision;
    }
  }

 

  circlePointCollision(c1, point, bounce = false, global = false) {

    if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1); 


    point.diameter = 1;
    point.width = point.diameter;
    point.radius = 0.5;
    point.centerX = point.x;
    point.centerY = point.y;
    point.gx = point.x;
    point.gy = point.y;
    point.xAnchorOffset = 0;
    point.yAnchorOffset = 0;
    point._bumpPropertiesAdded = true;
    return this.circleCollision(c1, point, bounce, global);
  }



  bounceOffSurface(o, s) {

    if (!o._bumpPropertiesAdded) this.addCollisionProperties(o); 

    let dp1, dp2,
      p1 = {},
      p2 = {},
      bounce = {},
      mass = o.mass || 1;


    s.lx = s.y;
    s.ly = -s.x;

    s.magnitude = Math.sqrt(s.x * s.x + s.y * s.y);

    s.dx = s.x / s.magnitude;
    s.dy = s.y / s.magnitude;


    dp1 = o.vx * s.dx + o.vy * s.dy;

    p1.vx = dp1 * s.dx;
    p1.vy = dp1 * s.dy;

    dp2 = o.vx * (s.lx / s.magnitude) + o.vy * (s.ly / s.magnitude);

    p2.vx = dp2 * (s.lx / s.magnitude);
    p2.vy = dp2 * (s.ly / s.magnitude);

    p2.vx *= -1;
    p2.vy *= -1;

    bounce.x = p1.vx + p2.vx;
    bounce.y = p1.vy + p2.vy;


    o.vx = bounce.x / mass;
    o.vy = bounce.y / mass;
  }

 
  contain(sprite, container, bounce = false, extra = undefined) {

    if (!sprite._bumpPropertiesAdded) this.addCollisionProperties(sprite); 


    if (container.xAnchorOffset === undefined) container.xAnchorOffset = 0;
    if (container.yAnchorOffset === undefined) container.yAnchorOffset = 0;
    if (sprite.parent.gx === undefined) sprite.parent.gx = 0;
    if (sprite.parent.gy === undefined) sprite.parent.gy = 0;


    let collision = new Set();

    if (sprite.x - sprite.xAnchorOffset < container.x - sprite.parent.gx - container.xAnchorOffset) {

      if (bounce) sprite.vx *= -1;


      if (sprite.mass) sprite.vx /= sprite.mass;

      sprite.x = container.x - sprite.parent.gx - container.xAnchorOffset + sprite.xAnchorOffset;

      collision.add("left");
    }

    if (sprite.y - sprite.yAnchorOffset < container.y - sprite.parent.gy - container.yAnchorOffset) {
      if (bounce) sprite.vy *= -1;
      if (sprite.mass) sprite.vy /= sprite.mass;
      sprite.y = container.y - sprite.parent.gy - container.yAnchorOffset + sprite.yAnchorOffset;;
      collision.add("top");
    }

  
    if (sprite.x - sprite.xAnchorOffset + sprite.width > container.width - container.xAnchorOffset) {
      if (bounce) sprite.vx *= -1;
      if (sprite.mass) sprite.vx /= sprite.mass;
      sprite.x = container.width - sprite.width - container.xAnchorOffset + sprite.xAnchorOffset;
      collision.add("right");
    }

    if (sprite.y - sprite.yAnchorOffset + sprite.height > container.height - container.yAnchorOffset) {
      if (bounce) sprite.vy *= -1;
      if (sprite.mass) sprite.vy /= sprite.mass;
      sprite.y = container.height - sprite.height - container.yAnchorOffset + sprite.yAnchorOffset;
      collision.add("bottom");
    }

    if (collision.size === 0) collision = undefined;


    if (collision && extra) extra(collision);

    return collision;
  } 

  
  outsideBounds(s, bounds, extra) {

    let x = bounds.x,
        y = bounds.y,
        width = bounds.width,
        height = bounds.height;

  
    let collision = new Set();

    if (s.x < x - s.width) {
      collision.add("left");
    }
    if (s.y < y - s.height) {
      collision.add("top");
    }
    if (s.x > width + s.width) {
      collision.add("right");
    }
    if (s.y > height + s.height) {
      collision.add("bottom");
    }

    if (collision.size === 0) collision = undefined;


    if (collision && extra) extra(collision);

    return collision;
  }



  _getCenter(o, dimension, axis) {
    if (o.anchor !== undefined) {
      if (o.anchor[axis] !== 0) {
        return 0;
      } else {
        return dimension / 2;
      }
    } else {
      return dimension; 
    }
  }
  



  hit(a, b, react = false, bounce = false, global, extra = undefined) {

    let hitTestPoint = this.hitTestPoint.bind(this),
        hitTestRectangle = this.hitTestRectangle.bind(this),
        hitTestCircle = this.hitTestCircle.bind(this),
        movingCircleCollision = this.movingCircleCollision.bind(this),
        circleCollision = this.circleCollision.bind(this),
        hitTestCircleRectangle = this.hitTestCircleRectangle.bind(this),
        rectangleCollision = this.rectangleCollision.bind(this),
        circleRectangleCollision = this.circleRectangleCollision.bind(this);

    let collision,
      aIsASprite = a.parent !== undefined,
      bIsASprite = b.parent !== undefined;

    if (aIsASprite && b instanceof Array || bIsASprite && a instanceof Array) {
      spriteVsArray();
    } else {

      collision = findCollisionType(a, b);
      if (collision && extra) extra(collision);
    }


    return collision;

    function findCollisionType(a, b) {

      let aIsASprite = a.parent !== undefined;
      let bIsASprite = b.parent !== undefined;

      if (aIsASprite && bIsASprite) {
        if (a.diameter && b.diameter) {
          return circleVsCircle(a, b);
        } else if (a.diameter && !b.diameter) {
          return circleVsRectangle(a, b);
        } else {
          return rectangleVsRectangle(a, b);
        }
      }

      else if (bIsASprite && !(a.x === undefined) && !(a.y === undefined)) {
        return hitTestPoint(a, b);
      } else {
        throw new Error(`I'm sorry, ${a} and ${b} cannot be use together in a collision test.'`);
      }
    }

    function spriteVsArray() {
      if (a instanceof Array) {
        let [a, b] = [b, a];
      }
      for (let i = b.length - 1; i >= 0; i--) {
        let sprite = b[i];
        collision = findCollisionType(a, sprite);
        if (collision && extra) extra(collision, sprite);
      }
    }

    function circleVsCircle(a, b) {

      if (!react) {
        return hitTestCircle(a, b);
      }
      else {

        if (a.vx + a.vy !== 0 && b.vx + b.vy !== 0) {

          return movingCircleCollision(a, b, global);
        } else {
          return circleCollision(a, b, bounce, global);
        }
      }
    }

    function rectangleVsRectangle(a, b) {

      if (!react) {
        return hitTestRectangle(a, b, global);
      } else {
        return rectangleCollision(a, b, bounce, global);
      }
    }

    function circleVsRectangle(a, b) {

      if (!react) {
        return hitTestCircleRectangle(a, b, global);
      } else {
        return circleRectangleCollision(a, b, bounce, global);
      }
    }
  }
}