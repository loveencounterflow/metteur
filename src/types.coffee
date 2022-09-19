

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
  extras:       false
  default:
    template:     null
    open:         '{'
    close:        '}'

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_template_fill
  isa: ( x ) ->
    return true
  default: null
