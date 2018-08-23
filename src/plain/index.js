import duplexify from 'duplexify'
import pump from 'pump'
import { basename, extname } from 'path'
import through2 from 'through2'
import zip from 'unzipper'
import csv from 'csv-parser'
import { singular } from 'pluralize'
import eos from 'end-of-stream'

export default () => {
  const out = through2.obj()
  const unzip = zip.Parse()
  unzip.on('entry', (entry) => {
    const ext = extname(entry.path)
    if (ext !== '.txt') return entry.autodrain()
    const thisFile = pump(
      entry,
      csv(),
      through2.obj((data, _, cb) => {
        cb(null, {
          type: singular(basename(entry.path, ext)),
          data
        })
      }))
    thisFile.pipe(out, { end: false })
  })

  eos(unzip, () => {
    out.push(null)
  })
  return duplexify.obj(unzip, out, { end: false })
}
