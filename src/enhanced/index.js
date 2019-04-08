import through2 from 'through2'
import pumpify from 'pumpify'
import eos from 'end-of-stream'
import plain from '../plain'

// everything is streaming but ultimately stops/routes need to wait for their shapes or stop times
// to come in asynchronously, so we do need to keep a buffer of those around while we still let other things process
// if there are more than 10K stops or routes this number will still be too low, but this should cover most cases
const bigStream = through2.ctor({ objectMode: true, highWaterMark: 10000 })

// turn shapes into arrays of coordinates for future reference
const collectShapes = () => {
  const out = through2.obj((o, _, cb) => {
    if (o.type !== 'shape') return cb(null, o) // pass it through
    const id = o.data.shape_id
    const coord = [
      parseFloat(o.data.shape_pt_lon),
      parseFloat(o.data.shape_pt_lat)
    ]
    if (out.data[id]) {
      out.data[id].push(coord)
    } else {
      out.data[id] = [ coord ]
    }
    cb()
  })
  out.data = {}
  out.promise = () =>
    new Promise((resolve, reject) => {
      eos(out, (err) => err ? reject(err) : resolve(out.data))
    })
  return out
}

// turn stop times into arrays for future reference
const collectStopTimes = () => {
  const out = through2.obj((o, _, cb) => {
    if (o.type !== 'stop_time') return cb(null, o) // pass it through
    const stopId = o.data.stop_id
    const routeId = o.data.route_id
    if (out.data.byStop[stopId]) {
      out.data.byStop[stopId].push(o.data)
    } else {
      out.data.byStop[stopId] = [ o.data ]
    }
    if (out.data.byRoute[routeId]) {
      out.data.byRoute[routeId].push(o.data)
    } else {
      out.data.byRoute[routeId] = [ o.data ]
    }
    cb()
  })
  out.data = {
    byRoute: {},
    byStop: {}
  }
  out.promise = () =>
    new Promise((resolve, reject) => {
      eos(out, (err) => err ? reject(err) : resolve(out.data))
    })
  return out
}

// shape everything leaving the stream
const formatObjects = ({ shapeCollector, stopTimeCollector }) => {
  const format = async (o) => {
    // anything with a shape, replace it with the actual shape
    if (o.data.shape_id) {
      const shapes = await shapeCollector()
      o.data.path = {
        type: 'LineString',
        coordinates: shapes[o.data.shape_id]
      }
      delete o.data.shape_id
    }
    if (o.type === 'stop') {
      const times = await stopTimeCollector()
      o.data.schedule = times.byStop[o.data.stop_id]
    }
    if (o.type === 'route') {
      const times = await stopTimeCollector()
      o.data.schedule = times.byRoute[o.data.route_id]
    }
    return o
  }
  return bigStream((o, _, cb) => {
    format(o)
      .then((r) => cb(null, r))
      .catch(cb)
  })
}

export default () => {
  const shapeCollector = collectShapes()
  const stopTimeCollector = collectStopTimes()
  const formatter = formatObjects({
    shapeCollector: shapeCollector.promise,
    stopTimeCollector: stopTimeCollector.promise
  })
  return pumpify.obj(
    plain(),
    shapeCollector,
    stopTimeCollector,
    formatter
  )
}
