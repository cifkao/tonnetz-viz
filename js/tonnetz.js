var tonnetz = (function() {
  "use strict";

  var module = {};

  var TONE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var STATE_OFF = 0,
      STATE_GHOST = 1,
      STATE_SUST = 2,
      STATE_ON = 3;
  var STATE_NAMES = ['OFF', 'GHOST', 'SUSTAIN', 'ON'];
  var LAYOUT_RIEMANN = 'riemann',
      LAYOUT_SONOME = 'sonome';

  var FILL = ['#ffffff', '#aeaeae', '#46629e', '#2c4885'];
  var STROKE = ['#bababa', '#bababa', '#0e1f5b', '#0e1f5b'];
  var FILL_MAJ     = '#faf7db',
      FILL_MIN     = '#eeebc9';

  var W,  // width
      H,  // height
      u;  // unit distance (distance between neighbors)

  module.density = 16;
  module.ghostDuration = 500;
  module.layout = LAYOUT_RIEMANN;

  var toneGrid = [];
  var tones = [];
  var pitches = {};

  var sustainEnabled = true,
      sustain = false;

  var SQRT_3 = Math.sqrt(3);


  module.init = function() {
    for (var i=0; i<12; i++) {
      tones.push({
        'pitch': i,
        'name': TONE_NAMES[i],
        'state': STATE_OFF,
        'count': 0,
        'released': null,       // the last time the note was on
        'cache': {}             // temporary data
      });
    }

    this.rebuild();
    window.onresize = function() { module.rebuild(); };
  };


  module.noteOn = function(pitch) {
    if (!(pitch in pitches)) {
      var i = pitch%12;
      tones[i].state = STATE_ON;
      tones[i].count++;
      pitches[pitch] = 1;
    }
    this.draw();
  };

  module.noteOff = function(pitch) {
    if (pitch in pitches) {
      var i = pitch%12;
      delete pitches[pitch];
      tones[i].count--;
      if (tones[i].count == 0) {
        if (sustainEnabled && sustain) {
          tones[i].state = STATE_SUST;
        } else {
          // change state to STATE_GHOST or STATE_OFF
          // depending on setting
          releaseTone(tones[i]);
        }
      }
      this.draw();
    }
  };

  module.allNotesOff = function() {
    pitches = {};
    for (var i=0; i<12; i++) {
      tones[i].count = 0;
      tones[i].state = STATE_OFF;
    }
    this.draw();
  };

  module.sustainOn = function() {
    sustain = true;
  };

  module.sustainOff = function() {
    sustain = false;

    for (var i=0; i<12; i++) {
      if (tones[i].state == STATE_SUST)
        releaseTone(tones[i]);
    }
    this.draw();
  };

  module.panic = function() {
    this.allNotesOff();
    this.sustainOff();
  };


  module.toggleSustainEnabled = function() {
    sustainEnabled = !sustainEnabled;
  };

  module.setDensity = function(density) {
    if (isFinite(density) && density >= 5 && density <= 50) {
      this.density = density;
      this.rebuild();
    }
  };

  module.setGhostDuration = function(duration) {
    if (isFinite(duration) && duration !== null && duration !== '') {
      duration = Number(duration);
      if (duration >= 0) {
        if (duration != this.ghostDuration) {
          this.ghostDuration = duration;
          this.draw();
        }
        return true;
      }
    }

    return false;
  };

  module.setLayout = function(layout) {
    this.layout = layout;
    this.rebuild();
  };


  var releaseTone = function(tone) {
    tone.release = new Date();
    if (module.ghostDuration > 0) {
      tone.state = STATE_GHOST;
      ghosts();
    } else {
      tone.state = STATE_OFF;
    }
  };


  var ghostsInterval = null;

  /**
   * Check for dead ghost tones and turn them off. Keep
   * checking using setInterval as long as there are
   * any ghost tones left.
   */
  var ghosts = function() {
    if (ghostsInterval === null) {
      ghostsInterval = setInterval(function() {
        var numAlive = 0, numDead = 0;
        var now = new Date();

        for (var i=0; i<12; i++) {
          if (tones[i].state == STATE_GHOST) {
            if (now - tones[i].release >= module.ghostDuration) {
              tones[i].state = STATE_OFF;
              numDead++;
            } else {
              numAlive++;
            }
          }
        }

        if (numAlive == 0) {
          clearInterval(ghostsInterval);
          ghostsInterval = null;
        }

        if (numDead>0)
          module.draw();
      }, Math.min(module.ghostDuration, 30));
    }
  };


  var drawTimeout = null;

  /**
   * Request a redraw, but do not draw immediately.
   * (Draw at most once every 30 ms.)
   */
  module.draw = function() {
    if (drawTimeout === null) {
      drawTimeout = setTimeout(drawNow, 30);
    }
  };

  var drawNow = function() {
    drawTimeout = null;

    var xUnit = u*Math.sqrt(3)/2;
    var uW = Math.ceil(Math.ceil(W/xUnit*2)/2);
    var uH = Math.ceil(H/u);

    var now = new Date();

    ctx.clearRect(0, 0, W, H);

    // Fill faces. Each vertex takes care of the two faces above it.
    for (var tone=0; tone<12; tone++) {
      var c = tones[tone].cache;

      var leftNeighbor = (tone+3)%12;
      var rightNeighbor = (tone+4)%12;
      var topNeighbor = (tone+7)%12;

      c.leftPos = getNeighborXYDiff(tone, leftNeighbor);
      c.rightPos = getNeighborXYDiff(tone, rightNeighbor);
      c.topPos = getNeighborXYDiff(tone, topNeighbor);

      c.leftState = tones[leftNeighbor].state;
      c.rightState = tones[rightNeighbor].state;
      c.topState = tones[topNeighbor].state;

      var thisOn = (tones[tone].state != STATE_OFF);
      var leftOn = (c.leftState != STATE_OFF);
      var rightOn = (c.rightState != STATE_OFF);
      var topOn = (c.topState != STATE_OFF);

      // Fill faces
      for (var i=0; i<toneGrid[tone].length; i++) {
        setTranslate(ctx, toneGrid[tone][i].x, toneGrid[tone][i].y);

        var minorOn = false, majorOn = false;
        if (thisOn && topOn) {
          if (leftOn) { // left face (minor triad)
            minorOn = true;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(c.topPos.x, c.topPos.y);
            ctx.lineTo(c.leftPos.x, c.leftPos.y);
            ctx.closePath();
            ctx.fillStyle = FILL_MIN;
            ctx.fill();
          }
          if (rightOn) { // right face (major triad)
            majorOn = true;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(c.topPos.x, c.topPos.y);
            ctx.lineTo(c.rightPos.x, c.rightPos.y);
            ctx.closePath();
            ctx.fillStyle = FILL_MAJ;
            ctx.fill();
          }
        }

        var $minorTriadLabel = $(toneGrid[tone][i].minorTriadLabel);
        var $majorTriadLabel = $(toneGrid[tone][i].majorTriadLabel);

        if (minorOn) {
          $minorTriadLabel.addClass('state-ON');
        } else {
          $minorTriadLabel.removeClass('state-ON');
        }

        if (majorOn) {
          $majorTriadLabel.addClass('state-ON');
        } else {
          $majorTriadLabel.removeClass('state-ON');
        }
      }
    }

    // Draw edges. Each vertex takes care of the three upward edges.
    for (var tone=0; tone<12; tone++) {
      var c = tones[tone].cache;
      var state = tones[tone].state;

      for (var i=0; i<toneGrid[tone].length; i++) {
        setTranslate(ctx, toneGrid[tone][i].x, toneGrid[tone][i].y);

        drawEdge(ctx, c.topPos, state, c.topState);
        drawEdge(ctx, c.leftPos, state, c.leftState);
        drawEdge(ctx, c.rightPos, state, c.rightState);
      }
    }

    setTranslate(ctx, 0, 0);

    // Draw vertices.
    for (var tone=0; tone<12; tone++) {
      for (var i=0; i<toneGrid[tone].length; i++) {
        var x = toneGrid[tone][i].x, y = toneGrid[tone][i].y;
        ctx.beginPath();
        ctx.arc(x, y, u/5, 0, Math.PI * 2, false);
        ctx.closePath();

        ctx.fillStyle = FILL[tones[tone].state];
        ctx.strokeStyle = STROKE[tones[tone].state];
        toneGrid[tone][i].label.className = 'state-' + STATE_NAMES[tones[tone].state];

        if (tones[tone].state == STATE_OFF) {
          ctx.lineWidth = 1;
        } else {
          ctx.lineWidth = 2;
        }

        ctx.fill();
        ctx.stroke();
      }
    }
  };

  var setTranslate = function(ctx, x, y) {
    ctx.setTransform(1, 0, 0, 1, x, y);
  };

  var drawEdge = function(ctx, endpoint, state1, state2) {
    var state = Math.min(state1, state2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endpoint.x, endpoint.y);
    ctx.strokeStyle = STROKE[state];
    ctx.lineWidth = (state != STATE_OFF) ? 1.5 : 1;
    ctx.stroke();
  };

  var getNeighborXYDiff = function(t1, t2){
    var diff = (t2-t1+12)%12;

    var result;
    switch (diff){
      case 3: result = {x: -0.5*SQRT_3*u, y: -0.5*u}; break;
      case 7: result = {x: 0, y: -1*u}; break;
      case 4: result = {x: 0.5*SQRT_3*u, y: -0.5*u}; break;
      case 9: result = {x: 0.5*SQRT_3*u, y: 0.5*u}; break;
      case 5: result = {x: 0, y: 1*u}; break;
      case 8: result = {x: -0.5*SQRT_3*u, y: 0.5*u}; break;
    }

    if (module.layout == LAYOUT_RIEMANN) {
      result = {x: -result.y, y: result.x};
    }

    return result;
  };

  var createLabel = function(text, x, y) {
    var label = document.createElement('div');
    var inner = document.createElement('div');
    inner.appendChild(document.createTextNode(text));
    label.appendChild(inner);
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    return label;
  };

  var addNode = function(tone, x, y) {
    if (x < -u || y < -u || x > W+u || y > H+u) {
      return;
    }

    var name = tones[tone].name;
    var node = {'x': x, 'y': y};

    // Create the note label.
    node.label = createLabel(name, x, y);
    noteLabels.appendChild(node.label);

    // Create labels for the two triads above this node.
    if (module.layout == LAYOUT_RIEMANN) {
      var yUnit = u * SQRT_3;
      node.majorTriadLabel = createLabel(name.toUpperCase(), x + u/2, y + yUnit/6);
      node.minorTriadLabel = createLabel(name.toLowerCase(), x + u/2, y - yUnit/6);
    } else if (module.layout == LAYOUT_SONOME) {
      var xUnit = u * SQRT_3;
      node.majorTriadLabel = createLabel(name.toUpperCase(), x + xUnit/6, y - u/2);
      node.minorTriadLabel = createLabel(name.toLowerCase(), x - xUnit/6, y - u/2);
    }
    node.majorTriadLabel.className = 'major';
    node.minorTriadLabel.className = 'minor';
    triadLabels.appendChild(node.majorTriadLabel);
    triadLabels.appendChild(node.minorTriadLabel);

    // Add the node to the grid.
    toneGrid[tone].push(node);
  };

  module.rebuild = function() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    u = (W+H)/this.density;

    for (var i=0; i<12; i++) {
      toneGrid[i] = [];
    }

    $(noteLabels).empty();
    $(triadLabels).empty();

    $(noteLabels).css('font-size', u * 0.17 + 'px');
    $(triadLabels).css('font-size', u * 0.17 + 'px');

    if (this.layout == LAYOUT_RIEMANN) {
      var yUnit = u * SQRT_3;
      var uW = Math.ceil(W/u);
      var uH = Math.ceil(H/yUnit);
      for(var j=-Math.floor(uW/2+1); j<=Math.floor(uW/2+1); j++){
        for(var i=-Math.floor(uH/2+1); i<=Math.floor(uH/2+1); i++){
          addNode(((i-7*j)%12 + 12)%12,
                  W/2 - j*u,
                  H/2 + i*yUnit);

          addNode(((i-7*j)%12 + 12 + 4)%12,
                  W/2 - (j - 0.5)*u,
                  H/2 + (i + 0.5)*yUnit);
        }
      }
    } else if (this.layout == LAYOUT_SONOME) {
      var xUnit = u * SQRT_3;
      var uW = Math.ceil(W/xUnit);
      var uH = Math.ceil(H/u);

      for (var j=-Math.floor(uH/2+1); j<=Math.floor(uH/2+1); j++) {
        for (var i=-Math.floor(uW/2+1); i<=Math.floor(uW/2+1); i++) {
          addNode(((i-7*j)%12 + 12)%12,
                  W/2 + i*xUnit,
                  H/2 + j*u);

          addNode(((i-7*j)%12 + 12 + 4)%12,
                  W/2 + (i + 0.5)*xUnit,
                  H/2 + (j - 0.5)*u);
        }
      }
    }

    drawNow();
  };

  return module;
})();
