

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
page_tpl                  = """
  \\begin{tikzpicture}[overlay,remember picture]%
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
    \\fbox{\\includegraphics[width=❰width❱mm,height=❰height❱mm,angle=❰angle❱,page=❰page_nr❱]{❰source_path❱}}};%
    \\end{tikzpicture}% ❰side❱ ❰column❱ p❰page_nr❱\n"""#.replace /\s*\n\s*/g, ''



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
      angle:            Template.misfit
      width:            Template.misfit
      height:           Template.misfit
      side:             Template.misfit
      column:           Template.misfit
      column_idx:       Template.misfit
      angles:           Template.misfit
      orientation:      Template.misfit
      sheet_nr:         0
      page_nr:          Template.misfit
      page_idx:         Template.misfit
      slot_map:         Template.misfit
      slot_idx:         Template.misfit
      angle:            Template.misfit
      source_path:      cfg.input
      correction:       { x: -2, y: +1.5, }
    #.......................................................................................................
    ### TAINT precompute using named values ###
    Q.width         = 297 / 4
    Q.height        = 210 / 2
    Q.orientation   = if cfg.orientation is 'ltr' then +1 else -1
    loop
      Q.sheet_nr++
      break if Q.sheet_nr > cfg.sheetcount
      for _side in [ 'recto', 'verso', ]
        Q.side  = _side
        sheet   = cfg.layout[ Q.side ]
        doc_tpl.fill_some { content: '\\newpage%\n', } if Q.sheet_nr > 1 or Q.side is 'verso'
        # debug '^13453^', sheet
        for _column, _column_idx in sheet.pages
          Q.column      = _column
          Q.column_idx  = _column_idx
          Q.angles      = sheet.angles[ _column_idx ]
          debug '^3353^', { _column, _column_idx, angles: Q.angles, }
          for _slot_map, _slot_idx in Q.column
            Q.slot_map    = _slot_map
            Q.slot_idx    = _slot_idx
            Q.angle       = Q.angles[ _slot_idx ]
            info '^3353^', { page_nr: Q.slot_map, page_idx: Q.slot_idx, angle: Q.angle, }
            pdistro_idx   = ( Q.sheet_nr - 1 ) * cfg.pps + Q.slot_map - 1
            Q.page_nr     = cfg.pagedistro[ pdistro_idx ] ? -1 ### NOTE: using -1 as error code ###
            Q.yshift      = -( 297 / 4 ) * Q.slot_idx + Q.correction.y ### TAINT precompute using named values ###
            urge '^234^', "sheet #{Q.sheet_nr} #{Q.side} slot c#{Q.column_idx + 1},s#{Q.slot_idx + 1}, pos #{Q.slot_map}, p#{Q.page_nr}"
          continue
          ### TAINT precompute using named values ###
          if Q.column is 'left'
            Q.xshift  = 0 + Q.correction.x
            Q.angle   = -90 * Q.orientation
          else
            Q.xshift  = 210 / 2 + Q.correction.x
            Q.angle   = +90 * Q.orientation
          for page_nr, page_idx in sheet[ Q.column ]
            Q.page_nr   = page_nr
            pdistro_idx = ( Q.sheet_nr - 1 ) * cfg.pps + page_nr - 1
            Q.page_nr   = cfg.pagedistro[ pdistro_idx ] ? -1 ### NOTE: using -1 as error code ###
            urge '^234^', "sheet #{Q.sheet_nr} #{Q.side} #{Q.column} p#{page_nr} (#{Q.page_nr})"
            Q.yshift    = -( 297 / 4 ) * page_idx + Q.correction.y ### TAINT precompute using named values ###
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
