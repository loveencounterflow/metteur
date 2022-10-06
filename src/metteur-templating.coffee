

'use strict'


############################################################################################################
GUY                       = require 'guy'
{ debug
  info
  whisper
  warn
  urge
  help }                  = GUY.trm.get_loggers 'METTEUR/templating'
{ rpr
  echo }                  = GUY.trm
{ hide
  get
  has  }                  = GUY.props
{ freeze }                = GUY.lft
misfit                    = Symbol 'misfit'
types                     = require './types'


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


#-----------------------------------------------------------------------------------------------------------
@escape_tex_specials = ( text ) ->
  R = text
  R = R.replace /\\/g,  '\\textbackslash{}'
  R = R.replace /\{/g,  '\\{'
  R = R.replace /\}/g,  '\\}'
  R = R.replace /\$/g,  '\\$'
  R = R.replace /#/g,   '\\#'
  R = R.replace /%/g,   '\\%'
  R = R.replace /_/g,   '\\_'
  R = R.replace /\^/g,  '\\textasciicircum{}'
  R = R.replace /~/g,   '\\textasciitilde{}'
  R = R.replace /&/g,   '\\&'
  return R
