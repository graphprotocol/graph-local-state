import { makeExecutableSchema } from '@graphql-tools/schema'
import { db } from './context'
import { Resolvers } from './generated/graphql'

const typeDefs = /* GraphQL */ `
  type Query {
    _DATABASE_NAME: String!
    countries: [Country]
  }

  type Mutation {
    addCountry(name: String!): Country
    addState(name: String!, countryId: ID!): State
  }

  type Country {
    id: ID!
    name: String!
    code: String
    states: [State]
  }

  type State {
    id: ID!
    name: String!
    cities: [City]
  }

  type City {
    id: ID!
    name: String!
  }
`

const resolvers: Resolvers = {
  Query: {
    _DATABASE_NAME: async () => {
      const info = await db.info()
      return info.db_name
    },
    countries: async () => {
      const { countries } = await db.rel.find('country')
      return countries
    },
  },
  Mutation: {
    addCountry: async (_, { name }) => {
      console.log('[mut]addCountry ', name)
      const country = await db.rel.save('country', { name })
      return country
    },
    addState: async (_, { name, countryId }) => {
      console.log('[mut] addState', name, countryId)
      const state = await db.rel.save('state', { name, country: [countryId] })

      db.rel.find('country', countryId).then(async (country) => {
        console.log(country)
        // await db.rel.save('country', { ...country[0], states: [state.id] })
      })
      // db.rel.save('country', { ...country[0], states: [state.id] })
      console.log(state)
      return state
    },
  },
}

export default makeExecutableSchema({ typeDefs, resolvers })
