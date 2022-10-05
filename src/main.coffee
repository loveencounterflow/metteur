

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
FS                        = require 'fs'
resolve                   = ( P... ) -> PATH.resolve PATH.join __dirname, '..', P...
types                     = require './types'
{ isa }                   = types
misfit                    = Symbol 'misfit'
{ hide
  get
  has  }                  = GUY.props
{ freeze }                = GUY.lft
# { equals }                = types
# { HDML }                  = require 'hdml'
# page_tpl                  = """
#   \\begin{tikzpicture}[overlay,remember picture]%
#   \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
#     \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,angle=❰angle_ccw❱,page=❰page_nr❱]{❰source_path❱}}};%
#     \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n"""#.replace /\s*\n\s*/g, ''
page_tpl                  = """
  \\begin{tikzpicture}[overlay,remember picture]%
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
    \\rotatebox{❰angle_cw❱}{%
    \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰source_path❱}}}};%
    \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n"""#.replace /\s*\n\s*/g, ''


#===========================================================================================================
# types.declare 'tmpltr_cfg',

#===========================================================================================================
class Template extends GUY.props.Strict_owner

  #---------------------------------------------------------------------------------------------------------
  hide @, 'misfit', misfit

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    hide @, 'types', types
    @cfg    = new GUY.props.Strict_owner { target: ( @types.create.mtr_new_template cfg ), freeze: true, }
    #.......................................................................................................
    open    = @_escape_literal_for_regex @cfg.open
    close   = @_escape_literal_for_regex @cfg.close
    hide @, '_segments',        []
    hide @, '_mark_idxs',       {}
    hide @, '_idx_directions',  {}
    hide @, '_cfg', freeze
      open:   open
      close:  close
      rx:     /// #{open} (?<key>[^#{close}]*) #{close} ///g
    #.......................................................................................................
    @_compile()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _compile: ->
    is_mark = true
    for segment_or_mark, idx in @cfg.template.split @_cfg.rx
      if is_mark = not is_mark
        direction = 'append'
        if segment_or_mark.startsWith '...'
          segment_or_mark = segment_or_mark[ 3 ... ]
        else if segment_or_mark.endsWith '...'
          segment_or_mark = segment_or_mark[ ... segment_or_mark.length - 3 ]
          direction = 'prepend'
        @_segments.push []
        ( @_mark_idxs[ segment_or_mark ] ?= [] ).push idx
        @_idx_directions[ idx ]           = direction
      else
        @_segments.push segment_or_mark
    return null

  #---------------------------------------------------------------------------------------------------------
  _fill: ( mode, cfg ) ->
    cfg             = @types.create.mtr_template_fill cfg
    { isa
      type_of }     = @types
    isa_text        = isa.text
    do_format       = @cfg.format?
    for key, idxs of @_mark_idxs
      if ( value = get cfg, key, misfit ) is misfit
        continue if mode is 'some'
        throw new Error "unknown key #{rpr key}"
      value = @cfg.format value, key if do_format
      throw new Error "expected text, got a #{type_of value} for key #{rpr key}" unless isa_text value
      for idx in idxs
        if @_idx_directions[ idx ] is 'append' then @_segments[ idx ].push    value
        else                                        @_segments[ idx ].unshift value
    return null

  #---------------------------------------------------------------------------------------------------------
  fill_all:   ( cfg ) -> @_fill 'all',  cfg
  fill_some:  ( cfg ) -> @_fill 'some', cfg

  #---------------------------------------------------------------------------------------------------------
  clear: ->
    @_segments[ idx ] = [] for idx in [ 1 ... @_segments.length ] by +2
    return null

  #---------------------------------------------------------------------------------------------------------
  finish: -> R = @peek(); @clear(); R
  peek:   -> @_segments.flat().join ''

  #---------------------------------------------------------------------------------------------------------
  ### thx to https://stackoverflow.com/a/6969486/7568091 and
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping ###
  _escape_literal_for_regex: ( literal ) -> literal.replace /[.*+?^${}()|[\]\\]/g, '\\$&'



#===========================================================================================================
class Metteur extends GUY.props.Strict_owner

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super()
    hide @, 'types', types
    return undefined

  #---------------------------------------------------------------------------------------------------------
  impose: ( cfg ) -> @_impose types.create.mtr_impose_cfg cfg

  #---------------------------------------------------------------------------------------------------------
  _impose: ( cfg ) ->
    doc_tpl_path    = resolve 'tex/booklet.template.tex'
    doc_tpl         = FS.readFileSync doc_tpl_path, { encoding: 'utf-8', }
    format          = ( x ) -> if isa.text x then x else rpr x
    doc_tpl         = new Template { template: doc_tpl,  open: '❰', close: '❱', format, }
    page_tpl        = new Template { template:      page_tpl, open: '❰', close: '❱', format, }
    #.......................................................................................................
    Q               = new GUY.props.Strict_owner seal: true, target:
      # frame_weight:     '0.25mm'
      frame_weight:     '0.125mm'
      xshift:           Template.misfit
      yshift:           Template.misfit
      column_count:     Template.misfit
      row_count:        Template.misfit
      column_width:     Template.misfit
      row_height:       Template.misfit
      page_width:       Template.misfit
      page_height:      Template.misfit
      side_name:        Template.misfit
      side:             Template.misfit
      column:           Template.misfit
      column_idx:       Template.misfit
      column_nr:        Template.misfit
      angles:           Template.misfit
      orientation:      Template.misfit
      sheet_nr:         0
      page_nr:          Template.misfit
      page_idx:         Template.misfit
      slot_map:         Template.misfit
      slot_idx:         Template.misfit
      slot_nr:          Template.misfit
      angle_cw:         Template.misfit
      angle_ccw:        Template.misfit
      source_path:      cfg.input
      correction:       { x: -2, y: +1.5, }
    #.......................................................................................................
    Q.column_count  = cfg.layout.recto.pages.length
    Q.row_count     = cfg.layout.recto.pages[ 0 ].length
    Q.column_width  =    cfg.sheet.width.value  / Q.column_count
    Q.row_height    = -( cfg.sheet.height.value / Q.row_count)
    Q.page_width    = cfg.sheet.width.value   / Q.column_count
    Q.page_height   = cfg.sheet.height.value  / Q.row_count
    unless cfg.pages_standing
      [ Q.page_width, Q.page_height, ] = [ Q.page_height, Q.page_width, ]
    Q.orientation   = if cfg.orientation is 'ltr' then +1 else -1
    loop
      Q.sheet_nr++
      break if Q.sheet_nr > cfg.sheetcount
      for _side_name in [ 'recto', 'verso', ]
        Q.side_name = _side_name
        Q.side      = cfg.layout[ Q.side_name ]
        doc_tpl.fill_some { content: '\\newpage%\n', } if Q.sheet_nr > 1 or Q.side_name is 'verso'
        for _column, _column_idx in Q.side.pages
          Q.column      = _column
          Q.column_idx  = _column_idx
          Q.column_nr   = Q.column_idx + 1
          Q.angles      = Q.side.angles[ _column_idx ]
          debug '^3353^', { _column, _column_idx, angles: Q.angles, }
          for _slot_map, _slot_idx in Q.column
            Q.slot_map    = _slot_map
            Q.slot_idx    = _slot_idx
            Q.slot_nr     = Q.slot_idx + 1
            Q.angle_cw    = Q.angles[ _slot_idx ]
            Q.angle_ccw   = -Q.angle_cw ### NOTE converting from anti-clockwise to clockwise ###
            pdistro_idx   = ( Q.sheet_nr - 1 ) * cfg.layout.pps + Q.slot_map - 1
            Q.page_nr     = cfg.pagedistro[ pdistro_idx ] ? -1 ### NOTE: using -1 as error code ###
            Q.xshift      = ( Q.column_width  * Q.column_idx  ) + Q.correction.x
            Q.yshift      = ( Q.row_height    * Q.slot_idx    ) + Q.correction.y
            urge '^234^', "sheet #{Q.sheet_nr} #{Q.side_name} slot c#{Q.column_idx + 1},s#{Q.slot_idx + 1}, pos #{Q.slot_map}, p#{Q.page_nr} ↷ #{Q.angle_cw}"
            page_tpl.fill_all Q
            doc_tpl.fill_some { content: page_tpl.finish(), }
    doc_tpl.fill_some { frame_weight: Q.frame_weight, }
    # template = @interpolate template, Q
    #.......................................................................................................
    return doc_tpl.finish()


#-----------------------------------------------------------------------------------------------------------
demo = ->
  mtr = new Metteur()
  mtr.impose()
  return null

#===========================================================================================================
module.exports = { Template, Metteur, demo, }


############################################################################################################
if module is require.main then do =>
  await demo()
