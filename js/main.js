var audioCtx, midi, port = null;

$(function(){
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  noteLabels = document.getElementById("note-labels");

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  context = new AudioContext();
  if (navigator.requestMIDIAccess)
    navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
  else
    showError('MIDI support is not present in your browser.');


  init();
  draw();
  window.onresize = function() { init(); draw(); };

  $('#navbar a[data-toggle="tab"]').on('shown.bs.tab', function() {
    if ($(this).attr('href') != "#")
      $('#tabs').collapse('show');
  });

  $('#navbar a[data-toggle="tab"]').click(function() {
    if ($(this).parent().hasClass('active')) {
      $('#tabs').collapse('hide');
    }
  });

  $('#tabs').on('hidden.bs.collapse', function() { noTab(); });
  $('#tonnetz').click(function() { $('#tabs').collapse('hide'); });

  $('#panic').click(function() { allNotesOff(); });
  $('#show-note-names').click(function() { $(noteLabels).toggle(); });
});

function noTab() {
  $('#navbar a[data-toggle="tab"][href="#"]').tab('show');
}

function showAlert(text, type) {
  var a = $('<div class="alert alert-'+type+' alert-dismissible fade" role="alert">' +
           '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
           '<span aria-hidden="true">×</span></button></div>');
  a.append(document.createTextNode(text));
  $('#messages').append(a);
  a.addClass('in');

  var numMessages = $('#messages').children().length; 
  if (numMessages > 3) {
    $('#messages').children().slice(0, numMessages-3).alert('close');
  }
}

function showWarning(text) { showAlert(text, 'warning'); }
function showError(text) { showAlert(text, 'danger'); }
function showSuccess(text) { showAlert(text, 'success'); }


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
    MIDI_CC_SUSTAIN        = 0x40,
    MIDI_CC_ALL_NOTES_OFF  = 0x7B;

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
        case MIDI_CC_ALL_NOTES_OFF:
          allNotesOff();
          break;
        case MIDI_CC_SUSTAIN:
          if (msg[2]>=64) {
            //sustainOn();
          } else {
            //sustainOff();
          }
          break;
      }
      break;
  }
}
