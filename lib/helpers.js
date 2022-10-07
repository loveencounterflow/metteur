(function() {
  'use strict';
  this.mm_from_pt = function(pt) {
    return pt / 72 * 25.4;
  };

  this.pt_from_mm = function(mm) {
    return mm / 25.4 * 72;
  };

}).call(this);

//# sourceMappingURL=helpers.js.map