#!/usr/bin/env zx
(function() {
  //!/usr/bin/env zx
  'use strict';
  var GUY, debug, echo, help, info, rpr, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR/run-tex'));

  ({rpr, echo} = GUY.trm);

  info("helo from", __filename);

  $`ls .`;

}).call(this);

//# sourceMappingURL=_run-tex.zx.js.map