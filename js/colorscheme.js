var colorscheme = (function() {
  "use strict";

  var module = {};

  var STATE_NAMES = ['OFF', 'GHOST', 'SUSTAIN', 'ON'];

  module.scheme = null;

  var schemes = {};
  var customSchemes = {};
  var customCounter;
  var editor = null;

  module.init = function(schemeName) {
    loadCustomSchemes();

    this.setScheme(schemeName);

    $('#color-scheme').change(function() {
      module.setScheme($('#color-scheme').val());
      tonnetz.draw(true);
    });

    editor = new JSONEditor(document.getElementById('scheme-editor-holder'), {
      schema: jsonSchema,
      theme: 'bootstrap3',
      iconlib: 'fontawesome4',
      object_layout: 'grid',
      disable_edit_json: true,
      disable_properties: true
    });

    $('#clone-scheme').click(function(event) {
      event.preventDefault();

      customCounter++;

      // clone the current scheme and add it with a new name
      var name = 'custom' + customCounter;
      var data = $.extend(true, {}, module.scheme.data,
        {'name': 'Custom'});
      module.addScheme(name, data);
      $('#color-scheme').val(name).change();

      showEditor();
    });

    $('#edit-scheme').click(function(event) {
      event.preventDefault();
      showEditor();
    });

    $('#delete-scheme').click(function(event) {
      event.preventDefault();
      deleteScheme();
    });

    $('#scheme-github').click(function(event) {
      event.preventDefault();
      addSchemeOnGitHub();
    });

    $('#save-scheme').click(saveScheme);
  };

  /**
   * Add or replace a color scheme.
   */
  module.addScheme = function(name, data, custom) {
    var displayName = data['name'];

    if (schemes[name]) {  // Replacing an existing scheme
      // Remove old stylesheet
      $(schemes[name].stylesheet.ownerNode).remove();

      // Change option text
      $('#color-scheme option')
        .filter(function() { return $(this).attr('value') == name; })
        .text(displayName);
    } else {
      $('#color-scheme')
        .append($('<option></option>')
        .attr('value', name)
        .text(displayName));
    }

    schemes[name] = {
      'data': data,
      'name': name,
      'stylesheet': addStylesheet(data)
    };
  };

  module.setScheme = function(name) {
    this.scheme = schemes[name];
    var data = this.scheme.data;

    this.stroke = [];
    this.fill = [];
    for (var i = 0; i < STATE_NAMES.length; i++) {
      this.stroke.push(data['nodes'][STATE_NAMES[i]]['stroke']);
      this.fill.push(data['nodes'][STATE_NAMES[i]]['fill']);
    }

    this.minorFill = data['faces']['minor']['fill'];
    this.majorFill = data['faces']['major']['fill'];

    var custom = name.startsWith('custom');
    $('#edit-scheme').parent()
      .add($('#scheme-github').parent())
      .toggle(custom);
    $('#clone-scheme span').toggle(!custom);
  };

  /**
   * Called by `tonnetz` before drawing.
   */
  module.update = function() {
    this.scheme.stylesheet.disabled = false;

    for (name in schemes) {
      if (name != this.scheme.name)
        schemes[name].stylesheet.disabled = true;
    }
  };

  var showEditor = function() {
    editor.setValue(module.scheme.data);

    //collapseNavAndTabs();
    $('#scheme-editor').modal('show');
  };

  var saveScheme = function() {
    var name = module.scheme.name;

    customSchemes[name] = editor.getValue();
    module.addScheme(name, customSchemes[name]);
    module.setScheme(name);
    tonnetz.draw(true);

    storeCustomSchemes();

    $('#scheme-editor').modal('hide');
  };

  var deleteScheme = function() {
    var name = module.scheme.name;

    $(module.scheme.stylesheet.ownerNode).remove();
    delete schemes[name];
    delete customSchemes[name];
    var $option = $('#color-scheme option')
        .filter(function() { return $(this).attr('value') == name; });
    $('#color-scheme').val($option.prev().attr('value'));
    $option.remove();
    $('#color-scheme').change();

    storeCustomSchemes();
  };

  var addSchemeOnGitHub = function() {
    var scheme = $.extend({}, module.scheme.data);
    scheme['name'] = scheme['name'].trim();

    var commitMessage = 'Add the \'' + scheme['name'] + '\' color scheme';

    if(scheme['name'].toLowerCase() == 'custom' || scheme['name'].length == 0) {
      scheme['name'] = 'PLEASE GIVE ME A NAME';
      commitMessage = 'Add a new color scheme';
    }

    // Create a filename for this color scheme
    var name = scheme['name']
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/-$/g, '')
      .replace(/^-/g, '')
      .toLowerCase();

    // Generate the script contents
    var contents = 'colorscheme.addScheme("' + name + '", ' +
        JSON.stringify(scheme, null, 2) +
        ');';

    // Open the 'New file' page on GitHub
    window.open('https://github.com/cifkao/tonnetz-viz/new/master/color-schemes/' +
        '?filename=color-schemes/' + name + '.js' +
        '&value=' + encodeURIComponent(contents) +
        '&message=' + encodeURIComponent(commitMessage)
    );
  };

  var addStylesheet = function(scheme) {
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    var sheet = style.sheet || style.styleSheet;

    sheet.insertRule('#tonnetz { background: ' + scheme['background'] + '}', 0);

    $.each(STATE_NAMES, function(i, state) {
      sheet.insertRule('#note-labels .state-' + state + ' { color: ' +
        scheme['nodes'][state]['label'] + ' }', 0);
    });

    $.each(['minor', 'major'], function(i, type) {
      sheet.insertRule('#triad-labels .' + type + ' { color: ' +
        scheme['faces'][type]['label-off'] + '}', 0);
      sheet.insertRule('#triad-labels .' + type + '.state-ON { color: ' +
        scheme['faces'][type]['label-on'] + '}', 0);
    });

    sheet.disabled = true;

    return sheet;
  };

  var loadCustomSchemes = function() {
    customCounter = Number(storage.get('colorscheme.customCounter', '0'));
    customSchemes = JSON.parse(storage.get('colorscheme.customSchemes', '{}'));
    for (name in customSchemes) {
      module.addScheme(name, customSchemes[name]);
    }
  };

  var storeCustomSchemes = function() {
    storage.set('colorscheme.customCounter', customCounter);
    storage.set('colorscheme.customSchemes', JSON.stringify(customSchemes));
  };

  var jsonSchema = {
    "type": "object",
    "headerTemplate": "{{ self.name }}",
    "options": {
      "disable_collapse": true,
      "disable_edit_json": false
    },
    "properties": {
      "name": {
        "type": "string",
        "default": "Custom"
      },
      "background": {
        "type": "string",
        "format": "color",
      },
      "nodes": {
        "type": "object",
        "properties": {
          "OFF": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label", "fill", "stroke"
            ],
            "additionalProperties": false
          },
          "GHOST": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label", "fill", "stroke"
            ],
            "additionalProperties": false
          },
          "SUSTAIN": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label", "fill", "stroke"
            ],
            "additionalProperties": false
          },
          "ON": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              },
              "stroke": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label", "fill", "stroke"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "OFF", "GHOST", "SUSTAIN", "ON"
        ],
        "additionalProperties": false
      },
      "faces": {
        "type": "object",
        "properties": {
          "major": {
            "type": "object",
            "properties": {
              "label-off": {
                "type": "string",
                "format": "color"
              },
              "label-on": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label-off", "label-on", "fill"
            ],
            "additionalProperties": false
          },
          "minor": {
            "type": "object",
            "properties": {
              "label-off": {
                "type": "string",
                "format": "color"
              },
              "label-on": {
                "type": "string",
                "format": "color"
              },
              "fill": {
                "type": "string",
                "format": "color"
              }
            },
            "required": [
              "label-off", "label-on", "fill"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "major", "minor"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "name", "background", "nodes", "faces"
    ],
    "additionalProperties": false
  };

  return module;
})();
