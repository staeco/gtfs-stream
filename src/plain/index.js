import pumpify from 'pumpify'
import merge from 'merge2'
import duplexify from 'duplexify'
import { basename, extname } from 'path'
import through2 from 'through2'
import zip from 'unzipper'
import csv from 'csv-parser'
import { singular } from 'pluralize'
import { finished } from 'stream'
import bom from 'remove-bom-stream'
import pickBy from 'lodash.pickby'
import parseNumber from 'parse-decimal-number'

// light mapping
const mapValues = ({ value }) => {
  if (value === '') return
  // parse numbers unless it contains - in the middle
  const n = value.indexOf('-') < 1 && parseNumber(value)
  if (typeof n === 'number' && !isNaN(n)) return n
  return value
}
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
        csv({ mapValues }),
        through2.obj((data, _, cb) => {
          cb(null, { type, data: pickBy(data) }) // to plain js, out of the CSV format
        }))
      out.add(file)
      finished(file, cb)
    }))

  finished(dataStream, () => {
    out.push(null)
    out.end()
  })
  return duplexify.obj(dataStream, out)
}
