function onMIDIInit(midiAccess) {
  // Get last used port ID from local storage.
  var preferredPort = null;
  if(typeof(Storage) !== 'undefined') {
    preferredPort = localStorage.getItem('midiPort');
  }

  // Add all MIDI ports to the dropdown box.
  midi = midiAccess;
  midi.inputs.forEach(function(port) {
    addMIDIPort(port);
    if (port.id == preferredPort) {
      $('#midi-port').val(port.id);
    }
  });

  midi.addEventListener('statechange', MIDIConnectionEventListener);
  $('#midi-port').change(onMIDIPortChange);
  onMIDIPortChange();
}

function onMIDIReject(err) {
  showError('Failed to obtain access to MIDI.');
}

function onMIDIPortChange() {
  var id = $('#midi-port').val();
  var currentId = (port != null ? port.id : null);

  if (id != currentId) {
    if (port != null) {
      port.removeEventListener('midimessage', MIDIMessageEventListener); 
      panic();
    }

    port = midi.inputs.get(id);

    if (port != null) {
      port.addEventListener('midimessage', MIDIMessageEventListener);
      console.log('Listening on port ' + port.name);

      if(typeof(Storage) !== 'undefined') {
        localStorage.setItem('midiPort', port.id);
      }
    }
  }
}

function MIDIConnectionEventListener(event) {
  var port = event.port;
  if (port.type != 'input') return;

  var portOption = $('#midi-port option').filter(function() {
    return $(this).attr('value') == port.id;
  });

  if (portOption.length > 0 && port.state == 'disconnected') {
    showWarning(port.name + ' was disconnected.');

    portOption.remove();
    onMIDIPortChange();
  } else if (portOption.length == 0 && port.state == 'connected') {
    showSuccess(port.name + ' is connected.');

    addMIDIPort(port);
    onMIDIPortChange();
  }
}

function addMIDIPort(port) {
  $('#midi-port')
    .append($("<option></option>")
    .attr("value", port.id)
    .text(port.name));
}

var MIDI_NOTE_ON           = 0x90,
    MIDI_NOTE_OFF          = 0x80,
    MIDI_CONTROL_CHANGE    = 0xB0,

    MIDI_CC_SUSTAIN             = 64,
    MIDI_CC_ALL_CONTROLLERS_OFF = 121,
    MIDI_CC_ALL_NOTES_OFF       = 123;

function MIDIMessageEventListener(event) {
  var msg = event.data;
  var msgType = msg[0] & 0xF0;
  var channel = msg[0] & 0x0F;

  switch (msgType) {
    case MIDI_NOTE_ON:
      if (msg[2] != 0) {
        noteOn(msg[1]);
        break;
      }
      // velocity == 0:  note off
    case MIDI_NOTE_OFF:
      noteOff(msg[1]);
      break;
    case MIDI_CONTROL_CHANGE:
      switch (msg[1]) {
        case MIDI_CC_SUSTAIN:
          if (msg[2] >= 64) {
            sustainOn();
          } else {
            sustainOff();
          }
          break;
        case MIDI_CC_ALL_CONTROLLERS_OFF:
          sustainOff();
          break;
        case MIDI_CC_ALL_NOTES_OFF:
          allNotesOff();
          break;
      }
      break;
  }
}
