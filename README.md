<p align='center'>
  <img src='https://user-images.githubusercontent.com/425716/44544295-c94d3c00-a6df-11e8-9de1-8166795fda27.png' width='400'/>
  <p align='center'>Streaming GTFS and GTFS-RT parser for node.</p>
</p>

# gtfs-stream [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]


## Install

```
npm install gtfs-stream --save
```

## Plain GTFS

```js
import gtfs from 'gtfs-stream'

request.get('https://developers.google.com/transit/gtfs/examples/sample-feed.zip') // or any other way of getting the data stream
  .pipe(gtfs())
  .on('data', (entity) => {
    console.log(entity)
  })
```

Data events emitted from the GTFS parse stream have the following shape:

- type (String, feed_info, agency, stop, route, trip, stop_time, calendar, calendar_date, fare_attribute, fare_rule, shape, frequency, transfer)
- data (Object)
  - See https://developers.google.com/transit/gtfs/examples/gtfs-feed for the available attributes of each type

If you want the raw rows, you can pass `{ raw: true }` to this function to skip type inference.

## GTFS Enhanced

The base GTFS format is cumbersome to work with, so the enhanced parser will do a little extra work piecing things together to make it more usable. This parser will use more memory than the base parser since it needs to collect rows that need formatting while it waits for other to stream in.

```js
import gtfs from 'gtfs-stream'

request.get('https://developers.google.com/transit/gtfs/examples/sample-feed.zip') // or any other way of getting the data stream
  .pipe(gtfs.enhanced())
  .on('data', (entity) => {
    console.log(entity)
  })
```

- type (String, feed_info, agency, stop, route, trip, calendar, calendar_date, fare_attribute, fare_rule, shape, frequency, transfer)
- data (Object)
  - See https://developers.google.com/transit/gtfs/examples/gtfs-feed for the available attributes of each type

Differences from the base parser:
- `trip` types have a new `path` attribute that is a GeoJSON LineString, and `shape_id` is removed
- `stop` types have a new `schedule` attribute that is a collection of stop times
- `route` types have a human-readable `route_type`
- `stop` types have a human-readable `vehicle_type`, `location_type`, and `wheelchair_boarding`
- No `shape` or `stop_time` types, since they are collected into their relevant entries

## GTFS-RT

```js
import gtfs from 'gtfs-stream'

request.get('http://datamine.mta.info/mta_esi.php') // or any other way of getting the data stream
  .pipe(gtfs.rt())
  .on('data', (entity) => {
    console.log(entity)
  })
```

Data events emitted from the GTFS Realtime parse stream have the following shape:

- id
- is_deleted
- trip_update
  - timestamp
  - delay
  - vehicle
  - stop_time_update
  - trip
    - trip_id
    - route_id
    - direction_id
    - start_time
    - start_date
    - schedule_relationship
- vehicle
  - position
  - current_stop_sequence
  - stop_id
  - current_status
  - timestamp
  - congestion_level
  - occupancy_status
  - trip
    - trip_id
    - route_id
    - direction_id
    - start_time
    - start_date
    - schedule_relationship
- alert
  - active_period
  - informed_entity
  - cause
  - effect
  - url
  - header_text
  - description_text

Only one of either trip_update, vehicle, or alert will be present in any given event.


[downloads-image]: http://img.shields.io/npm/dm/gtfs-stream.svg
[npm-url]: https://npmjs.org/package/gtfs-stream
[npm-image]: http://img.shields.io/npm/v/gtfs-stream.svg
