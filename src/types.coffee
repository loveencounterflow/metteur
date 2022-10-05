

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR/types'
{ rpr
  echo }                  = GUY.trm
module.exports            = types = new ( require 'intertype' ).Intertype()
{ declare }               = types

#-----------------------------------------------------------------------------------------------------------
declare.mtr_new_template
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
declare.mtr_template_fill
  isa: ( x ) ->
    return true
  default: null

#-----------------------------------------------------------------------------------------------------------
declare.mtr_orientation ( x ) -> x in [ 'ltr', 'rtl', ]

#-----------------------------------------------------------------------------------------------------------
declare.mtr_quantity
  extras:         false
  fields:
    value:         'float'
    unit:          'nonempty.text'
  default:
    value:    0
    unit:     null
  cast: ( x ) ->
    return x unless types.isa.nonempty.text x
    return x unless ( match = x.match /^(?<value>.*?)(?<unit>\D*)$/ )?
    { value
      unit  } = match.groups
    value     = parseFloat value
    return x unless types.isa.float value
    return x unless types.isa.nonempty.text unit
    return { value, unit, }

#-----------------------------------------------------------------------------------------------------------
declare.mtr_rectangle
  extras:         false
  fields:
    width:         'mtr_length'
    height:        'mtr_length'
  default:
    width:        { value: 0, unit: 'mm', }
    height:       { value: 0, unit: 'mm', }
  # cast: ( width, height ) ->
  #   return
  #     width:  { value: width,   unit: 'mm', }
  #     height: { value: height,  unit: 'mm', }

#-----------------------------------------------------------------------------------------------------------
declare.mtr_length
  extras:         false
  isa:            ( x ) ->
    return false unless @isa.mtr_quantity x
    return false unless x.unit is 'mm'
    return true
  default:
    value:        0
    unit:         'mm'
  cast: ( x ) -> @registry.mtr_quantity.cast x

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layouts ( x ) ->
  return false unless @isa.object x
  for key, value of x
    return false unless @isa.nonempty.text key
    return false unless @isa.mtr_layout value
  return true

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layout
  isa:        'mtr_layout_str.or.mtr_layout_obj'
  cast: ( x ) ->
    # x ?= @registry.mtr_layout_str.default
    return x unless @isa.nonempty.text x
    unless ( R = known_layouts[ x ] )?
      known_layout_names = ( ( rpr name ) for name of known_layouts ).join ', '
      throw new Error "^metteur/types@24^ unknown layout name: #{rpr x}; known layouts are: #{known_layout_names}"
    return @registry.mtr_layout_obj.create R

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layout_str
  isa:        'nonempty.text'
  default:    'pps16'

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layout_obj
  extras:       false
  $name:        'nonempty.text'
  $recto:       'optional.mtr_sheet_side_layout'
  $verso:       'optional.mtr_sheet_side_layout'
  $angles:      'optional.list.of.mtr_angle'
  default:
    name:         null
    recto:        null
    verso:        null
    angles:       null
  create: ( x ) ->
    ### TAINT only works for specific case which should be checked for ###
    if x.angles?
      angles = ( ( x.angles[ col_idx ] for page in col ) for col, col_idx in x.recto.pages )
      for side in [ 'recto', 'verso' ]
        x[ side ].angles ?= angles
    delete x.angles
    return x

#-----------------------------------------------------------------------------------------------------------
declare.mtr_pagenr ( x ) -> ( @isa.integer x ) and ( x >= -1 )

#-----------------------------------------------------------------------------------------------------------
declare.mtr_angle ( x ) -> x in [ 0, 90, 180, 270, -90, ]

#-----------------------------------------------------------------------------------------------------------
declare.mtr_sheet_side_layout
  extras:       false
  $pages:       'list.of.list.of.mtr_pagenr'
  $angles:      'optional.list.of.list.of.mtr_angle'
  default:
    pages:        null
    angles:       null

#-----------------------------------------------------------------------------------------------------------
declare.mtr_split ( x ) ->
  return false unless @isa.nonempty.text x
  parts = ( part.trim() for part in x.split ',' )
  pnrs  = []
  for part, idx in parts
    pair = part.split ':'
    switch pair.length
      when 1 then [ pnr, count, ] = [ part, '-1', ]
      when 2 then [ pnr, count, ] = pair
      when 3 then return false ### TAINT can we give reason for rejection? ###
    return false if @isa.nan pnr    = parseInt pnr    ### TAINT use @isa.nan when available ###
    return false if @isa.nan count  = parseInt count  ### TAINT use @isa.nan when available ###
    # debug '^45-1^', { pnr, count, }
    count = +Infinity if count < 0
    pnrs.push { pnr, count, }
  @data.mtr_split = pnrs
  return true

#-----------------------------------------------------------------------------------------------------------
declare.mtr_impose_cfg
  extras:       false
  $input:       'nonempty.text'
  $output:      'nonempty.text'
  $overwrite:   'boolean'
  $split:       'mtr_split'
  $orientation: 'mtr_orientation'
  $sheet:       'mtr_rectangle'
  $layout:      'mtr_layout'
  default:
    input:        null
    output:       null
    overwrite:    false
    split:        '-0'
    orientation:  'ltr' # or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
    sheet:
      width:      '210mm'
      height:     '297mm'
    layout:       'pps16'
  create: ( cfg ) ->
    R               = { @registry.mtr_impose_cfg.default..., cfg..., }
    R.layout        = @cast.mtr_layout R.layout
    R.sheet.width   = @cast.mtr_length R.sheet.width  if @isa.text R.sheet.width
    R.sheet.height  = @cast.mtr_length R.sheet.height if @isa.text R.sheet.height
    debug '^456456^', R
    return R

#-----------------------------------------------------------------------------------------------------------
### we put known layouts here for the time being: ###
known_layouts =
  pps16:
    name:     'pps16'
    angles: [
      +90       # column 1 (left)   ### NOTE where necessary, these   ###
      -90 ]     # column 2 (right)  ### can be given for each page    ###
    recto:
      pages: [
        [  4, 13, 16,  1, ]     # column 1 (left)
        [  5, 12,  9,  8, ] ]   # column 2 (right)
    verso:
      pages: [
        [  6, 11, 10,  7, ]     # column 1 (left)
        [  3, 14, 15,  2, ] ]   # column 2 (right)

