

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
PATH                      = require 'node:path'
FS                        = require 'node:fs'
resolve                   = ( P... ) -> PATH.resolve PATH.join __dirname, '..', P...
H                         = require './helpers'
types                     = require './types'
{ isa }                   = types
{ Template }              = require './metteur-templating'
{ hide
  get
  has  }                  = GUY.props
{ freeze }                = GUY.lft
# { equals }                = types
# { HDML }                  = require 'hdml'
{ PDFDocument }           = require 'pdf-lib'
fontkit                   = require '@pdf-lib/fontkit'
page_tpl                  = """
  %-------------------------------------------------------------------------------------------------------------------------------------------------------
  \\begin{tikzpicture}[overlay,remember picture]%
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
    \\rotatebox{❰angle_ccw❱}{%
    \\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰bdp_path❱}}};%
    \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°
  \\begin{tikzpicture}[overlay,remember picture]%
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
    \\rotatebox{❰angle_ccw❱}{%
    \\fbox{\\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰page_nr❱]{❰source_path❱}}}};%
    \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°
  \\begin{tikzpicture}[overlay,remember picture]%
  \\node[anchor=north west,xshift=❰xshift❱mm,yshift=❰yshift❱mm] at (current page.north west){%
    \\rotatebox{❰angle_ccw❱}{%
    \\includegraphics[width=❰page_width❱mm,height=❰page_height❱mm,page=❰pos_nr❱]{❰ovl_path❱}}};%
    \\end{tikzpicture}% sheet ❰sheet_nr❱ ❰side_name❱ col ❰column_nr❱ row ❰slot_nr❱, pos??? ❰pos_nr❱, pos ❰slot_map❱, p❰page_nr❱ ↷ ❰angle_cw❱°\n
    """

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
    await @_generate_overlay cfg
    doc_tpl_path    = resolve 'tex/booklet.template.tex'
    doc_tpl         = FS.readFileSync doc_tpl_path, { encoding: 'utf-8', }
    format          = ( x ) -> if isa.text x then x else rpr x
    doc_tpl         = new Template { template: doc_tpl,       open: '❰', close: '❱', format, }
    page_tpl        = new Template { template: page_tpl,      open: '❰', close: '❱', format, }
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
      pos_nr:           Template.misfit
      slot_map:         Template.misfit
      slot_idx:         Template.misfit
      slot_nr:          Template.misfit
      angle_cw:         Template.misfit
      angle_ccw:        Template.misfit
      source_path:      cfg.input
      ovl_path:         cfg.ovl_path
      bdp_path:         cfg.bdp_path
      correction:       { x: -2, y: +1.5, }
    #.......................................................................................................
    Q.column_count  = cfg.layout.recto.pages.length
    Q.row_count     = cfg.layout.recto.pages[ 0 ].length
    Q.column_width  = cfg.sheet.width.value   / Q.column_count
    Q.row_height    = cfg.sheet.height.value  / Q.row_count
    if cfg.layout.pages_standing
      Q.page_width    = Q.column_width
      Q.page_height   = Q.row_height
    else
      Q.page_width    = Q.row_height
      Q.page_height   = Q.column_width
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
            Q.pos_nr      = pdistro_idx + 1
            Q.page_nr     = cfg.pagedistro[ pdistro_idx ] ? -1 ### NOTE: using -1 as error code ###
            Q.xshift      = (  Q.column_width  * Q.column_idx  ) + Q.correction.x
            Q.yshift      = ( -Q.row_height    * Q.slot_idx    ) + Q.correction.y
            #...............................................................................................
            urge '^234^', "sheet #{Q.sheet_nr} #{Q.side_name} slot c#{Q.column_idx + 1},s#{Q.slot_idx + 1}, pos #{Q.slot_map}, p#{Q.page_nr} ↷ #{Q.angle_cw}"
            page_tpl.fill_all Q
            doc_tpl.fill_some { content: page_tpl.finish(), }
    doc_tpl.fill_some { frame_weight: Q.frame_weight, }
    # template = @interpolate template, Q
    #.......................................................................................................
    return doc_tpl.finish()

  #---------------------------------------------------------------------------------------------------------
  _generate_overlay: ( cfg ) ->
    font_path = PATH.join __dirname, '../fonts/EBGaramond08-Regular.ttf'
    doc       = await PDFDocument.create()
    #.......................................................................................................
    fontBytes = FS.readFileSync font_path
    doc.registerFontkit fontkit
    font      = await doc.embedFont fontBytes, { subset: true, features: {
      lnum: true,
      liga: true,
      dlig: true, }, }
    width     = H.pt_from_mm cfg.page_width
    height    = H.pt_from_mm cfg.page_height
    quire_nr  = 0
    poscount  = cfg.layout.pps * cfg.sheetcount
    #.......................................................................................................
    for pos_nr in [ 1 .. poscount ]
      page      = doc.addPage [ width, height, ]
      ### NOTE apparently must write some text, even if blank, otherwise LaTeX will complain ###
      page.drawText "", { font, x: 0, y: 0, }
      size      = H.pt_from_mm 10
      x         = H.pt_from_mm 10
      y         = H.pt_from_mm 10
      slot_nr   = ( ( pos_nr - 1 ) %% cfg.layout.pps ) + 1
      switch slot_nr
        when 1
          quire_nr++
          page.drawText "#{quire_nr}", { font, x, y, size, }
        when 3
          page.drawText "*#{quire_nr}", { font, x, y, size, }
        else
          null
    #.......................................................................................................
    FS.writeFileSync cfg.ovl_path, await doc.save()
    return null


#===========================================================================================================
module.exports = { Template, Metteur, }


