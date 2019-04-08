import pumpify from 'pumpify'
import merge from 'merge2'
import duplexify from 'duplexify'
import { basename, extname } from 'path'
import through2 from 'through2'
import zip from 'unzipper'
import csv from 'csv-parser'
import { singular } from 'pluralize'
import eos from 'end-of-stream'
import bom from 'remove-bom-stream'

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
      const type = singular(basename(entry.path, ext))
      const file = pumpify.obj(
        entry,
        bom(),
        csv(),
        through2.obj((data, _, cb) => {
          cb(null, { type, data })
        }))
      out.add(file)
      eos(file, cb)
    }))

  eos(dataStream, () => {
    out.push(null)
    out.end()
  })
  return duplexify.obj(dataStream, out)
}
