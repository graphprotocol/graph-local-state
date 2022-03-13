import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { createClient, dedupExchange, cacheExchange, Provider } from 'urql'
import { executeExchange } from '@urql/exchange-execute'
import { devtoolsExchange } from '@urql/devtools'
import envelop from './graphql/envelop'

const { schema } = envelop()

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    devtoolsExchange,
    executeExchange({
      schema,
    }),
  ],
})

ReactDOM.render(
  <React.StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
)
