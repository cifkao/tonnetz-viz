var GHOST_DURATION = 500;
var DENSITY = 16;

var FILL_OFF    = '#ffffff';
var FILL_ON     = '#3b5998';
var FILL_SUST   = '#3b5998';
var FILL_GHOST  = '#3b5998';
var STROKE_OFF  = '#c0c0c0';
var STROKE_ON   = '#0e1f5b';
var FILL_MAJ    = '#faf7db';
var FILL_MIN    = '#eeebc9';

var canvas, ctx;
var W,  // width
    H,  // height
    u;  // unit distance (distance between neighbors)
var noteLabels;
var toneGrid = [];
var tones = [];
var pitches = {};

var TONE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
var STATE_OFF = 'OFF',
    STATE_ON = 'ON',
    STATE_SUST = 'SUSTAIN',
    STATE_GHOST = 'GHOST';

var SQRT_3 = Math.sqrt(3);


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



function noteOn(pitch) {
  if (!(pitch in pitches)) {
    var i = pitch%12;
    tones[i].state = STATE_ON;
    tones[i].count++;
    pitches[pitch] = 1;
  }
  draw();
}

function noteOff(pitch) {
  if (pitch in pitches) {
    var i = pitch%12;
    delete pitches[pitch];
    tones[i].count--;
    if (tones[i].count == 0) {
      tones[i].release = new Date();
      if (GHOST_DURATION > 0) {
        tones[i].state = STATE_GHOST;
        checkGhosts();
      } else {
        tones[i].state = STATE_OFF;
      }
    }
  }
  draw();
}

function allNotesOff() {
  pitches = {};
  for (var i=0; i<12; i++) {
    tones[i].count = 0;
    tones[i].state = STATE_OFF;
  }
  draw();
}


var ghostsInterval = null;

/**
 * Check for dead ghost tones and turn them off. Keep
 * checking using setInterval as long as there are
 * any ghost tones left.
 */
function checkGhosts() {
  var numAlive = 0, numDead = 0;
  var now = new Date();

  for (var i=0; i<12; i++) {
    if (tones[i].state == STATE_GHOST) {
      if (now - tones[i].release >= GHOST_DURATION) {
        tones[i].state = STATE_OFF;
        numDead++;
      } else {
        numAlive++;
      }
    }
  }

  if (numAlive>0) {
    if (ghostsInterval == null)
      ghostsInterval = setInterval(checkGhosts, 50);
  } else if (ghostsInterval != null) {
    clearInterval(ghostsInterval);
    ghostsInterval = null;
  }

  if (numDead>0)
    draw();
}


function draw() {
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

    c.thisOn = (tones[tone].state != STATE_OFF);
    c.leftOn = (tones[leftNeighbor].state != STATE_OFF);
    c.rightOn = (tones[rightNeighbor].state != STATE_OFF);
    c.topOn = (tones[topNeighbor].state != STATE_OFF);

    // Fill faces
    for (var i=0; i<toneGrid[tone].length; i++) {
      setTranslate(ctx, toneGrid[tone][i].x, toneGrid[tone][i].y);

      var minorOn = false, majorOn = false;
      if (c.thisOn && c.topOn) {
        if (c.leftOn) { // left face (minor triad)
          minorOn = true;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(c.topPos.x, c.topPos.y);
          ctx.lineTo(c.leftPos.x, c.leftPos.y);
          ctx.closePath();
          ctx.fillStyle = FILL_MIN;
          ctx.fill();
        }
        if (c.rightOn) { // right face (major triad)
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
    }
  }

  // Draw edges. Each vertex takes care of the three upward edges.
  for (var tone=0; tone<12; tone++) {
    var c = tones[tone].cache;

    for (var i=0; i<toneGrid[tone].length; i++) {
      setTranslate(ctx, toneGrid[tone][i].x, toneGrid[tone][i].y);

      drawEdge(ctx, c.topPos, c.thisOn && c.topOn);
      drawEdge(ctx, c.leftPos, c.thisOn && c.leftOn);
      drawEdge(ctx, c.rightPos, c.thisOn && c.rightOn);
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

      ctx.strokeStyle = STROKE_ON;
      ctx.lineWidth = 1.5;

      if (tones[tone].state == STATE_ON) {
        ctx.fillStyle = FILL_ON;
        toneGrid[tone][i].label.className = 'active';
      } else if (tones[tone].state == STATE_GHOST) {
        ctx.fillStyle = FILL_GHOST;
        toneGrid[tone][i].label.className = 'active';
      } else {
        ctx.fillStyle = FILL_OFF;
        ctx.strokeStyle = STROKE_OFF;
        ctx.lineWidth = 1;
        toneGrid[tone][i].label.className = '';
      }

      ctx.fill();
      ctx.stroke();
    }
  }
}

function setTranslate(ctx, x, y) {
  ctx.setTransform(1, 0, 0, 1, x, y);
}

function drawEdge(ctx, endpoint, on) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(endpoint.x, endpoint.y);
  ctx.strokeStyle = on ? STROKE_ON : STROKE_OFF;
  ctx.lineWidth = on ? 1.5 : 1;
  ctx.stroke();
}

function getNeighborXYDiff(t1, t2){
  var diff = (t2-t1+12)%12; 
  switch(diff){
    case 3: return {x: -.5*SQRT_3*u, y: -.5*u};
    case 7: return {x: 0, y: -1*u};
    case 4: return {x: .5*SQRT_3*u, y: -.5*u};
    case 9: return {x: .5*SQRT_3*u, y: .5*u};
    case 5: return {x: 0, y: 1*u};
    case 8: return {x: -.5*SQRT_3*u, y: .5*u};
  }
}

function addNode(tone, x, y) {
  if (x < -u || y < -u || x > W+u || y > H+u) {
    return;
  }

  var label = document.createElement('div');
  var inner = document.createElement('div');
  inner.appendChild(document.createTextNode(tones[tone].name));
  label.appendChild(inner);
  label.style.left = x + 'px';
  label.style.top = y + 'px';
  noteLabels.appendChild(label);

  toneGrid[tone].push({'x': x, 'y': y, 'label': label});
}

function init() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  u = (W+H)/DENSITY;

  for (var i=0; i<12; i++) {
    toneGrid[i] = [];
  }

  $(noteLabels).empty();

  noteLabels.style.fontSize = u * 0.14 + "px";

  var xUnit = u*Math.sqrt(3);
  var uW = Math.ceil(W/xUnit);
  var uH = Math.ceil(H/u);
  for (var j=-Math.floor(uH/2+1); j<=Math.floor(uH/2+1); j++) {
    for (var i=-Math.floor(uW/2+1); i<=Math.floor(uW/2+1); i++) {
      addNode(((i-7*j)%12 + 12)%12, W/2+i*xUnit, H/2+j*u);
      addNode(((i-7*j)%12 + 12 + 4)%12, W/2+(i+1/2)*xUnit, H/2+(j-1/2)*u);
    }
  }
}
