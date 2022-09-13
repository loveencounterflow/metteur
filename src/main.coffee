

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR'
{ rpr
  echo }                  = GUY.trm
PATH                      = require 'path'
FS                        = require 'fs/promises'
resolve                   = ( P... ) -> PATH.resolve PATH.join __dirname, P...
types                     = new ( require 'intertype' ).Intertype()
# { equals }                = types
# { HDML }                  = require 'hdml'


#-----------------------------------------------------------------------------------------------------------
demo = ->
  PDF           = require 'pdf-lib'
  source_path   = resolve '../../../assets/pdf-booklet/16-page-booklet.pdf'
  return null


############################################################################################################
if module is require.main then do =>
  await demo()
