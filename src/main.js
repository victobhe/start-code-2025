import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import { products } from '../backend/demofile.json'

// Legg til HTML for søkefelt og resultater
document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Handleliste-søk</h1>

    <!-- Søke-UI -->
    <input type="search" id="searchbar" placeholder="Søk etter produkter...">
    <div id="search-results"></div>

    <section class="papirlapp">
      <h2>Handleliste</h2>
      <ul id="handleliste"></ul>
    </section>
  </div>
`

// Setup counter (som før)
setupCounter(document.querySelector('#counter'))

// Legg til søkefunksjon
const searchInput = document.getElementById('searchbar')
const searchResults = document.getElementById('search-results')
const handleliste = document.getElementById('handleliste')

// 🔍 Søk og vis resultater
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase()
  searchResults.innerHTML = ""

  if (!query) return

  const results = products.filter(p =>
    p.name.toLowerCase().includes(query)
  )

  results.forEach(product => {
    const highlighted = product.name.replace(
      new RegExp(`(${query})`, 'gi'),
      "<mark>$1</mark>"
    )

    const div = document.createElement('div')
    div.innerHTML = `
      <p>${highlighted}</p>
      <button data-product="${product.name}">Legg til</button>
    `
    // Legg til event listener på knappen
    div.querySelector('button').addEventListener('click', () => {
      leggTilVare(product.name)
    })

    searchResults.appendChild(div)
  })
})

// ➕ Legg til i handleliste
function leggTilVare(vareNavn) {
  const li = document.createElement('li')
  li.textContent = vareNavn
  handleliste.appendChild(li)
  searchInput.value = ""
  searchResults.innerHTML = ""
}
