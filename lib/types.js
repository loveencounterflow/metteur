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
    $rpr: 'function',
    // extras:       false
    default: {
      template: null,
      open: '{',
      close: '}',
      rpr: id = function(value, key) {
        return value;
      }
    }
  });

  // rpr:          null
  // create: ( cfg ) ->
  //   R = { @registry.mtr_new_template.default..., cfg..., }
  //   R.rpr ?= id = ( x ) -> x
  //   return R

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_template_fill({
    isa: function(x) {
      return true;
    },
    default: null
  });

}).call(this);

//# sourceMappingURL=types.js.map