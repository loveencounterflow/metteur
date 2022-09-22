

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
misfit                    = Symbol 'misfit'
{ hide
  get
  has  }                  = GUY.props
{ freeze }                = GUY.lft
# { equals }                = types
# { HDML }                  = require 'hdml'
page_template             = """
  \\begin{tikzpicture}[overlay,remember picture]
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){
    \\fbox{\\includegraphics[width=❰width❱mm,height=❰height❱mm,angle=❰angle❱,page=❰page_nr❱]{❰source_path❱}}};
    \\end{tikzpicture}""".replace /\s*\n\s*/g, ''

layout =
  orientation: 'ltr' # or 'rtl' which will invert the orientation of all pages, allowing for CJK, Arabic RTL books
  recto:
    left:   [  4, 13, 16,  1, ]
    right:  [  5, 12,  9,  8, ]
  verso:
    left:   [  6, 11, 10,  7, ]
    right:  [  3, 14, 15,  2, ]


#===========================================================================================================
# types.declare 'tmpltr_cfg',

#===========================================================================================================
class @Template extends GUY.props.Strict_owner

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
    return undefined

#-----------------------------------------------------------------------------------------------------------
@demo = ->
  template_path   = resolve 'tex/booklet.template.tex'
  tex_target_path = resolve 'tex/booklet.tex'
  source_path     = resolve '../metteur-booklets/textura.booklet.pdf'
  # source_path     = resolve '16-page-booklet.pdf'
  template        = FS.readFileSync template_path, { encoding: 'utf-8', }
  #.........................................................................................................
  Q               =
    # frame_weight:     '0.25mm'
    frame_weight:     '0mm'
  #.........................................................................................................
  # correction      = { x: -3.5, y: +3.5, }
  correction      = { x: -2, y: +1.5, }
  ### TAINT precompute using named values ###
  width           = 297 / 4
  height          = 210 / 2
  orientation     = if layout.orientation is 'ltr' then +1 else -1
  for side in [ 'recto', 'verso', ]
    template = template.replace /(?=❰\.\.\.content❱)/g, '\\newpage%\n' if side is 'verso'
    sheet = layout[ side ]
    for column in [ 'left', 'right', ]
      ### TAINT precompute using named values ###
      if column is 'left'
        xshift  = 0 + correction.x
        angle   = -90 * orientation
      else
        xshift  = 210 / 2 + correction.x
        angle   = +90 * orientation
      for page_nr, page_idx in sheet[ column ]
        yshift = -( 297 / 4 ) * page_idx + correction.y ### TAINT precompute using named values ###
        page  = page_template
        page  = page.replace /❰xshift❱/g,   xshift
        page  = page.replace /❰yshift❱/g,   yshift
        page  = page.replace /❰angle❱/g,    angle
        page  = page.replace /❰width❱/g,    width
        page  = page.replace /❰height❱/g,   height
        page  = page.replace /❰page_nr❱/g,  page_nr
        page  = page.replace /❰source_path❱/g,  source_path
        page += " % #{side} #{column} r#{page_idx + 1} p#{page_nr}\n"
        template = template.replace /(?=❰\.\.\.content❱)/g, page
  template = template.replace /❰\.\.\.content❱/g, ''
  template = template.replace /❰frame_weight❱/g, Q.frame_weight
  # template = @interpolate template, Q
  FS.writeFileSync tex_target_path, template
  help "wrote output to #{tex_target_path}"
  return null


############################################################################################################
if module is require.main then do =>
  await @demo()
