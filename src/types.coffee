

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
  # isa:        'mtr_layout_str.or.mtr_layout_obj'
  isa:        'anything'
  cast: ( x ) ->
    # x ?= @registry.mtr_layout_str.default
    return x unless @isa.nonempty.text x
    unless ( R = known_layouts[ x ] )?
      known_layout_names = ( ( rpr name ) for name of known_layouts ).join ', '
      throw new Error "^metteur/types@24^ unknown layout name: #{rpr x}; known layouts are: #{known_layout_names}"
    debug '^43-1^', R
    return @registry.mtr_layout_obj.create R

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layout_str
  isa:        'nonempty.text'
  default:    'pps16'

#-----------------------------------------------------------------------------------------------------------
declare.mtr_layout_obj
  extras:       false
  fields:
    name:         'nonempty.text'
    recto:        'mtr_sheet_side_layout'
    verso:        'mtr_sheet_side_layout'
    angles:       'optional.list.of.mtr_angle'
    # pps:          'positive1.integer'
    # pages_standing: 'boolean'
  default:
    name:           null
    recto:          null
    verso:          null
    angles:         null
    # pps:            null
    # pages_standing: null
  create: ( x ) ->
    ### TAINT this should go into `prepare()` method when implemented ###
    ### TAINT should also check for consistency of angles ###
    debug '^43-2^', x.recto.angles
    x.pps             = 0
    x.pps            += p.length for p in x.recto.pages
    x.pps            += p.length for p in x.verso.pages
    x.pages_standing  = x.recto.angles[ 0 ][ 0 ] in [ 0, 180, ]
    debug '^43-3^', x
    return x

#-----------------------------------------------------------------------------------------------------------
declare.mtr_pagenr ( x ) -> ( @isa.integer x ) and ( x >= -1 )

#-----------------------------------------------------------------------------------------------------------
### TAINT may want to use words like up, upsidedown, left, right or similar ###
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
declare.guy_strict_owner ( x ) -> true # x instanceof GUY.props.Strict_owner

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
  isa:          'guy_strict_owner'
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
    # R = new GUY.props.Strict_owner { target: R, seal: true, freeze: true, }
    return new GUY.props.Strict_owner { target: R, }

#-----------------------------------------------------------------------------------------------------------
### we put known layouts here for the time being: ###
known_layouts =
  pps4:
    name:     'pps4'
    # pps:      8 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
    recto:
      angles: [
        [ +90, +90 ] ]
      pages: [
        [  4, 1, ] ]
    verso:
      angles: [
        [ -90, -90 ] ]
      pages: [
        [  3, 2, ] ]
  pps8:
    name:     'pps8'
    # pps:      8 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
    recto:
      angles: [
        [ 180, 0, ]
        [ 180, 0, ] ]
      pages: [
        [  5, 8, ]     # column 1 (left)
        [  4, 1, ] ]   # column 2 (right)
    verso:
      angles: [
        [ 180, 0, ]
        [ 180, 0, ] ]
      pages: [
        [  3, 2, ]     # column 1 (left)
        [  6, 7, ] ]   # column 2 (right)
  pps16:
    name:     'pps16'
    # pps:      16 ### TAINT should not have to be set explicitly; pending implementation of Intertype `prepare()` ###
    recto:
      angles: [
        [ -90, -90, -90, -90, ]       # column 1 (left)
        [ +90, +90, +90, +90, ] ]     # column 2 (right)
      pages: [
        [  4, 13, 16,  1, ]     # column 1 (left)
        [  5, 12,  9,  8, ] ]   # column 2 (right)
    verso:
      angles: [
        [ -90, -90, -90, -90, ]       # column 1 (left)
        [ +90, +90, +90, +90, ] ]     # column 2 (right)
      pages: [
        [  6, 11, 10,  7, ]     # column 1 (left)
        [  3, 14, 15,  2, ] ]   # column 2 (right)

