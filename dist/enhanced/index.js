"use strict";

exports.__esModule = true;
exports.default = void 0;

var _through = _interopRequireDefault(require("through2"));

var _pumpify = _interopRequireDefault(require("pumpify"));

var _routeTypes = _interopRequireDefault(require("./routeTypes"));

var _locationTypes = _interopRequireDefault(require("./locationTypes"));

var _wheelChairTypes = _interopRequireDefault(require("./wheelChairTypes"));

var _plain = _interopRequireDefault(require("../plain"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// turn shapes into arrays of coordinates for future reference
const collectShapes = () => {
  const out = _through.default.obj((o, _, cb) => {
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
}; // turn stop times into arrays for future reference


const collectStopTimes = () => {
  const out = _through.default.obj((o, _, cb) => {
    if (o.type !== 'stop_time') return cb(null, o); // pass it through

    const stopId = o.data.stop_id;

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
}; // shape everything leaving the stream


const queue = o => o.data.shape_id || o.type === 'stop' || o.data.route_type || o.data.location_type || o.data.vehicle_type || o.data.wheelchair_boarding;

const formatObjects = ({
  shapes,
  stopTimes
}) => {
  const format = o => {
    // anything with a shape, replace it with the actual shape
    if (o.data.shape_id) {
      o.data.path = {
        type: 'LineString',
        coordinates: shapes[o.data.shape_id]
      };
    } // schedules


    if (o.type === 'stop') {
      const times = stopTimes[o.data.stop_id];
      if (times) o.data.schedule = times;
    }

    if (o.data.route_type) {
      const humanRouteType = _routeTypes.default[o.data.route_type];
      if (humanRouteType) o.data.route_type = humanRouteType.toLowerCase();
    }

    if (o.data.vehicle_type) {
      const humanVehicleType = _routeTypes.default[o.data.vehicle_type];
      if (humanVehicleType) o.data.vehicle_type = humanVehicleType.toLowerCase();
    }

    if (o.data.location_type) {
      const humanLocationType = _locationTypes.default[o.data.location_type || '0'];
      if (humanLocationType) o.data.location_type = humanLocationType.toLowerCase();
    }

    if (o.data.wheelchair_boarding) {
      o.data.wheelchair_boarding = _wheelChairTypes.default[o.data.wheelchair_boarding];
    }

    return o;
  };

  const waiting = [];
  return _through.default.obj((o, _, cb) => {
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

var _default = () => {
  const shapeCollector = collectShapes();
  const stopTimeCollector = collectStopTimes();
  const formatter = formatObjects({
    shapes: shapeCollector.data,
    stopTimes: stopTimeCollector.data
  });
  return _pumpify.default.obj((0, _plain.default)(), shapeCollector, stopTimeCollector, formatter);
};

exports.default = _default;
module.exports = exports.default;