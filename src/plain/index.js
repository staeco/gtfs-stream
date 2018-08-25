import pumpify from 'pumpify'
import merge from 'merge2'
import duplexify from 'duplexify'
import { basename, extname } from 'path'
import through2 from 'through2'
import zip from 'unzipper'
import csv from 'csv-parser'
import { singular } from 'pluralize'
import eos from 'end-of-stream'

export default () => {
  const out = merge({ end: false })

  const dataStream = pumpify.obj(
    zip.Parse(),
    through2.obj((entry, _, cb) => {
      const ext = extname(entry.path)
      if (ext !== '.txt') {
        entry.autodrain()
        return cb()
      }
      const file = pumpify.obj(
        entry,
        csv(),
        through2.obj((data, _, cb) => {
          cb(null, {
            type: singular(basename(entry.path, ext)),
            data
          })
        }))
      out.add(file)
      eos(file, cb)
    }))

  eos(dataStream, () => out.push(null))
  return duplexify.obj(dataStream, out, { end: false })
}
