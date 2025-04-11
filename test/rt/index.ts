import should from 'should'
import collect from 'get-stream'
import streamify from 'into-stream'
import { createReadStream } from 'fs'
import { join } from 'path'
import rt from '../../src/rt'

const rtFixture = join(__dirname, 'gtfsrt.feed')

interface RtEntity {
  id: string
  [key: string]: unknown
}

describe('gtfs realtime', () => {
  it('should parse a feed', async () => {
    const stream = createReadStream(rtFixture).pipe(rt())
    const res = await collect.array<RtEntity>(stream)
    should.exist(res)
    res.length.should.equal(471)
    res[0].id.should.equal('000001')
  })
  it('should error on invalid object', async () => {
    const sample = 'aksndflaks'
    const stream = streamify(sample).pipe(rt())
    let theError: Error | undefined
    try {
      await collect.array(stream)
    } catch (err) {
      theError = err as Error
    }
    should.exist(theError)
  })
})
