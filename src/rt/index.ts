import { FeedMessage } from 'gtfs-rt-bindings'
import through2 from 'through2'
import { Transform } from 'stream'
import { GtfsRtObject } from '../types'

export default (): Transform => {
  let len = 0
  const chunks: Buffer[] = []
  return through2.obj(
    (chunk: Buffer, _enc: string, cb: through2.TransformCallback) => {
      chunks.push(chunk)
      len += chunk.length
      cb()
    },
    function (cb: through2.TransformCallback) {
      const fullValue = Buffer.concat(chunks, len)
      try {
        const feed = FeedMessage.decode(fullValue)
        if (feed.entity) {
          feed.entity.forEach((entity: GtfsRtObject) => {
            this.push(entity)
          })
        }
        return cb()
      } catch (err) {
        return cb(err)
      }
    }
  )
}
