import { transit_realtime } from 'gtfs-realtime-bindings'
import through2 from 'through2'

export default () => {
  let len = 0, chunks = []
  return through2.obj((chunk, enc, cb) => {
    chunks.push(chunk)
    len += chunk.length
    cb()
  }, function (cb) {
    const fullValue = Buffer.concat(chunks, len)
    try {
      transit_realtime.FeedMessage.decode(fullValue).entity.forEach((v) => this.push(v))
      return cb()
    } catch (err) {
      return cb(err)
    }
  })
}
