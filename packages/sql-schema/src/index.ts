import { loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { Kind, parse, visit } from 'graphql'
import { camelCase } from 'lodash'

const typeDefs = /* GraphQL */ `
  directive @derivedFrom(field: String!) on FIELD_DEFINITION

  type Country {
    name: String!
    code: String!
    states: [State!] @derivedFrom(field: "countries")
  }

  type State {
    name: String!
    code: String!
    countries: [Country!]
    states: [City!] @derivedFrom(field: "state")
  }

  type City {
    name: String!
    code: String!
    state: State!
  }
`
const log = console.log

const main = async () => {
  // const schema = await loadSchema(
  //   '/Users/saihaj/Desktop/the-guild/graph-local-state/packages/sql-schema/src/schema.graphql',
  //   {
  //     loaders: [new GraphQLFileLoader()],
  //   },
  // )

  visit(parse(typeDefs), {
    ObjectTypeDefinition(node) {
      const tableName = camelCase(node.name.value)

      const columns = node.fields?.map(({ name, type, directives }) => {
        const relation =
          directives &&
          directives.map((directive) => {
            if (directive.name.kind === Kind.NAME) {
              const arg = directive?.arguments?.find(({ name }) => name.value === 'field')
              if (arg?.value.kind === Kind.STRING) {
                return arg?.value.value
              }
            }
            return null
          })

        return {
          name: camelCase(name.value),
          type: type.type.kind === Kind.NAMED_TYPE ? camelCase(type.type.name.value) : type.type.kind,
          constraint: type.kind === Kind.NON_NULL_TYPE ? 'NOT NULL' : 'NULL',
          relation: relation && relation.length > 0 ? relation[0] : null,
        }
      })

      log({ tableName, columns })
    },
  })
}

main().catch((e) => console.error(e))
