var midi = (function() {
  "use strict";

  var module = {};

  var midiAccess, port = null, channel = -1;


  module.init = function() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
    } else {
      showError('MIDI support is not present in your browser. You can still use ' +
                'your computer\'s keyboard.');
    }
  };

  var onMIDIInit = function(mAccess) {
    midiAccess = mAccess;
    midiAccess.inputs.forEach(addMIDIPort);
    midiAccess.addEventListener('statechange', MIDIConnectionEventListener);
  };

  var onMIDIReject = function(err) {
    showError('Failed to obtain access to MIDI.');
  };

  var MIDIConnectionEventListener = function(event) {
    var port = event.port;
    if (port.type != 'input') return;

    if (port.state == 'disconnected')
      removeMIDIPort(port);
    else if (port.state == 'connected')
      addMIDIPort(port);
  };

  var removeMIDIPort = function(port) {
      port.removeEventListener('midimessage', MIDIMessageEventListener); 
      tonnetz.panic();
  };

  var addMIDIPort = function(port) {
      port.addEventListener('midimessage', MIDIMessageEventListener);
      tonnetz.panic();
  };

  var MIDI_NOTE_ON           = 0x90,
      MIDI_NOTE_OFF          = 0x80,
      MIDI_CONTROL_CHANGE    = 0xB0,

      MIDI_CC_SUSTAIN             = 64,
      MIDI_CC_ALL_CONTROLLERS_OFF = 121,
      MIDI_CC_ALL_NOTES_OFF       = 123;

  var ALL_CHANNELS = -1,
      ALL_EXCEPT_DRUMS = -10;

  var MIDIMessageEventListener = function(event) {
    var msg = event.data;
    var msgType = msg[0] & 0xF0;
    var msgChannel = msg[0] & 0x0F;

    if ((channel >= 0 && msgChannel != channel) ||
        (channel == ALL_EXCEPT_DRUMS && msgChannel == 9))
      return;

    switch (msgType) {
      case MIDI_NOTE_ON:
        if (msg[2] != 0) {
          tonnetz.noteOn(msgChannel, msg[1]);
          break;
        }
        // velocity == 0:  note off
      case MIDI_NOTE_OFF:
        tonnetz.noteOff(msgChannel, msg[1]);
        break;
      case MIDI_CONTROL_CHANGE:
        switch (msg[1]) {
          case MIDI_CC_SUSTAIN:
            if (msg[2] >= 64) {
              tonnetz.sustainOn(msgChannel);
            } else {
              tonnetz.sustainOff(msgChannel);
            }
            break;
          case MIDI_CC_ALL_CONTROLLERS_OFF:
            tonnetz.sustainOff(msgChannel);
            break;
          case MIDI_CC_ALL_NOTES_OFF:
            tonnetz.allNotesOff(msgChannel);
            break;
        }
        break;
    }
  };

  return module;
})();
