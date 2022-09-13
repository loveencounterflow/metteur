(function() {
  'use strict';
  var FS, GUY, PATH, debug, demo, echo, help, info, resolve, rpr, types, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({debug, info, whisper, warn, urge, help} = GUY.trm.get_loggers('METTEUR'));

  ({rpr, echo} = GUY.trm);

  PATH = require('path');

  FS = require('fs/promises');

  resolve = function(...P) {
    return PATH.resolve(PATH.join(__dirname, ...P));
  };

  types = new (require('intertype')).Intertype();

  // { equals }                = types
  // { HDML }                  = require 'hdml'

  //-----------------------------------------------------------------------------------------------------------
  demo = function() {
    var PDF, source_path;
    PDF = require('pdf-lib');
    source_path = resolve('../../../assets/pdf-booklet/16-page-booklet.pdf');
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await demo());
    })();
  }

}).call(this);

//# sourceMappingURL=main.js.map