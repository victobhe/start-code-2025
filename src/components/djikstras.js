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






//djikstras som finner korteste vei til neste punkt, som du også skal ha en vare fra


//
