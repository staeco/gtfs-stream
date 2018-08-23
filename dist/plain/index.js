'use strict';

exports.__esModule = true;

var _duplexify = require('duplexify');

var _duplexify2 = _interopRequireDefault(_duplexify);

var _pump = require('pump');

var _pump2 = _interopRequireDefault(_pump);

var _path = require('path');

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _unzipper = require('unzipper');

var _unzipper2 = _interopRequireDefault(_unzipper);

var _csvParser = require('csv-parser');

var _csvParser2 = _interopRequireDefault(_csvParser);

var _pluralize = require('pluralize');

var _endOfStream = require('end-of-stream');

var _endOfStream2 = _interopRequireDefault(_endOfStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const out = _through2.default.obj();
  const unzip = _unzipper2.default.Parse();
  unzip.on('entry', entry => {
    const ext = (0, _path.extname)(entry.path);
    if (ext !== '.txt') return entry.autodrain();
    const thisFile = (0, _pump2.default)(entry, (0, _csvParser2.default)(), _through2.default.obj((data, _, cb) => {
      cb(null, {
        type: (0, _pluralize.singular)((0, _path.basename)(entry.path, ext)),
        data
      });
    }));
    thisFile.pipe(out, { end: false });
  });

  (0, _endOfStream2.default)(unzip, () => {
    out.push(null);
  });
  return _duplexify2.default.obj(unzip, out, { end: false });
};

module.exports = exports['default'];