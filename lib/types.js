(function() {
  'use strict';
  var GUY, debug, help, id, info, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/types'));

  module.exports = types = new (require('intertype')).Intertype();

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_new_template({
    $template: 'text',
    $open: 'nonempty.text',
    $close: 'nonempty.text',
    /* TAINT would use default `optional.function` but for outstanding bug in `intertype` */
    $format: 'function',
    // extras:       false
    default: {
      template: null,
      open: '{',
      close: '}',
      /* TAINT would use default `null` but for outstanding bug in `intertype` */
      // format:       null
      format: id = function(value, key) {
        return value;
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_cli_impose_cfg({
    $input: 'nonempty.text',
    $output: 'nonempty.text',
    $overwrite: 'boolean',
    $split: 'integer',
    default: {
      input: null,
      output: null,
      overwrite: false,
      split: 0
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_impose_cfg({
    $input: 'nonempty.text',
    $output: 'nonempty.text',
    $overwrite: 'boolean',
    $split: 'integer',
    default: {
      input: null,
      output: null,
      overwrite: false,
      split: 0
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_template_fill({
    isa: function(x) {
      return true;
    },
    default: null
  });

}).call(this);

//# sourceMappingURL=types.js.map