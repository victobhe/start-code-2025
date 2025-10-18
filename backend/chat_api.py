import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
import requests


OPENAI_API_KEY = os.getenv("API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

api_role = (
    "Du er en hjelpsom assistent som skal hjelpe meg å plassere forskjellige produkter inn i kategorier. "
    "Du vil få masse JSON data. Ut ifra 'name'-feltet skal du forstå hvilken kategori varen tilhører og legge til "
    "'kategori': 'kategori varen faller under'. De forskjellige kategoriene som varer skal plasseres i er: "
    "Frukt, Grønt, Kjøtt, Baking, Brød og Snacks. Kategori skal være plassert under 'name' feltet."
    "Det som ikke faller inn under disse kategoriene skal plasseres i 'kategori': 'Annet'. "
    "Returner samme struktur som du får, men med feltet 'kategori' lagt til for hver vare."
    "Returner kun JSON data. Ingen apostrofer, ingen anførselstegn, ingen forklaringer."
    "for eksempel, så skal data som dette:"
    """{
        "productId": "1001",
        "gtin": "7091234000013",
        "name": "Grovt brød 750 g",
        "description": "Nybakt, grovt brød med høy fiber.",
        "price": 44.18,
        "pricePerUnit": 58.91,
        "unit": "kg",
        "allergens": "hvete, gluten, melk",
        "carbonFootprintGram": 325,
        "organic": false
    },"""
    "bli til dette:"
    """{
        "productId": "1001",
        "gtin": "7091234000013",
        "name": "Grovt brød 750 g",
        "kategori": "Brød",
        "description": "Nybakt, grovt brød med høy fiber.",
        "price": 44.18,
        "pricePerUnit": 58.91,
        "unit": "kg",
        "allergens": "hvete, gluten, melk",
        "carbonFootprintGram": 325,
        "organic": false
    },"""
)
word_limit = 938
text = ""
raw_data = requests.get('http://localhost:3000/api/products')
# for i in range(0, len(raw_data.text)):
#     text = text + raw_data.text[i]
#     if len(text) >= word_limit:
#         break
# text = text + "]"


response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": api_role},
        {"role": "user", "content": raw_data.text}
    ]
)
# print(response.choices[0].message.content)
with open("./backend/demofile.json", "a", encoding="utf-8") as f:
    f.write(response.choices[0].message.content)