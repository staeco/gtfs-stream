'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var through2 = require('through2');
var zip = require('unzipper');
var csv = require('csv-parser');
var pluralize = require('pluralize');
var bom = require('remove-bom-stream');
var pickBy = require('lodash.pickby');
var pumpify = require('pumpify');
var gtfsRtBindings = require('gtfs-rt-bindings');

const mapValues = ({ value }) => {
    if (value === '')
        return undefined;
    // parse numbers unless it contains - in the middle
    const n = value.indexOf('-') < 1 && parseFloat(value);
    if (typeof n === 'number' && !isNaN(n))
        return n;
    return value;
};
// Create a transform stream that will process ZIP entries and emit GTFS objects
var plain = ({ raw = false } = {}) => {
    const transform = through2.obj(function (entry, _, callback) {
        const ext = path.extname(entry.path);
        if (ext !== '.txt') {
            entry.autodrain();
            return callback();
        }
        const type = pluralize.singular(path.basename(entry.path, ext));
        const parser = csv(raw ? undefined : { mapValues });
        // Process each entry
        entry
            .pipe(bom())
            .pipe(parser)
            .on('data', (data) => {
            // Push data into the transform stream
            this.push({ type, data: pickBy(data) });
        })
            .on('end', callback)
            .on('error', callback);
    });
    // Create a pipeline that unzips the input and processes entries
    return pumpify.obj(zip.Parse(), transform);
};

var index$1 = () => {
    let len = 0;
    const chunks = [];
    return through2.obj((chunk, _enc, cb) => {
        chunks.push(chunk);
        len += chunk.length;
        cb();
    }, function (cb) {
        const fullValue = Buffer.concat(chunks, len);
        try {
            const feed = gtfsRtBindings.FeedMessage.decode(fullValue);
            if (feed.entity) {
                feed.entity.forEach((entity) => {
                    this.push(entity);
                });
            }
            return cb();
        }
        catch (err) {
            return cb(err);
        }
    });
};

/**
 * Mapping from GTFS numeric route types to human-readable string values
 */
const routeTypes = {
    // Core types - from: https://developers.google.com/transit/gtfs/reference/#routestxt
    '0': 'light rail',
    '1': 'subway',
    '3': 'bus',
    '4': 'ferry',
    '5': 'cable tram',
    '6': 'aerial lift',
    '7': 'funicular',
    // Extended types - from: https://developers.google.com/transit/gtfs/reference/extended-route-types
    '100': 'railway',
    '101': 'high speed rail',
    '102': 'long distance trains',
    '103': 'inter regional rail',
    '104': 'car transport rail',
    '105': 'sleeper rail',
    '106': 'regional rail',
    '107': 'tourist railway',
    '108': 'rail shuttle (within complex)',
    '109': 'suburban railway',
    '110': 'replacement rail',
    '111': 'special rail',
    '112': 'lorry transport rail',
    '113': 'all rails',
    '114': 'cross-country rail',
    '115': 'vehicle transport rail',
    '116': 'rack and pinion railway',
    '117': 'additional rail',
    '200': 'coach',
    '201': 'international coach',
    '202': 'national coach',
    '203': 'shuttle coach',
    '204': 'regional coach',
    '205': 'special coach',
    '206': 'sightseeing coach',
    '207': 'tourist coach',
    '208': 'commuter coach',
    '209': 'all coachs',
    '300': 'suburban railway',
    '400': 'urban railway',
    '401': 'metro',
    '402': 'underground',
    '403': 'urban railway',
    '404': 'all urban railways',
    '405': 'monorail',
    '500': 'metro',
    '600': 'underground',
    '700': 'bus',
    '701': 'regional bus',
    '702': 'express bus',
    '703': 'stopping bus',
    '704': 'local bus',
    '705': 'night bus',
    '706': 'post bus',
    '707': 'special needs bus',
    '708': 'mobility bus',
    '709': 'mobility bus for registered disabled',
    '710': 'sightseeing bus',
    '711': 'shuttle bus',
    '712': 'school bus',
    '713': 'school and public bus',
    '714': 'rail replacement bus',
    '715': 'demand and response bus',
    '716': 'all buss',
    '717': 'share taxi',
    '800': 'trolleybus',
    '900': 'tram',
    '901': 'city tram',
    '902': 'local tram',
    '903': 'regional tram',
    '904': 'sightseeing tram',
    '905': 'shuttle tram',
    '906': 'all trams',
    '907': 'cable tram',
    '1000': 'water transport',
    '1001': 'international car ferry',
    '1002': 'national car ferry',
    '1003': 'regional car ferry',
    '1004': 'local car ferry',
    '1005': 'international passenger ferry',
    '1006': 'national passenger ferry',
    '1007': 'regional passenger ferry',
    '1008': 'local passenger ferry',
    '1009': 'post boat',
    '1010': 'train ferry',
    '1011': 'road-link ferry',
    '1012': 'airport-link ferry',
    '1013': 'car high-speed ferry',
    '1014': 'passenger high-speed ferry',
    '1015': 'sightseeing boat',
    '1016': 'school boat',
    '1017': 'cable-drawn boat',
    '1018': 'river bus',
    '1019': 'scheduled ferry',
    '1020': 'shuttle ferry',
    '1021': 'all water transports',
    '1100': 'air',
    '1101': 'international air',
    '1102': 'domestic air',
    '1103': 'intercontinental air',
    '1104': 'domestic scheduled air',
    '1105': 'shuttle air',
    '1106': 'intercontinental charter air',
    '1107': 'international charter air',
    '1108': 'round-trip charter air',
    '1109': 'sightseeing air',
    '1110': 'helicopter air',
    '1111': 'domestic charter air',
    '1112': 'schengen-area air',
    '1113': 'airship',
    '1114': 'air',
    '1200': 'ferry',
    '1300': 'aerial lift',
    '1301': 'telecabin',
    '1302': 'aerial tramway',
    '1303': 'elevator',
    '1304': 'chair lift',
    '1305': 'drag lift',
    '1306': 'small telecabin',
    '1307': 'all telecabins',
    '1400': 'funicular',
    '1401': 'funicular',
    '1402': 'all funicular',
    '1500': 'taxi',
    '1501': 'communal taxi',
    '1502': 'water taxi',
    '1503': 'rail taxi',
    '1504': 'bike taxi',
    '1505': 'licensed taxi',
    '1506': 'private hire vehicle',
    '1507': 'taxi',
    '1600': 'self drive',
    '1601': 'hire car',
    '1602': 'hire van',
    '1603': 'hire motorbike',
    '1604': 'hire cycle',
    '1700': 'miscellaneous'
};

/**
 * Mapping from GTFS numeric location types to human-readable string values
 */
const locationTypes = {
    '0': 'stop',
    '1': 'station',
    '2': 'station entrance',
    '3': 'generic node',
    '4': 'boarding area'
};

const wheelchairTypes = {
    '0': 'unknown_or_inherit',
    '1': 'accessible',
    '2': 'not_accessible'
};

const shouldQueue = (o) => {
    var _a, _b, _c, _d;
    return Boolean(((_a = o.data) === null || _a === void 0 ? void 0 : _a.shape_id) ||
        o.type === 'stop' ||
        ((_b = o.data) === null || _b === void 0 ? void 0 : _b.route_type) ||
        ((_c = o.data) === null || _c === void 0 ? void 0 : _c.location_type) ||
        ((_d = o.data) === null || _d === void 0 ? void 0 : _d.wheelchair_boarding));
};
var index = () => {
    // Data storage
    const shapes = {};
    const stopTimes = {};
    const waitingObjects = [];
    // Create a transform stream that enriches GTFS data
    const enhancer = through2.obj(function (obj, _, callback) {
        // Collect shapes
        if (obj.type === 'shape') {
            obj.data = obj.data;
            const id = obj.data.shape_id;
            // Ensure shape_pt_lon and shape_pt_lat are numbers
            const shapePtLon = typeof obj.data.shape_pt_lon === 'number'
                ? obj.data.shape_pt_lon
                : parseFloat(String(obj.data.shape_pt_lon));
            const shapePtLat = typeof obj.data.shape_pt_lat === 'number'
                ? obj.data.shape_pt_lat
                : parseFloat(String(obj.data.shape_pt_lat));
            const coord = [shapePtLon, shapePtLat];
            if (shapes[id]) {
                shapes[id].push(coord);
            }
            else {
                shapes[id] = [coord];
            }
            return callback();
        }
        // Collect stop times
        if (obj.type === 'stop_time') {
            obj.data = obj.data;
            const stopId = obj.data.stop_id;
            if (stopId) {
                if (stopTimes[stopId]) {
                    stopTimes[stopId].push(obj.data);
                }
                else {
                    stopTimes[stopId] = [obj.data];
                }
            }
            return callback();
        }
        // Queue objects that need post-processing
        if (shouldQueue(obj)) {
            waitingObjects.push(obj);
            return callback();
        }
        // Pass through other objects immediately
        this.push(obj);
        callback();
    }, function (cb) {
        // Process all queued objects now that we have all the data
        waitingObjects.forEach((obj) => {
            // Enhance with shape data if available
            if (obj.type === 'trip') {
                obj.data = obj.data;
                if (obj.data.shape_id && shapes[obj.data.shape_id]) {
                    // @ts-expect-error - path property does not exist on Trip type
                    obj.data.path = {
                        type: 'LineString',
                        coordinates: shapes[obj.data.shape_id]
                    };
                }
            }
            if (obj.type === 'stop') {
                obj.data = obj.data;
                // Add schedules to stops
                if (obj.data.stop_id && stopTimes[obj.data.stop_id]) {
                    // @ts-expect-error - schedule property does not exist on Stop type
                    obj.data.schedule = stopTimes[obj.data.stop_id];
                }
                // Convert location types to human-readable strings
                if (obj.data.location_type !== undefined) {
                    const locationTypeKey = String(obj.data.location_type || '0');
                    const humanLocationType = locationTypes[locationTypeKey];
                    if (humanLocationType)
                        obj.data.location_type = humanLocationType;
                }
                // Convert wheelchair boarding to boolean if it exists
                if (obj.data.wheelchair_boarding !== undefined) {
                    const wheelchairKey = String(obj.data.wheelchair_boarding);
                    obj.data.wheelchair_boarding = wheelchairTypes[wheelchairKey];
                }
            }
            // Convert route types to human-readable strings
            if (obj.type == 'route') {
                obj.data = obj.data;
                if (obj.data.route_type !== undefined) {
                    const routeTypeKey = String(obj.data.route_type);
                    const humanRouteType = routeTypes[routeTypeKey];
                    if (humanRouteType)
                        obj.data.route_type = humanRouteType;
                }
            }
            // Convert route types to human-readable strings
            if (obj.type == 'route') {
                obj.data = obj.data;
                if (obj.data.route_type !== undefined) {
                    const vehicleTypeKey = String(obj.data.route_type);
                    const humanVehicleType = routeTypes[vehicleTypeKey];
                    if (humanVehicleType)
                        obj.data.route_type = humanVehicleType;
                }
            }
            this.push(obj);
        });
        cb();
    });
    // Create a pipeline that parses the GTFS feed and then enhances it
    return pumpify.obj(plain(), enhancer);
};

exports.default = plain;
exports.enhanced = index;
exports.plain = plain;
exports.rt = index$1;
//# sourceMappingURL=index.js.map
