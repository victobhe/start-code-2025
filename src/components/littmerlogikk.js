const handleliste = [];
const listeElement = document.getElementById('handleliste');
const form = document.getElementById('leggTilForm');
const input = document.getElementById('vareInput');

function oppdaterHandleliste() {
  listeElement.innerHTML = '';

  if (handleliste.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Handlelista er tom';
    listeElement.appendChild(li);
  } else {
    handleliste.forEach(vare => {
      const li = document.createElement('li');
      li.textContent = vare;
      listeElement.appendChild(li);
    });
  }
}

// Håndter innsending av skjemaet
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const nyVare = input.value.trim();
  if (nyVare) {
    handleliste.push(nyVare);
    input.value = '';
    oppdaterHandleliste();
  }
});

// Kjør en gang for å vise "tom liste" først
oppdaterHandleliste();



function searchByName(query) {
  return products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );
}
