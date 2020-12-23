"use strict";

exports.__esModule = true;
exports.default = void 0;

var _pumpify = _interopRequireDefault(require("pumpify"));

var _merge = _interopRequireDefault(require("merge2"));

var _duplexify = _interopRequireDefault(require("duplexify"));

var _path = require("path");

var _through = _interopRequireDefault(require("through2"));

var _unzipper = _interopRequireDefault(require("unzipper"));

var _csvParser = _interopRequireDefault(require("csv-parser"));

var _pluralize = require("pluralize");

var _stream = require("stream");

var _removeBomStream = _interopRequireDefault(require("remove-bom-stream"));

var _lodash = _interopRequireDefault(require("lodash.pickby"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// light mapping
const mapValues = ({
  value
}) => {
  if (value === '') return; // parse numbers unless it contains - in the middle

  const n = value.indexOf('-') < 1 && parseFloat(value);
  if (typeof n === 'number' && !isNaN(n)) return n;
  return value;
};

var _default = ({
  raw = false
} = {}) => {
  const out = (0, _merge.default)({
    end: false
  });

  const dataStream = _pumpify.default.obj(_unzipper.default.Parse(), _through.default.obj((entry, _, cb) => {
    const ext = (0, _path.extname)(entry.path);

    if (ext !== '.txt') {
      entry.autodrain();
      return cb();
    }

    const type = (0, _pluralize.singular)((0, _path.basename)(entry.path, ext));

    const file = _pumpify.default.obj(entry, (0, _removeBomStream.default)(), (0, _csvParser.default)(raw ? undefined : {
      mapValues
    }), _through.default.obj((data, _, cb) => {
      cb(null, {
        type,
        data: (0, _lodash.default)(data)
      }); // to plain js, out of the CSV format
    }));

    out.add(file);
    (0, _stream.finished)(file, cb);
  }));

  (0, _stream.finished)(dataStream, () => {
    out.push(null);
    out.end();
  });
  return _duplexify.default.obj(dataStream, out);
};

exports.default = _default;
module.exports = exports.default;