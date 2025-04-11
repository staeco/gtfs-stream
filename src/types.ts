import { GtfsFiles, StopTime } from 'gtfs-types'

import { Entity } from 'gtfs-rt-bindings'

import type { EnhancedRouteType } from './enhanced/routeTypes'
import type { EnhancedLocationType } from './enhanced/locationTypes'
import type { EnhancedWheelchairBoardingType } from './enhanced/wheelChairTypes'

export type GtfsData = GtfsFiles[keyof GtfsFiles]
export type GtfsRtObject = Entity

// Would be nice to improve this, but the pain of redoing GtfsData and having specific overrides seems not worth it
export type EnhancedGtfsData = GtfsData & {
  location_type?: EnhancedLocationType
  wheelchair_boarding?: EnhancedWheelchairBoardingType
  route_type?: EnhancedRouteType
  schedule?: StopTime[]
  path?: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export interface GtfsObject {
  type: string
  data: GtfsData
}

export interface EnhancedGtfsObject {
  type: string
  data: EnhancedGtfsData
}
