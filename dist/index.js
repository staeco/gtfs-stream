"use strict";

exports.__esModule = true;
exports.default = void 0;

var _plain = _interopRequireDefault(require("./plain"));

var _enhanced = _interopRequireDefault(require("./enhanced"));

var _rt = _interopRequireDefault(require("./rt"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_plain.default.rt = _rt.default;
_plain.default.enhanced = _enhanced.default;
var _default = _plain.default;
exports.default = _default;
module.exports = exports.default;