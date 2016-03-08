/// <reference path="../node_modules/rx/ts/rx.all.d.ts" />
var wx;
(function (wx) {
    "use strict";
    (function (RouterLocationChangeMode) {
        RouterLocationChangeMode[RouterLocationChangeMode["add"] = 1] = "add";
        RouterLocationChangeMode[RouterLocationChangeMode["replace"] = 2] = "replace";
    })(wx.RouterLocationChangeMode || (wx.RouterLocationChangeMode = {}));
    var RouterLocationChangeMode = wx.RouterLocationChangeMode;
})(wx || (wx = {}));
//# sourceMappingURL=Interfaces.js.map