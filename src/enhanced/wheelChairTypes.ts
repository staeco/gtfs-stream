const wheelchairTypes = {
  '0': 'unknown_or_inherit',
  '1': 'accessible',
  '2': 'not_accessible'
}

export type EnhancedWheelchairBoardingType = (typeof wheelchairTypes)[keyof typeof wheelchairTypes]

export default wheelchairTypes
