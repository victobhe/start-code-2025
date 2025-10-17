//hanldelisten inneholder varer som hver vare har en kategori
// sortering av liste


handleliste = new ArrayList();
handleliste.add


async function hentKategorierFraCSV() {
  const respons = await fetch('kategorier.csv');
  const tekst = await respons.text();

  const linjer = tekst.trim().split('\n');
  const kategorier = linjer.slice(1); 
  return kategorier;
}

//djikstras som finner korteste vei til neste punkt, som du også skal ha en vare fra


//
