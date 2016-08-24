var keyboard = (function() {
  "use strict";

  var module = {};

  var LAYOUTS = {
    'piano': {
           'W': 1, 'E': 3,         'T': 6, 'Y': 8, 'U': 10,          'O': 13,
    'A': 0, 'S': 2, 'D': 4, 'F': 5, 'G': 7, 'H': 9, 'J': 11, 'K': 12, 'L': 14,
     'Z': 8,
    },

    'riemann': {
    '1':-36, '2':-29, '3':-22, '4':-15,'5':-8,'6':-1,'7':6,  '8':13, '9':20, '0':27,
     'Q':-32, 'W':-25, 'E':-18, 'R':-11,'T':-4,'Y':3, 'U':10, 'I':17, 'O':24, 'P':31,
      'A':-28, 'S':-21, 'D':-14, 'F':-7, 'G':0, 'H':7, 'J':14, 'K':21, 'L':28,
       'Z':-24, 'X':-17, 'C':-10, 'V':-3, 'B':4, 'N':11,'M':18
    },
  }

  var BASE_PITCH = {
    'piano': 60, // middle C
    'riemann': 72,
  };

  module.init = function(layout) {
    this.layout = layout;

    for (var l in LAYOUTS)
      charsToKeyCodes(LAYOUTS[l]);

    $(window).keydown(onKeyDown);
    $(window).keyup(onKeyUp);
  };

  var getPitchFromKeyboardEvent = function(event) {
    var note = BASE_PITCH[module.layout] + LAYOUTS[module.layout][event.which];

    if (isFinite(note) && !event.ctrlKey && !event.altKey && !event.metaKey)
      return note;
    else
      return null;
  };

  var getChannel = function() {
    var channel = Number($('#midi-channel').val());
    if (channel == -1)
      channel = 0;
    return channel;
  };


  var onKeyDown = function(event) {
    if (somethingHasFocus()) return;

    var note = getPitchFromKeyboardEvent(event);
    if (note != null) {
      tonnetz.noteOn(16, note);
      return false;
    }
  };

  var onKeyUp = function(event) {
    if (somethingHasFocus()) return;

    var note = getPitchFromKeyboardEvent(event);
    if (note != null) {
      tonnetz.noteOff(16, note);
      return false;
    }
  };

  var charsToKeyCodes = function(mapping) {
    // map letters
    var offset = 'A'.charCodeAt(0);
    for (var i = 0; i < 26; i++) {
      var c = String.fromCharCode(offset + i);
      if (c in mapping) {
        mapping[c.charCodeAt(0)] = mapping[c];
      }
    }

    // map numbers
    offset = '0'.charCodeAt(0);
    for (i = 0; i < 10; i++) {
      c = String.fromCharCode(offset + i);
      if (c in mapping) {
        mapping[c.charCodeAt(0)] = mapping[c];
      }
    }
  };

  return module;
})();
