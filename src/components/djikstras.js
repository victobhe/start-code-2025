//hanldelisten inneholder varer som hver vare har en kategori
// sortering av liste


stederViMaaInnom = new Array();

muligeKategorier = hentKategorierFraCSV();


// legg til steder vi må innom basert på handlelisten
function leggTilStederViMaInnom(x) {
    if (!muligeKategorier.includes(x) || x == null){
        throw new Error("Ugyldig kategori");
    }
    if (x in stederViMaaInnom){
        return;
    }
    stederViMaaInnom.add(x)
}

// hent kategorier fra csv fil
async function hentKategorierFraCSV() {
  const respons = await fetch('kategorier.csv');
  const tekst = await respons.text();

  const linjer = tekst.trim().split('\n');
  const kategorier = linjer.slice(1); 
  return kategorier;
}


// legg til vare i handleliste fil
const fs = require('fs');

function leggTilVareIFil(vare) {
  const linje = `${vare}\n`;

  fs.appendFile('handleliste.csv', linje, 'utf8', (err) => {
    if (err) {
      console.error("Klarte ikke å legge til vare:", err);
    } else {
      console.log(`La til "${vare}" i handleliste.csv`);
    }
  });
}





//djikstras som finner korteste vei til neste punkt, som du også skal ha en vare fra

function dijkstra(graf, start) {
  const d = {};
  const prev = {};
  const besøkt = new Set();
  const pq = new Set(Object.keys(graf)); // primitive priority queue

  // Init
  for (let node of pq) {
    d[node] = Infinity;
    prev[node] = null;
  }
  d[start] = 0;

  while (pq.size > 0) {
    // Finn node med minst d
    let minsteNode = null;
    let minsteAvstand = Infinity;
    for (let node of pq) {
      if (d[node] < minsteAvstand) {
        minsteAvstand = d[node];
        minsteNode = node;
      }
    }

    if (minsteNode === null) break;

    pq.delete(minsteNode);
    besøkt.add(minsteNode);

    for (let nabo of graf[minsteNode]) {
      if (besøkt.has(nabo.node)) continue;

      const nyAvstand = d[minsteNode] + nabo.avstand;
      if (nyAvstand < d[nabo.node]) {
        d[nabo.node] = nyAvstand;
        prev[nabo.node] = minsteNode;
      }
    }
  }

  return { avstander: d, forrige: prev };
}


function finnNermesteSted(graf, startNode, stederViMaaInnom) {
  const { avstander } = dijkstra(graf, startNode);

  let nærmeste = null;
  let minAvstand = Infinity;

  for (let sted of stederViMaaInnom) {
    if (avstander[sted] < minAvstand) {
      minAvstand = avstander[sted];
      nærmeste = sted;
    }
  }

  return { neste: nærmeste, avstand: minAvstand };
}





//
