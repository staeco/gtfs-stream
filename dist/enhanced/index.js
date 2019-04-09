'use strict';

exports.__esModule = true;

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _pumpify = require('pumpify');

var _pumpify2 = _interopRequireDefault(_pumpify);

var _routeTypes = require('./routeTypes');

var _routeTypes2 = _interopRequireDefault(_routeTypes);

var _locationTypes = require('./locationTypes');

var _locationTypes2 = _interopRequireDefault(_locationTypes);

var _wheelChairTypes = require('./wheelChairTypes');

var _wheelChairTypes2 = _interopRequireDefault(_wheelChairTypes);

var _plain = require('../plain');

var _plain2 = _interopRequireDefault(_plain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// turn shapes into arrays of coordinates for future reference
const collectShapes = () => {
  const out = _through2.default.obj((o, _, cb) => {
    if (o.type !== 'shape') return cb(null, o); // pass it through
    const id = o.data.shape_id;
    const coord = [o.data.shape_pt_lon, o.data.shape_pt_lat];
    if (out.data[id]) {
      out.data[id].push(coord);
    } else {
      out.data[id] = [coord];
    }
    cb();
  });
  out.data = {};
  return out;
};

// turn stop times into arrays for future reference
const collectStopTimes = () => {
  const out = _through2.default.obj((o, _, cb) => {
    if (o.type !== 'stop_time') return cb(null, o); // pass it through
    const stopId = o.data.stop_id;
    //console.log('stop id', stopId)
    if (stopId) {
      if (out.data[stopId]) {
        out.data[stopId].push(o.data);
      } else {
        out.data[stopId] = [o.data];
      }
    }
    cb();
  });
  out.data = {};
  return out;
};

// shape everything leaving the stream
const queue = o => o.data.shape_id || o.type === 'stop' || o.data.route_type || o.data.location_type || o.data.vehicle_type || o.data.wheelchair_boarding;

const formatObjects = ({ shapes, stopTimes }) => {
  const format = o => {
    // anything with a shape, replace it with the actual shape
    if (o.data.shape_id) {
      o.data.path = {
        type: 'LineString',
        coordinates: shapes[o.data.shape_id]
      };
    }
    // schedules
    if (o.type === 'stop') {
      //console.log('fmt stopid', o.data.stop_id)
      const times = stopTimes[o.data.stop_id];
      if (times) o.data.schedule = times;
    }
    if (o.data.route_type) {
      const humanRouteType = _routeTypes2.default[o.data.route_type];
      if (humanRouteType) o.data.route_type = humanRouteType.toLowerCase();
    }
    if (o.data.vehicle_type) {
      const humanVehicleType = _routeTypes2.default[o.data.vehicle_type];
      if (humanVehicleType) o.data.vehicle_type = humanVehicleType.toLowerCase();
    }
    if (o.data.location_type) {
      const humanLocationType = _locationTypes2.default[o.data.location_type || '0'];
      if (humanLocationType) o.data.location_type = humanLocationType.toLowerCase();
    }
    if (o.data.wheelchair_boarding) {
      o.data.wheelchair_boarding = _wheelChairTypes2.default[o.data.wheelchair_boarding];
    }
    return o;
  };

  const waiting = [];
  return _through2.default.obj((o, _, cb) => {
    const shouldQueue = queue(o);
    if (shouldQueue) {
      waiting.push(o);
      return cb();
    }
    cb(null, o);
  }, function (cb) {
    waiting.forEach(w => {
      this.push(format(w));
    });
    cb();
  });
};

exports.default = () => {
  const shapeCollector = collectShapes();
  const stopTimeCollector = collectStopTimes();
  const formatter = formatObjects({
    shapes: shapeCollector.data,
    stopTimes: stopTimeCollector.data
  });
  return _pumpify2.default.obj((0, _plain2.default)(), shapeCollector, stopTimeCollector, formatter);
};

module.exports = exports.default;