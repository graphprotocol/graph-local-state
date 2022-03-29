import { loadSchema } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { Kind, parse, TypeNode, visit } from 'graphql'
import { camelCase } from 'lodash'

// const typeDefs = /* GraphQL */ `
//   directive @derivedFrom(field: String!) on FIELD_DEFINITION

//   type Country {
//     name: String!
//     code: String!
//     population: Int!
//     works: Boolean!
//     states: [State!] @derivedFrom(field: "countries")
//   }

//   type State {
//     name: String!
//     code: String!
//     countries: [Country!]
//     cities: [City!] @derivedFrom(field: "state")
//   }

//   type City {
//     name: String!
//     code: String!
//     state: State!
//   }
// `

const typeDefs = /* GraphQL */ `
  directive @derivedFrom(field: String!) on FIELD_DEFINITION

  type Post {
    title: String!
    body: String!
    user: User!
  }

  type User {
    name: String!
    username: String
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

/**
 * ```graphql
 * type User {
 *  name: String!
 * }
 * ```
 *
 * This is represented as `{kind: NonNullType, type:{ kind: NamedType, name: { kind: 'Name', value: 'String' } } }`
 * We need to extract the name of the type
 *
 * ```graphql
 * type User {
 *   name: String
 * }
 * ```
 *
 * This is represented as `{kind: NamedType, name: { kind: 'Name', value: 'String' } }`
 * We need to extract the name of the type
 *
 */
const extractNameNode = (node: TypeNode) => {
  return node.kind === Kind.NON_NULL_TYPE
    ? node.type.kind === Kind.NAMED_TYPE
      ? node.type
      : null
    : node.kind === Kind.NAMED_TYPE
    ? node
    : null
}

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
      const tableName = node.name.value.endsWith('s') ? node.name.value : `${node.name.value}s`

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

        const namedNode = extractNameNode(type)

        const namedType = namedNode?.name ? getDataType(namedNode.name.value) : null
        const isMapped = namedType && isMappedSQLType(namedType)
        const relationTable = !isMapped ? `${namedType}s` : null

        return {
          name: name.value,
          type: isMapped ? namedType : 'INTEGER', // relations are always text
          constraint: type.kind === Kind.NON_NULL_TYPE ? 'NOT NULL' : 'NULL',
          relationTable,
          relation: relation && relation.length > 0 ? relation[0] : null,
        }
      })

      sqlSchema.push({ tableName, columns })
    },
  })

  const schema = sqlSchema.map(({ tableName, columns }) => {
    const isLast = (index: number) => columns && index === columns.length - 1

    const cols = columns?.map(({ name, type, constraint, relationTable }, i) => {
      const column = `${name} ${type} ${constraint}`
      const foreignKey = relationTable ? `,\nFOREIGN KEY (${name}) REFERENCES "${relationTable}"(id)` : ''
      return [column, foreignKey].join(isLast(i) ? '' : ',')
    })

    const str = `${createTable(`"${tableName}"`)} (
id INTEGER PRIMARY KEY AUTOINCREMENT,
${cols?.join('\n')}
);`
    return str
  })
  log(schema.join('\n'))
}

main().catch((e) => console.error(e))
