(function() {
  'use strict';
  var GUY, debug, help, info, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/types'));

  module.exports = types = new (require('intertype')).Intertype();

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_new_template({
    $template: 'text',
    $open: 'nonempty.text',
    $close: 'nonempty.text',
    $rpr: 'optional.function',
    extras: false,
    default: {
      template: null,
      open: '{',
      close: '}',
      // rpr:          id = ( x ) -> x
      rpr: null
    }
  });

  // create: ( cfg ) -> { @registry.mtr_new_template.default..., cfg..., }

  //-----------------------------------------------------------------------------------------------------------
  types.declare.mtr_template_fill({
    isa: function(x) {
      return true;
    },
    default: null
  });

}).call(this);

//# sourceMappingURL=types.js.map