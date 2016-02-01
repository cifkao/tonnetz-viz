var canvas, ctx, noteLabels, triadLabels;

$(function(){
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  noteLabels = document.getElementById("note-labels");
  triadLabels = document.getElementById("triad-labels");
  $(triadLabels).hide();

  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
  } else {
    showError('MIDI support is not present in your browser. You can still use ' +
              'your computer\'s keyboard.');
  }


  $(window).keydown(onKeyDown);
  $(window).keyup(onKeyUp);


  init();
  window.onresize = init;

  $('#tonnetz').mousewheel(function(event) {
    setDensity(density - event.deltaY);
    return false;
  });
  $(window).keypress(function(event) {
    if (somethingHasFocus()) return;

    var c = String.fromCharCode(event.which);
    if (c == '+') {
      setDensity(density - 2);
    } else if (c == '-') {
      setDensity(density + 2);
    }
  });

  $('#navbar a[data-toggle="tab"]').on('shown.bs.tab', function() {
    if ($(this).attr('href') != "#")
      $('#tabs').collapse('show');
      collapseNav();
  });

  $('#navbar a[data-toggle="tab"]').click(function() {
    if ($(this).parent().hasClass('active')) {
      $('#tabs').collapse('hide');
    }
  });

  $('#tabs').on('hidden.bs.collapse', noTab);
  $('#tonnetz').click(collapseNavAndTabs);
  $('.navbar-brand').click(collapseNavAndTabs);

  $('#panic').click(panic);
  $('#enable-sustain').click(toggleSustainEnabled);
  $('#show-note-names').click(function() { $(noteLabels).toggle(); });
  $('#show-triad-names').click(function() { $(triadLabels).toggle(); });
  $('#ghost-duration').on('input change propertychange paste', function() {
    if(!setGhostDuration($(this).val())) {
      $(this).closest('.form-group').addClass('has-error');
    } else {
      $(this).closest('.form-group').removeClass('has-error');
    }
  });

  $('[data-toggle="tooltip"]').tooltip();
});

function collapseNav() {
  if($('.navbar-toggle').is(':visible') && $('.navbar-collapse').hasClass('in')) {
    $('.navbar-toggle').click();
  }
}

function collapseNavAndTabs() {
  $('#tabs').collapse('hide');
  collapseNav();
}

function noTab() {
  $('#dummy-tab').tab('show');
}

function somethingHasFocus() {
  return $(':focus').is('input, select, button');
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
