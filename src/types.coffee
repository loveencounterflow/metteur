

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
    ### TAINT would use default `optional.function` but for outstanding bug in `intertype` ###
  $format:      'function'
  # extras:       false
  default:
    template:     null
    open:         '{'
    close:        '}'
    ### TAINT would use default `null` but for outstanding bug in `intertype` ###
    # format:       null
    format:       id = ( value, key ) -> value

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_template_fill
  isa: ( x ) ->
    return true
  default: null

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_orientation ( x ) -> x in [ 'ltr', 'rtl', ]

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_layouts ( x ) ->
  return false unless @isa.object x
  for key, value of x
    return false unless @isa.nonempty.text key
    return false unless @isa.mtr_layout value
  return true

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_layout
  $name:        'nonempty.text'
  $recto:       'optional.mtr_sheet_side_layout'
  $verso:       'optional.mtr_sheet_side_layout'

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_sheet_side_layout

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_split list_of_page_nrs = ( x ) ->
  return false unless @isa.nonempty.text x
  data  = ( @state.data ?= {} ).mtr_split = {}
  parts = ( part.trim() for part in x.split ',' )
  pnrs  = []
  for part, idx in parts
    pair = part.split ':'
    switch pair.length
      when 1 then [ pnr, count, ] = [ part, '-1', ]
      when 2 then [ pnr, count, ] = pair
      when 3 then return false ### TAINT can we give reason for rejection? ###
    return false if Number.isNaN pnr    = parseInt pnr    ### TAINT use @isa.nan when available ###
    return false if Number.isNaN count  = parseInt count  ### TAINT use @isa.nan when available ###
    debug '^45-1^', { pnr, count, }
    pnrs.push { pnr, count, }
  # pnrs = (  )
  data.pnrs = pnrs
  return true

#-----------------------------------------------------------------------------------------------------------
types.declare.mtr_impose_cfg
  $input:       'nonempty.text'
  $output:      'nonempty.text'
  $overwrite:   'boolean'
  $split:       'integer'
  $orientation: 'mtr_orientation'
  $layout:      'mtr_layout'
  $layouts:     'mtr_layouts'
  default:
    input:        null
    output:       null
    overwrite:    false
    split:        0
    orientation:  'ltr' # or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
    layout:
      name:       'pps16'
    layouts:
      pps16:
        name:     'pps16'
        recto:
          left:   [  4, 13, 16,  1, ]
          right:  [  5, 12,  9,  8, ]
        verso:
          left:   [  6, 11, 10,  7, ]
          right:  [  3, 14, 15,  2, ]
  create: ( cfg ) ->
    R = { @registry.mtr_impose_cfg.default..., cfg..., }
    unless R.recto? and R.verso?
      unless ( layout = R.layouts[ R.layout.name ] )?
        throw new Error "^metteur/types@23^ unknown layout name #{rpr R.layout.name}"
      R.layout = { layout..., R.layout..., }
    return R

#-----------------------------------------------------------------------------------------------------------
# types.declare.mtr_cli_impose_cfg 'mtr_impose_cfg'
  # $input:       'nonempty.text'
  # $output:      'nonempty.text'
  # $overwrite:   'boolean'
  # $split:       'integer'
  # default:
  #   input:      null
  #   output:     null
  #   overwrite:  false
  #   split:      0

