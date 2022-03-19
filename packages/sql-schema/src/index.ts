import { loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { Kind, parse, visit } from 'graphql'
import { camelCase } from 'lodash'

const typeDefs = /* GraphQL */ `
  directive @derivedFrom(field: String!) on FIELD_DEFINITION

  type Country {
    name: String!
    code: String!
    population: Int!
    works: Boolean!
    states: [State!] @derivedFrom(field: "countries")
  }

  type State {
    name: String!
    code: String!
    countries: [Country!]
    cities: [City!] @derivedFrom(field: "state")
  }

  type City {
    name: String!
    code: String!
    state: State!
  }
`
const log = console.log

const getDataType = (type: string) => {
  // Mapping GraphQL String to SQLite "TEXT"
  if (type === 'String') {
    return 'TEXT'
  }
  // Mapping GraphQL Boolean to SQLite "INTEGER" since it doesn't have built in boolean type
  // Mapping GraphQL Int to SQLite "INTEGER"
  if (type === 'Int' || type === 'Boolean') {
    return 'INTEGER'
  }
  // Return non-primitive types as is and they will be mapped to SQLite "TEXT" for relations
  return type
}

// Ensure that it one of the types we mapped to SQLite
const isMappedSQLType = (type: string) => {
  switch (type) {
    case 'TEXT':
    case 'INTEGER':
      return true
    default:
      return false
  }
}

type ColumnsAST = {
  name: string
  type: string
  constraint: string
  relationTable: string | null
  relation: string | null
}

const createTable = (name: string) => `CREATE TABLE IF NOT EXISTS ${name}`

const main = async () => {
  // const schema = await loadSchema(
  //   '/Users/saihaj/Desktop/the-guild/graph-local-state/packages/sql-schema/src/schema.graphql',
  //   {
  //     loaders: [new GraphQLFileLoader()],
  //   },
  // )
  let sqlSchema: Array<{ tableName: string; columns: Array<ColumnsAST> | undefined }> = []
  visit(parse(typeDefs), {
    ObjectTypeDefinition(node) {
      const tableName = node.name.value

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

        const namedType = type.type.kind === Kind.NAMED_TYPE ? getDataType(type.type.name.value) : null
        const isMapped = namedType && isMappedSQLType(namedType)

        const relationTable =
          type.type.kind === Kind.NON_NULL_TYPE
            ? type.type.type.kind === Kind.NAMED_TYPE
              ? type.type.type.name.value
              : null
            : isMapped
            ? null
            : namedType

        return {
          name: name.value,
          type: isMapped ? namedType : 'TEXT', // relations are always text
          constraint: type.kind === Kind.NON_NULL_TYPE ? 'NOT NULL' : 'NULL',
          relationTable,
          relation: relation && relation.length > 0 ? relation[0] : null,
        }
      })

      sqlSchema.push({ tableName, columns })
    },
  })

  const schema = sqlSchema.map(({ tableName, columns }) => {
    const cols = columns?.map(({ name, type, constraint, relationTable, relation }) => {
      const column = `${name} ${type} ${constraint}`
      const foreignKey = relationTable ? `\nFOREIGN KEY (${name}) REFERENCES "${relationTable}"(id),` : ''
      return column + ',' + foreignKey
    })
    const str = `${createTable(`"${tableName}"`)} (
id TEXT PRIMARY KEY,
${cols?.join('\n')}
)`
    return str
  })
  log(schema.join('\n'))
}

main().catch((e) => console.error(e))
