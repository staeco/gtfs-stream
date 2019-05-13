'use strict';

exports.__esModule = true;

var _pumpify = require('pumpify');

var _pumpify2 = _interopRequireDefault(_pumpify);

var _merge = require('merge2');

var _merge2 = _interopRequireDefault(_merge);

var _duplexify = require('duplexify');

var _duplexify2 = _interopRequireDefault(_duplexify);

var _path = require('path');

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _unzipper = require('unzipper');

var _unzipper2 = _interopRequireDefault(_unzipper);

var _csvParser = require('csv-parser');

var _csvParser2 = _interopRequireDefault(_csvParser);

var _pluralize = require('pluralize');

var _stream = require('stream');

var _removeBomStream = require('remove-bom-stream');

var _removeBomStream2 = _interopRequireDefault(_removeBomStream);

var _lodash = require('lodash.pickby');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// light mapping
const mapValues = ({ value }) => {
  if (value === '') return;
  // parse numbers unless it contains - in the middle
  const n = value.indexOf('-') < 1 && parseFloat(value);
  if (typeof n === 'number' && !isNaN(n)) return n;
  return value;
};

exports.default = ({ raw = false } = {}) => {
  const out = (0, _merge2.default)({ end: false });

  const dataStream = _pumpify2.default.obj(_unzipper2.default.Parse(), _through2.default.obj((entry, _, cb) => {
    const ext = (0, _path.extname)(entry.path);
    if (ext !== '.txt') {
      entry.autodrain();
      return cb();
    }
    const type = (0, _pluralize.singular)((0, _path.basename)(entry.path, ext));
    const file = _pumpify2.default.obj(entry, (0, _removeBomStream2.default)(), (0, _csvParser2.default)(raw ? undefined : { mapValues }), _through2.default.obj((data, _, cb) => {
      cb(null, { type, data: (0, _lodash2.default)(data) }); // to plain js, out of the CSV format
    }));
    out.add(file);
    (0, _stream.finished)(file, cb);
  }));

  (0, _stream.finished)(dataStream, () => {
    out.push(null);
    out.end();
  });
  return _duplexify2.default.obj(dataStream, out);
};

module.exports = exports.default;