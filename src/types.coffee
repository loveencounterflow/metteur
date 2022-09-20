

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR/types'
module.exports            = types = new ( require 'intertype' ).Intertype()

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_new_template
  $template:    'text'
  $open:        'nonempty.text'
  $close:       'nonempty.text'
  $rpr:         'optional.function'
  extras:       false
  default:
    template:     null
    open:         '{'
    close:        '}'
    # rpr:          id = ( x ) -> x
    rpr:          null
  # create: ( cfg ) -> { @registry.mtr_new_template.default..., cfg..., }

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_template_fill
  isa: ( x ) ->
    return true
  default: null
