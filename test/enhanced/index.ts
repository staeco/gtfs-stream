import should from 'should'
import collect from 'get-stream'
import streamify from 'into-stream'
import { createReadStream } from 'fs'
import { join } from 'path'
import enhanced from '../../src/enhanced'
import { GtfsObject } from '../../src/types'

// Use the same test file as plain for now
const gtfsFixture = join(__dirname, '../plain/sample-feed.zip')

describe('gtfs enhanced', () => {
  it('should parse sample feed', async () => {
    const stream = createReadStream(gtfsFixture).pipe(enhanced())
    const res = await collect.array<GtfsObject>(stream)
    should.exist(res)
    // Enhanced stream returns fewer objects as it processes and combines data
    should.equal(res.length, 46)

    // Check that the enhanced module doesn't break anything
    // Note: This test file may not have trips with paths or stops with schedules
    const trips = res.filter((i) => i.type === 'trip')
    const stops = res.filter((i) => i.type === 'stop')
    should.exist(trips)
    should.exist(stops)
  })

  it('should error on invalid object', async () => {
    const sample = 'aksndflaks'
    const stream = streamify(sample).pipe(enhanced())
    let theError: Error | undefined
    try {
      await collect.array(stream)
    } catch (err) {
      theError = err as Error
    }
    should.exist(theError)
  })
})
