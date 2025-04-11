/**
 * Mapping from GTFS numeric location types to human-readable string values
 */
const locationTypes = {
  '0': 'stop',
  '1': 'station',
  '2': 'station entrance',
  '3': 'generic node',
  '4': 'boarding area'
}

/**
 * Define the type for the human-readable location types
 * This creates a union type of all the string values in the locationTypes object
 */
export type EnhancedLocationType = (typeof locationTypes)[keyof typeof locationTypes]

export default locationTypes
