

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
types                     = new ( require 'intertype' ).Intertype()
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

#-----------------------------------------------------------------------------------------------------------
### thx to https://stackoverflow.com/a/6969486/7568091 and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping ###
@_escape_literal_for_regex = ( literal ) -> literal.replace /[.*+?^${}()|[\]\\]/g, '\\$&'

#-----------------------------------------------------------------------------------------------------------
@interpolate = ( template, Q ) ->
  R = template
  R = R.replace /// ❰ (?<key>[^❱]*) ❱ ///g, ( _..., { key, } ) ->
    if key.startsWith '...'
      key = key[ 3 ... ]
    unless ( value = Q[ key ] )?
      throw new Error "unknown key #{rpr groups.key}"
    return value
  return R

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
