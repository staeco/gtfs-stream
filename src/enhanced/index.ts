import { Transform } from 'stream'
import through2 from 'through2'
import pumpify from 'pumpify'
import routeTypes from './routeTypes'
import locationTypes from './locationTypes'
import wheelchairTypes from './wheelChairTypes'
import plain from '../plain'
import { EnhancedGtfsObject, EnhancedGtfsData, GtfsObject } from '../types'
import { Route, Shapes, Stop, StopTime } from 'gtfs-types'

export interface GtfsShapesCollector extends Transform {
  data: {
    [shapeId: string]: number[][]
  }
}

export interface GtfsStopTimesCollector extends Transform {
  data: {
    [stopId: string]: StopTime[]
  }
}

const shouldQueue = (o: any): boolean =>
  Boolean(
    o.data?.shape_id ||
      o.type === 'stop' ||
      o.data?.route_type ||
      o.data?.location_type ||
      o.data?.wheelchair_boarding
  )

export default (): Transform => {
  // Data storage
  const shapes: GtfsShapesCollector['data'] = {}
  const stopTimes: GtfsStopTimesCollector['data'] = {}
  const waitingObjects: GtfsObject[] = []
  let _processingDone = false

  // Create a transform stream that enriches GTFS data
  const enhancer = through2.obj(
    function (obj: GtfsObject, _: unknown, callback: through2.TransformCallback) {
      // Collect shapes
      if (obj.type === 'shape') {
        obj.data = obj.data as Shapes
        const id = obj.data.shape_id

        // Ensure shape_pt_lon and shape_pt_lat are numbers
        const shapePtLon =
          typeof obj.data.shape_pt_lon === 'number'
            ? obj.data.shape_pt_lon
            : parseFloat(String(obj.data.shape_pt_lon))

        const shapePtLat =
          typeof obj.data.shape_pt_lat === 'number'
            ? obj.data.shape_pt_lat
            : parseFloat(String(obj.data.shape_pt_lat))

        const coord: [number, number] = [shapePtLon, shapePtLat]

        if (shapes[id]) {
          shapes[id].push(coord)
        } else {
          shapes[id] = [coord]
        }
        return callback()
      }

      // Collect stop times
      if (obj.type === 'stop_time') {
        obj.data = obj.data as StopTime
        const stopId = obj.data.stop_id as string
        if (stopId) {
          if (stopTimes[stopId]) {
            stopTimes[stopId].push(obj.data as StopTime)
          } else {
            stopTimes[stopId] = [obj.data as StopTime]
          }
        }
        return callback()
      }

      // Queue objects that need post-processing
      if (shouldQueue(obj)) {
        waitingObjects.push(obj)
        return callback()
      }

      // Pass through other objects immediately
      this.push(obj)
      callback()
    },
    function (cb: through2.TransformCallback) {
      _processingDone = true

      // Process all queued objects now that we have all the data
      waitingObjects.forEach((obj) => {
        // Enhance with shape data if available
        if (obj.type === 'shape') {
          obj.data = obj.data as Shapes
          if (obj.data.shape_id && shapes[obj.data.shape_id]) {
            // @ts-ignore
            obj.data.path = {
              type: 'LineString',
              coordinates: shapes[obj.data.shape_id]
            }
          }
        }

        if (obj.type === 'stop') {
          obj.data = obj.data as Stop

          // Add schedules to stops
          if (obj.data.stop_id && stopTimes[obj.data.stop_id]) {
            // @ts-ignore
            obj.data.schedule = stopTimes[obj.data.stop_id]
          }

          // Convert location types to human-readable strings
          if (obj.data.location_type !== undefined) {
            const locationTypeKey = String(obj.data.location_type || '0')
            const humanLocationType = locationTypes[locationTypeKey]
            if (humanLocationType) obj.data.location_type = humanLocationType
          }

          // Convert wheelchair boarding to boolean if it exists
          if (obj.data.wheelchair_boarding !== undefined) {
            const wheelchairKey = String(obj.data.wheelchair_boarding)
            obj.data.wheelchair_boarding = wheelchairTypes[wheelchairKey]
          }
        }

        // Convert route types to human-readable strings
        if (obj.type == 'route') {
          obj.data = obj.data as Route
          if (obj.data.route_type !== undefined) {
            const routeTypeKey = String(obj.data.route_type)
            const humanRouteType = routeTypes[routeTypeKey]
            if (humanRouteType) obj.data.route_type = humanRouteType
          }
        }

        // Convert route types to human-readable strings
        if (obj.type == 'route') {
          obj.data = obj.data as Route
          if (obj.data.route_type !== undefined) {
            const vehicleTypeKey = String(obj.data.route_type)
            const humanVehicleType = routeTypes[vehicleTypeKey]
            if (humanVehicleType) obj.data.route_type = humanVehicleType
          }
        }

        this.push(obj)
      })

      cb()
    }
  )

  // Create a pipeline that parses the GTFS feed and then enhances it
  return pumpify.obj(plain(), enhancer)
}
