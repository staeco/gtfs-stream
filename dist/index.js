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
var gtfsTypes = require('gtfs-types');

/**
 * CSV mapValues function to convert values to the appropriate types
 */
const mapValues = ({ value }) => {
    if (value === '')
        return undefined;
    // parse numbers unless it contains - in the middle
    const n = value.indexOf('-') < 1 && parseFloat(value);
    if (typeof n === 'number' && !isNaN(n))
        return n;
    return value;
};
/**
 * Helper function to create a plain GTFS object with proper typing
 */
function createPlainObject(type, data) {
    return {
        type,
        data: pickBy(data)
    };
}
/**
 * Creates a transform stream that parses a GTFS feed and emits PlainGtfsObject objects.
 *
 * @param options Options for the parser
 * @returns A transform stream that outputs PlainGtfsObject objects
 */
var plain = ({ raw = false } = {}) => {
    // Create a transform stream that will process ZIP entries and emit GTFS objects
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
            this.push(createPlainObject(type, data));
        })
            .on('end', callback)
            .on('error', callback);
    });
    // Create a pipeline that unzips the input and processes entries
    return pumpify.obj(zip.Parse(), transform);
};

/**
 * Creates a transform stream that parses a GTFS-RT feed and emits Entity objects.
 *
 * @returns A transform stream that outputs GTFS-RT Entity objects
 */
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
                feed.entity.forEach((v) => this.push(v));
            }
            return cb();
        }
        catch (err) {
            return cb(err);
        }
    });
};

/**
 * Human-readable route types that correspond to the gtfs-types VehicleType enum
 */
var EnhancedRouteType;
(function (EnhancedRouteType) {
    EnhancedRouteType["LIGHT_RAIL"] = "light rail";
    EnhancedRouteType["SUBWAY"] = "subway";
    EnhancedRouteType["BUS"] = "bus";
    EnhancedRouteType["FERRY"] = "ferry";
    EnhancedRouteType["CABLE_TRAM"] = "cable tram";
    EnhancedRouteType["AERIAL_LIFT"] = "aerial lift";
    EnhancedRouteType["FUNICULAR"] = "funicular";
    // Extended types could be added here as needed
})(EnhancedRouteType || (EnhancedRouteType = {}));
/**
 * Human-readable location types that correspond to the gtfs-types LocationType enum
 */
var EnhancedLocationType;
(function (EnhancedLocationType) {
    EnhancedLocationType["STOP"] = "stop";
    EnhancedLocationType["STATION"] = "station";
    EnhancedLocationType["ENTRANCE_EXIT"] = "station entrance";
})(EnhancedLocationType || (EnhancedLocationType = {}));

/**
 * Mapping from GTFS numeric route types to human-readable enum values
 */
const routeTypes = {
    // Core types - from: https://developers.google.com/transit/gtfs/reference/#routestxt
    '0': EnhancedRouteType.LIGHT_RAIL,
    '1': EnhancedRouteType.SUBWAY,
    '3': EnhancedRouteType.BUS,
    '4': EnhancedRouteType.FERRY,
    '5': EnhancedRouteType.CABLE_TRAM,
    '6': EnhancedRouteType.AERIAL_LIFT,
    '7': EnhancedRouteType.FUNICULAR,
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
 * Mapping from GTFS numeric location types to human-readable enum values
 */
const locationTypes = {
    '0': EnhancedLocationType.STOP,
    '1': EnhancedLocationType.STATION,
    '2': EnhancedLocationType.ENTRANCE_EXIT
};

const wheelchairTypes = {
    '0': gtfsTypes.WheelchairBoardingType.UNKNOWN_OR_INHERIT,
    '1': gtfsTypes.WheelchairBoardingType.ACCESSIBLE,
    '2': gtfsTypes.WheelchairBoardingType.NOT_ACCESSIBLE
};

/**
 * Helper to check if an object needs to queue for post-processing
 */
const shouldQueue = (o) => Boolean(o.data.shape_id ||
    o.type === 'stop' ||
    o.data.route_type ||
    o.data.location_type ||
    o.data.vehicle_type ||
    o.data.wheelchair_boarding);
/**
 * Creates a transform stream that parses a GTFS feed and emits EnhancedGtfsObject objects.
 *
 * The enhanced stream:
 * - Collects shape points into GeoJSON LineString coordinates
 * - Associates stop times with stops for easy scheduling lookup
 * - Converts numeric route types to human-readable values
 * - Converts numeric location types to human-readable values
 * - Converts numeric wheelchair boarding types to boolean values
 *
 * @returns A transform stream that outputs EnhancedGtfsObject objects
 */
/**
 * Helper function to convert a GtfsObject to an EnhancedGtfsObject
 * This helps TypeScript understand the enhanced nature of our output objects
 */
function enhanceObject(obj) {
    return {
        type: obj.type,
        data: obj.data
    };
}
var index = () => {
    // Data storage
    const shapes = {};
    const stopTimes = {};
    const waitingObjects = [];
    // Create a transform stream that enriches GTFS data
    const enhancer = through2.obj(function (obj, _, callback) {
        // Collect shapes
        if (obj.type === 'shape') {
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
            const stopId = obj.data.stop_id;
            if (stopId) {
                const stopTimeData = obj.data;
                if (stopTimes[stopId]) {
                    stopTimes[stopId].push(stopTimeData);
                }
                else {
                    stopTimes[stopId] = [stopTimeData];
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
        this.push(enhanceObject(obj));
        callback();
    }, function (cb) {
        // Process all queued objects now that we have all the data
        waitingObjects.forEach((obj) => {
            // Enhance with shape data if available
            if (obj.data.shape_id && shapes[obj.data.shape_id]) {
                obj.data.path = {
                    type: 'LineString',
                    coordinates: shapes[obj.data.shape_id]
                };
            }
            // Add schedules to stops
            if (obj.type === 'stop' && obj.data.stop_id && stopTimes[obj.data.stop_id]) {
                obj.data.schedule = stopTimes[obj.data.stop_id];
            }
            // Convert route types to human-readable strings
            if (obj.data.route_type !== undefined) {
                const routeTypeKey = String(obj.data.route_type);
                const humanRouteType = routeTypes[routeTypeKey];
                if (humanRouteType) {
                    // Use type assertion to treat the string as our enum type
                    // and then tell TypeScript it's compatible with the expected types
                    obj.data.route_type = humanRouteType;
                }
            }
            // Convert vehicle types to human-readable strings
            if (obj.data.vehicle_type !== undefined) {
                const vehicleTypeKey = String(obj.data.vehicle_type);
                const humanVehicleType = routeTypes[vehicleTypeKey];
                if (humanVehicleType) {
                    obj.data.vehicle_type = humanVehicleType;
                }
            }
            // Convert location types to human-readable strings
            if (obj.data.location_type !== undefined) {
                const locationTypeKey = String(obj.data.location_type || '0');
                const humanLocationType = locationTypes[locationTypeKey];
                if (humanLocationType) {
                    obj.data.location_type = humanLocationType;
                }
            }
            // Convert wheelchair boarding to boolean or null
            if (obj.data.wheelchair_boarding !== undefined) {
                const wheelchairKey = String(obj.data.wheelchair_boarding);
                obj.data.wheelchair_boarding = wheelchairTypes[wheelchairKey];
            }
            this.push(enhanceObject(obj));
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
