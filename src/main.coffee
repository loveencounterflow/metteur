

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
    \\includegraphics[width=76.75mm,height=110mm,angle=❰angle❱,page=❰page_nr❱]{../16-page-booklet.pdf}};
    \\end{tikzpicture}""".replace /\s*\n\s*/g, ''

layout =
  recto:
    left:   [  4, 13, 16,  1, ]
    right:  [  5, 12,  9,  8, ]
  verso:
    left:   [  6, 11, 10,  7, ]
    right:  [  3, 14, 15,  2, ]

#-----------------------------------------------------------------------------------------------------------
demo = ->
  template_path   = resolve 'tex/booklet.template.tex'
  tex_target_path = resolve 'tex/booklet.tex'
  source_path     = resolve '16-page-booklet.pdf'
  template        = FS.readFileSync template_path, { encoding: 'utf-8', }
  for side in [ 'recto', 'verso', ]
    echo '\\newpage' if side is 'verso'
    sheet = layout[ side ]
    for column in [ 'left', 'right', ]
      ### TAINT precompute using named values ###
      if column is 'left'
        xshift  = 0
        angle   = +90
      else
        xshift  = 210 / 2
        angle   = -90
      for page_nr, page_idx in sheet[ column ]
        yshift = -( 297 / 4 ) * page_idx ### TAINT precompute using named values ###
        page  = page_template
        page  = page.replace /❰xshift❱/g,   xshift
        page  = page.replace /❰yshift❱/g,   yshift
        page  = page.replace /❰angle❱/g,    angle
        page  = page.replace /❰page_nr❱/g,  page_nr
        page += " % #{side} #{column} r#{page_idx + 1} p#{page_nr}"
        template.replace  /(?=❰page❱)/g, page
  return null


############################################################################################################
if module is require.main then do =>
  await demo()
