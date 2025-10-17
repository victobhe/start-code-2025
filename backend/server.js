import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;


// Proxy-endepunktet ditt
app.get("/api/products", async (req, res) => {
  // Ta imot eventuelle query-parametre og send dem videre
  const upstreamBase = "https://startcode-hackathon2025.azurewebsites.net/api/GetProducts";
  const queryString = new URLSearchParams(req.query).toString();
  const upstreamUrl = queryString ? `${upstreamBase}?${queryString}` : upstreamBase;

  try {
    const upstream = await fetch(upstreamUrl, {
      // legg til headers hvis API-et krever det
      headers: {
        "Accept": "application/json"
      },
      // (valgfritt) timeout via AbortController kan legges til
    });

    if (!upstream.ok) {
      // Speil statuskode for enklere feilsøking i frontend
      return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}` });
    }

    const data = await upstream.json();

    // 🔎 Hvis du vil filtrere: plukk ut felter her
    // const minimal = data.map(x => ({ id: x.id, title: x.title }));
    // return res.json(minimal);

    // Hvis du vil sende alt videre:
    res.setHeader("Content-Type", "application/json");

    // CORS: gi *kun* din frontend tilgang i prod. Under: åpent for alle (enkelt for testing)
    res.setHeader("Access-Control-Allow-Origin", "*");

    // (valgfritt) cache et lite øyeblikk for bedre ytelse
    // res.setHeader("Cache-Control", "public, max-age=60");

    res.status(200).json(data);
  } catch (err) {
    console.error("Proxy-feil:", err);
    res.status(502).json({ error: "Kunne ikke hente fra upstream" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy kjører på http://localhost:${PORT}`);
});
