import PouchDB from 'pouchdb-browser'
import rel from 'relational-pouch'
import find from 'pouchdb-find'

PouchDB.plugin(find).plugin(rel)

const db = new PouchDB('graphql-example')

db.setSchema([
  {
    singular: 'country',
    plural: 'countries',
    relations: {
      states: { hasMany: 'state' },
    },
  },
  {
    singular: 'state',
    plural: 'states',
    relations: {
      country: { belongsTo: 'country' },
      cities: { hasMany: 'city' },
    },
  },
  {
    singular: 'city',
    plural: 'cities',
    relations: {
      state: { belongsTo: 'state' },
    },
  },
])

export { db }
// db.rel.save('country', {
//   name: 'United States',
// })

// db.rel.save('country', {
//   name: 'Canada',
// })

export type GraphQLContext = {
  db: PouchDB.Database
}

export const buildContext = (): GraphQLContext => {
  return {
    db,
  }
}
