import { basename, extname } from 'path'
import { Transform } from 'stream'
import through2 from 'through2'
import zip from 'unzipper'
import csv from 'csv-parser'
import { singular } from 'pluralize'
import bom from 'remove-bom-stream'
import pickBy from 'lodash.pickby'
import { GtfsData } from '../types'
import pumpify from 'pumpify'

interface PlainOptions {
  raw?: boolean
}

const mapValues = ({ value }: { value: string }): string | number => {
  if (value === '') return undefined
  // parse numbers unless it contains - in the middle
  const n = value.indexOf('-') < 1 && parseFloat(value)
  if (typeof n === 'number' && !isNaN(n)) return n
  return value
}

// Create a transform stream that will process ZIP entries and emit GTFS objects
export default ({ raw = false }: PlainOptions = {}): Transform => {
  const transform = through2.obj(function (
    entry: zip.Entry,
    _: unknown,
    callback: through2.TransformCallback
  ) {
    const ext = extname(entry.path)
    if (ext !== '.txt') {
      entry.autodrain()
      return callback()
    }

    const type = singular(basename(entry.path, ext))
    const parser = csv(raw ? undefined : { mapValues })

    // Process each entry
    entry
      .pipe(bom())
      .pipe(parser)
      .on('data', (data: Record<string, unknown>) => {
        // Push data into the transform stream
        this.push(pickBy(data) as GtfsData)
      })
      .on('end', callback)
      .on('error', callback)
  })

  // Create a pipeline that unzips the input and processes entries
  return pumpify.obj(zip.Parse(), transform)
}
