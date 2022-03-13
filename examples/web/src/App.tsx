import './App.css'

import { useMutation, useQuery, gql } from 'urql'
import { useState } from 'react'

const DatabaseNameQuery = gql(/* GraphQL */ `
  query DBName {
    _DATABASE_NAME
  }
`)

const CountriesQuery = gql(/* GraphQL */ `
  query Countries {
    countries {
      id
      name
      states {
        id
        name
      }
    }
  }
`)

const AddCountryMutation = gql(/* GraphQL */ `
  mutation AddCountry($name: String!) {
    addCountry(name: $name) {
      id
    }
  }
`)

const AddStateMutation = gql(/* GraphQL */ `
  mutation AddState($countryId: ID!, $name: String!) {
    addState(name: $name, countryId: $countryId) {
      id
    }
  }
`)

function App() {
  const [{ data, fetching }, refetchCountries] = useQuery({ query: DatabaseNameQuery })
  const [country, setCountry] = useState('')
  const [stateName, setStateName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [{ data: countriesData, fetching: fetchingCountries }] = useQuery({ query: CountriesQuery })
  const [_, addCountry] = useMutation(AddCountryMutation)
  const [, addState] = useMutation(AddStateMutation)

  return (
    <div>
      <header className="app-header">
        <p>PouchDB {fetching ? 'Connecting to DB' : data._DATABASE_NAME}</p>
      </header>
      <form>
        <input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)}></input>
        <button
          onClick={(e) => {
            e.preventDefault()
            console.log('[client] add country', country)
            addCountry({ name: country })
            setCountry('')
            refetchCountries()
          }}
        >
          Add country
        </button>
      </form>
      {!fetchingCountries ? countriesData.countries.map((country) => <li key={country.id}>{country.name}</li>) : null}

      {/* Need to make addState mutation work */}
      {/* <form
        onSubmit={(e) => {
          e.preventDefault()
          console.log(selectedCountry)
          addState({ countryId: selectedCountry, name: stateName })
          // refetchCountries()
          // setStateName('')
        }}
      >
        <input required placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)}></input>
        <select required onChange={(e) => setSelectedCountry(e.target.value)}>
          Choose Country
          {!fetchingCountries
            ? countriesData.countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))
            : null}
        </select>
        <button type="submit">Add country</button>
      </form> */}
    </div>
  )
}

export default App
