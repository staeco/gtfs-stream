import should from 'should'
import collect from 'get-stream'
import streamify from 'into-stream'
import { createReadStream } from 'fs'
import { join } from 'path'
import plain from '../../src/plain'

const gtfsFixture = join(__dirname, 'sample-feed-zip')

describe.skip('gtfs plain', () => {
  it('should parse a feed', async () => {
    const stream = createReadStream(gtfsFixture).pipe(plain())
    const res = await collect.array(stream)
    should.exist(res)
    console.log(res)
  })
  it('should error on invalid object', async () => {
    const sample = 'aksndflaks'
    const stream = streamify(sample).pipe(plain())
    let theError
    try {
      await collect.array(stream)
    } catch (err) {
      theError = err
    }
    should.exist(theError)
  })
})
