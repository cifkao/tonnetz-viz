var audio = (function() {
  "use strict";

  var Note = function(ctx, type, frequency, attack, release, output) {
    this.oscillator = ctx.createOscillator();
    this.oscillator.type = type;
    this.oscillator.frequency.value = frequency;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.oscillator.connect(this.gain);
    this.gain.connect(output);

    this.ctx = ctx;
    this.attack = attack;
    this.release = release;
  };

  Note.prototype.start = function() {
    this.oscillator.start();
    this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + this.attack);
  };

  Note.prototype.stop = function() {
    this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.release);
    var self = this;
    setTimeout(function() {
      self.gain.disconnect();
      self.oscillator.stop();
      self.oscillator.disconnect();
    }, Math.floor(this.release * 1000));
  };


  var module = {};

  var audioCtx, notes, gain;
  var enabled = false;
  var synthType;
  var tuning = "et";
  var base_tuning = 36;

  var CHANNELS = 17;
  var ATTACK = 0.05;
  var RELEASE = 0.1;


  module.init = function() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
      gain = audioCtx.createGain();
      gain.connect(audioCtx.destination);
    } else {
      // display an alert
    }

    notes = $.map(Array(CHANNELS), function() { return {}; });

    $('#sound-on').click(function() {
      enabled = !enabled;
      $(this).next('i').add('nav a[href="#sound"] i.fa')
        .toggleClass('fa-volume-off fa-volume-up');
    });

    $('#synth-type').change(function() {
      synthType = $(this).val();
    }).change();
    
    $('#tuning').change(function() {
      tuning = $(this).val();
    }).change();

    $('#base_tuning').change(function() {
      base_tuning = $(this).val();
    }).change();

    $('#gain').on('input change propertychange paste', function() {
      gain.gain.value = Math.min(1, Math.max(Number($(this).val()), 0));
    }).change();
  };

  module.noteOn = function(channel, pitch) {
    if (!audioCtx || !enabled) return;

    if (!(pitch in notes[channel])) {
      notes[channel][pitch] =
        new Note(audioCtx, synthType, pitchToFrequency(pitch),
                 ATTACK, RELEASE, gain);
      notes[channel][pitch].start();
    }
  };

  module.noteOff = function(channel, pitch) {
    if (!audioCtx) return;

    if (pitch in notes[channel]) {
      notes[channel][pitch].stop();
      delete notes[channel][pitch];
    }
  };

  module.allNotesOff = function(channel) {
    for (var i=0; i<CHANNELS; i++) {
      for (var pitch in notes[channel]) {
        module.noteOff(channel, pitch);
      }
    }
  };

  var pitchToFrequency = function(pitch) {
    if (tuning == "et") {
      return Math.pow(2, (pitch - 69)/12) * 440;
    } else if (tuning == "pyth") {
	var tuned_freq = Math.pow(2, (base_tuning - 69)/12) * 440;
    
	var ratios = new Array(1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128);

	var i;
	i = (pitch-base_tuning)%12;
	var oct = Math.floor((pitch-base_tuning)/12);

      return Math.pow(2, oct) * ratios[i] * tuned_freq;
    } else {
      var tuned_freq = Math.pow(2, (base_tuning - 69)/12) * 440;
    
      var ratios = new Array(1, 25/24, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8);

      var i;
      i = (pitch-base_tuning)%12;
      var oct = Math.floor((pitch-base_tuning)/12);

      return Math.pow(2, oct) * ratios[i] * tuned_freq;
    }
  };

  return module;
})();
