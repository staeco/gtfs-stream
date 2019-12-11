"use strict";

exports.__esModule = true;
exports.default = void 0;

var _gtfsRealtimeBindings = require("gtfs-realtime-bindings");

var _through = _interopRequireDefault(require("through2"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = () => {
  let len = 0;
  const chunks = [];
  return _through.default.obj((chunk, enc, cb) => {
    chunks.push(chunk);
    len += chunk.length;
    cb();
  }, function (cb) {
    const fullValue = Buffer.concat(chunks, len);

    try {
      _gtfsRealtimeBindings.transit_realtime.FeedMessage.decode(fullValue).entity.forEach(v => this.push(v));

      return cb();
    } catch (err) {
      return cb(err);
    }
  });
};

exports.default = _default;
module.exports = exports.default;