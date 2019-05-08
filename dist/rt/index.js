'use strict';

exports.__esModule = true;

var _gtfsRealtimeBindings = require('gtfs-realtime-bindings');

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  let len = 0,
      chunks = [];
  return _through2.default.obj((chunk, enc, cb) => {
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

module.exports = exports.default;