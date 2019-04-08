import should from 'should'
import collect from 'get-stream'
import streamify from 'into-stream'
import { createReadStream } from 'fs'
import { join } from 'path'
import enhanced from '../../src/enhanced'

const gtfsFixture = join(__dirname, 'norway.zip')

describe('gtfs enhanced', () => {
  it('should parse a feed', async () => {
    const stream = createReadStream(gtfsFixture).pipe(enhanced())
    const res = await collect.array(stream)
    should.exist(res)
    should.equal(res.length, 71843)
    const routes = res.filter((i) => i.type === 'route')
    should(routes.every((i) => i.path && i.path.coordinates && i.schedule && i.schedule.length))
    const trips = res.filter((i) => i.type === 'trip')
    should(trips.every((i) => i.path && i.path.coordinates))
    const stops = res.filter((i) => i.type === 'stop')
    should(stops.every((i) => i.schedule && i.schedule.length))
  })
  it('should error on invalid object', async () => {
    const sample = 'aksndflaks'
    const stream = streamify(sample).pipe(enhanced())
    let theError
    try {
      await collect.array(stream)
    } catch (err) {
      theError = err
    }
    should.exist(theError)
  })
})
