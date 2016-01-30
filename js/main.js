var audioCtx, midi, port = null;

$(function(){
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  noteLabels = document.getElementById("note-labels");

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  context = new AudioContext();
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
  } else {
    showError('MIDI support is not present in your browser. You can still use ' +
              'your computer\'s keyboard.');
  }


  $(window).keydown(onKeyDown);
  $(window).keyup(onKeyUp);


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

  $('#panic').click(function() { allNotesOff(); sustainOff(); });
  $('#enable-sustain').click(toggleSustainEnabled);
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
