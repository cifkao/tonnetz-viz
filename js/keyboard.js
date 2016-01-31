var KEYBOARD_NOTES = {
  /* A */ 65: 0,
  /* W */ 87: 1,
  /* S */ 83: 2,
  /* E */ 69: 3,
  /* D */ 68: 4,
  /* F */ 70: 5,
  /* T */ 84: 6,
  /* G */ 71: 7,
  /* Y */ 89: 8,
  /* Z */ 90: 8,
  /* H */ 72: 9,
  /* U */ 85: 10,
  /* J */ 74: 11,
  /* K */ 75: 12,
  /* O */ 79: 13,
  /* L */ 76: 14,
};

var KEYBOARD_BASE_PITCH = 60;  // middle C


function getPitchFromKeyboardEvent(event) {
  var note = KEYBOARD_BASE_PITCH + KEYBOARD_NOTES[event.which];

  if (isFinite(note) && !event.ctrlKey && !event.altKey && !event.metaKey)
    return note;
  else
    return null;
}

function onKeyDown(event) {
  if (somethingHasFocus()) return;

  var note = getPitchFromKeyboardEvent(event);
  if (note != null) {
    noteOn(note);
  }
}

function onKeyUp(event) {
  if (somethingHasFocus()) return;

  var note = getPitchFromKeyboardEvent(event);
  if (note != null) {
    noteOff(note);
  }
}
