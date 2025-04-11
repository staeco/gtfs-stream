import should from 'should'
import collect from 'get-stream'
import streamify from 'into-stream'
import { createReadStream } from 'fs'
import { join } from 'path'
import enhanced from '../../src/enhanced'
import { EnhancedGtfsObject } from '../../src/types'

const gtfsFixture = join(__dirname, 'norway.zip')
const gtfsFixture2 = join(__dirname, 'nyc.zip')

describe('gtfs enhanced', () => {
  it('should parse norway feed', async () => {
    const stream = createReadStream(gtfsFixture).pipe(enhanced())
    const res = await collect.array<EnhancedGtfsObject>(stream)
    should.exist(res)
    should.equal(res.length, 71843)
    const trips = res.filter((i) => i.type === 'trip')
    should(trips.some((i) => i.data.path && i.data.path.coordinates)).equal(true)
    const stops = res.filter((i) => i.type === 'stop')
    should(stops.some((i) => i.data.schedule && i.data.schedule.length)).equal(true)
  })
  it('should parse nyc feed', async () => {
    const stream = createReadStream(gtfsFixture2).pipe(enhanced())
    const res = await collect.array<EnhancedGtfsObject>(stream)
    should.exist(res)
    should.equal(res.length, 32123)
    const trips = res.filter((i) => i.type === 'trip')
    should(trips.some((i) => i.data.path && i.data.path.coordinates)).equal(true)
    const stops = res.filter((i) => i.type === 'stop')
    should(stops.some((i) => i.data.schedule && i.data.schedule.length)).equal(true)
  })
  it('should error on invalid object', async () => {
    const sample = 'aksndflaks'
    const stream = streamify(sample).pipe(enhanced())
    let theError
    try {
      await collect.array<EnhancedGtfsObject>(stream)
    } catch (err) {
      theError = err
    }
    should.exist(theError)
  })
})
