# Smart Helper Survey Application

Kysely- ja analytiikkasovellus ääniohjautuvaa kauppakeskusavustajaa varten.

## Ominaisuudet

- ✅ Täysin suomenkielinen käyttöliittymä
- ✅ Responsiivinen survey-lomake
- ✅ SQLite-tietokanta
- ✅ Suojattu analytiikka-dashboard
- ✅ Reaaliaikaiset tilastot ja kaaviot
- ✅ Käyttäjien autentikointi
- ✅ GDPR-yhteensopiva (täysin anonyymi data)

## Pikaopas (Paikallinen kehitys)

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Tarkista/muokkaa .env tiedostoa (tunnukset on jo asetettu)
cat .env

# 3. Käynnistä palvelin (luo automaattisesti tietokannan)
npm start

# 4. Avaa selaimessa
#    Kysely: http://localhost:3000
#    Dashboard: http://localhost:3000/dashboard

# 5. (Valinnainen) Luo testidataa
#    Pysäytä palvelin (Ctrl+C) ja aja:
npm run seed
```

## Tuotantoon vienti (EC2 + Subdomain)

📚 **Katso yksityiskohtaiset ohjeet**: [DEPLOYMENT.md](./DEPLOYMENT.md)

🚀 **Pikaviite-opas**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

Deployment-opas sisältää:
- EC2-palvelimen asetukset
- Node.js ja PM2 asennus
- Nginx reverse proxy
- SSL-sertifikaatti (HTTPS)
- Subdomain DNS-asetukset
- Varmuuskopiot ja päivitykset
- Vianmääritys

## GDPR ja Tietosuoja

🔒 **Täysin anonyymi kysely** - ei henkilötietoja!

📄 **Dokumentaatio**: [GDPR-COMPLIANCE.md](./GDPR-COMPLIANCE.md)

Kysely:
- ❌ Ei kerää nimeä, sähköpostia, osoitetta, puhelinta tai SSN
- ❌ Ei kerää IP-osoitetta tai evästeitä
- ✅ Täydellinen tietosuojaseloste (`/privacy.html`)
- ✅ Pakollinen suostumus ennen lähetystä
- ✅ HTTPS-salaus tuotannossa

## Teknologiat

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js
- **Security**: bcrypt, express-session

## Projektin rakenne

```
Innovatio-survey/
├── server.js              # Express-palvelin
├── seed.js                # Testidata-skripti
├── package.json           # Node.js riippuvuudet
├── .env                   # Ympäristömuuttujat (älä commitoi!)
├── survey.db             # SQLite-tietokanta (luodaan automaattisesti)
├── public/
│   ├── index.html        # Kyselylomake
│   ├── survey.js         # Kyselyn JavaScript
│   ├── styles.css        # Tyylitiedosto
│   ├── dashboard.html    # Analytiikka-dashboard
│   └── dashboard.js      # Dashboard JavaScript
├── mvp-detail.md         # MVP-kuvaus
└── survey-kysymykset.md  # Kysymyslistaus
```

## Asennus

### 1. Asenna Node.js

Lataa ja asenna Node.js osoitteesta: https://nodejs.org/

### 2. Asenna riippuvuudet

```bash
cd Innovatio-survey
npm install
```

### 3. Määritä ympäristömuuttujat

`.env` tiedosto on jo luotu projektin juureen. Muokkaa sitä tarpeen mukaan:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (vaihda tuotannossa!)
SESSION_SECRET=smart-helper-secret-key-change-in-production

# Dashboard Admin Credentials
ADMIN_USERNAME=Fowsi.88
ADMIN_PASSWORD=Innovation.001@

# Database Configuration
DB_PATH=./survey.db
```

⚠️ **TÄRKEÄÄ**: Vaihda `ADMIN_USERNAME` ja `ADMIN_PASSWORD` turvallisiksi arvoiksi!

### 4. Käynnistä palvelin

```bash
npm start
```

Palvelin luo automaattisesti:
- SQLite-tietokannan (`survey.db`)
- Tarvittavat taulut (`responses`, `admin_users`)
- Admin-käyttäjän `.env`-tiedoston tunnuksilla

Tai kehitystilassa (automaattinen uudelleenkäynnistys):

```bash
npm run dev
```

### 5. (Valinnainen) Luo testidataa

Jos haluat nähdä dashboardin toiminnassa heti, voit generoida 20 testivastasta:

```bash
npm run seed
```

**Huom**: Palvelin täytyy käynnistää ensin vähintään kerran, jotta tietokanta ja taulut luodaan!

## Käyttö

### Kysely

1. Avaa selaimessa: `http://localhost:3000`
2. Täytä kyselylomake
3. Lähetä vastaukset

### Dashboard

1. Avaa selaimessa: `http://localhost:3000/dashboard`
2. Kirjaudu sisään `.env`-tiedostossa määritellyillä tunnuksilla:
   - **Käyttäjänimi**: (katso `.env` → `ADMIN_USERNAME`)
   - **Salasana**: (katso `.env` → `ADMIN_PASSWORD`)
3. Tarkastele analytiikkaa

**Huom**: Jos et ole vielä täyttänyt yhtään kyselyä tai ajanut `npm run seed`, dashboard näyttää tyhjät kaaviot.

## Dashboard-ominaisuudet

### Tilastot
- Kokonaismäärä vastauksia

### Kaaviot
- **Ikäjakauma**: Palkkikaavio vastaajien ikäryhmistä
- **Sukupuolijakauma**: Ympyräkaavio sukupuolijakaumasta
- **Koulutustaso**: Donitsikaavio koulutustasoista
- **Käyttöliittymätoive**: Palkkikaavio suosituimmista käyttöliittymistä
- **Tiedonhaku**: Top 10 etsityimmät tiedot kauppakeskuksesta
- **Tekoälypalvelut**: Top 8 toivotut tekoälypalvelut

### Taulukko
- 50 viimeisintä vastausta yksityiskohtineen

## Kyselyn rakenne

### Taustatiedot
- Ikä (7 ikäryhmää)
- Sukupuoli (4 vaihtoehtoa)
- Koulutustaso (3 tasoa)
- Ammatti/Asema (vapaa teksti)

### Tiedonhaku kauppakeskuksessa
Valitse 5 useimmin etsittyä tietotyyppiä:
- Tuote
- Palvelu
- Liike
- Aukioloaika
- Tarjoukset
- Tapahtumat
- Neuvonta
- Oheispalvelut
- Pysäköinti
- Muu

### Tekoälyavusteinen avustaja
Valitse 3 todennäköisesti käytettävää palvelua:
- Haku tuotteen/palvelun nimellä
- Haku liikkeen nimellä
- Päivän parhaat tarjoukset
- Räätälöidyt tarjoukset
- Ruokalista
- Ajanviete
- Kauppakeskuksen kartta
- Muu

### Käyttöliittymätoive
Valitse 1 mieluisin käyttöliittymä:
- Kosketusnäyttö
- Ääniohjaus
- Kehonkieli
- Muu

## Tietokantarakenne

### responses
```sql
- id (INTEGER PRIMARY KEY)
- age (TEXT)
- gender (TEXT)
- education (TEXT)
- occupation (TEXT)
- info_search (TEXT/JSON)
- info_search_other (TEXT)
- ai_services (TEXT/JSON)
- ai_services_other (TEXT)
- interface_preference (TEXT)
- interface_other (TEXT)
- timestamp (DATETIME)
```

### admin_users
```sql
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- created_at (DATETIME)
```

## API Endpoints

### Public
- `GET /` - Kyselylomake
- `POST /api/submit-survey` - Lähetä kyselyn vastaus
- `GET /dashboard` - Dashboard-sivu
- `POST /api/login` - Kirjaudu sisään

### Protected (vaatii autentikoinnin)
- `GET /api/responses` - Hae kaikki vastaukset
- `GET /api/analytics` - Hae analytiikkayhteenveto
- `GET /api/auth-status` - Tarkista autentikointi
- `POST /api/logout` - Kirjaudu ulos

## Tietokanta

### Automaattinen luonti

Kun käynnistät palvelimen ensimmäistä kertaa, sovellus:
1. Luo `survey.db` tiedoston projektin juureen
2. Luo tarvittavat taulut (`responses` ja `admin_users`)
3. Luo admin-käyttäjän `.env`-tiedoston tunnuksilla

**Tiedoston sijainti**: `./survey.db` (projektin juuressa)

### Testidata

Generoi 20 testivastasta dashboardin testaamista varten:

```bash
# Varmista että palvelin on käynnistetty ainakin kerran
npm start

# Pysäytä palvelin (Ctrl+C) ja aja seed-skripti
npm run seed
```

### Tietokannan nollaus

Jos haluat aloittaa alusta:

```bash
# Poista tietokanta
rm survey.db

# Käynnistä palvelin uudelleen
npm start
```

## Tietoturva

- ✅ Salasanat hashataan bcrypt-kirjastolla (10 kierrosta)
- ✅ Session-pohjaiset istunnot express-sessionilla
- ✅ Admin-dashboard vaatii kirjautumisen
- ✅ Ympäristömuuttujat `.env`-tiedostossa (ei versionhallinnassa)
- ⚠️ HTTPS suositellaan tuotantokäytössä
- ⚠️ `.env` on lisätty `.gitignore`-tiedostoon

## Tuotantoon vienti

### Ympäristömuuttujat
`.env`-tiedosto on jo olemassa. Päivitä tuotantoa varten:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=vahva-satunnainen-salaisuus-min-32-merkkia
ADMIN_USERNAME=turvallinen_kayttajanimi
ADMIN_PASSWORD=vahva-salasana-min-12-merkkia
DB_PATH=./survey.db
```

### Turvallisuusparannukset tuotantoon
1. ✅ Vaihda `SESSION_SECRET` vahvaksi satunnaiseksi merkkijonoksi
2. ✅ Vaihda `ADMIN_USERNAME` ja `ADMIN_PASSWORD` vahvoiksi arvoiksi
3. ⚠️ Käytä HTTPS:ää (pakollinen tuotannossa)
4. ⚠️ Lisää rate limiting (esim. express-rate-limit)
5. ⚠️ Säännölliset varmuuskopiot `survey.db`-tietokannasta
6. ⚠️ Aseta `NODE_ENV=production`
7. ⚠️ Käytä prosessinhallintaa (PM2, systemd)

## Kehitysideat

- [ ] Lisää käyttäjiä ja rooleja
- [ ] Vie data CSV/Excel-muotoon
- [ ] Sähköposti-ilmoitukset uusista vastauksista
- [ ] Suodattimet dashboardiin
- [ ] Vastausten poisto-ominaisuus
- [ ] Kyselyn kielivaihtoehdot
- [ ] A/B testaus eri kysymystyypeille

## Tuki ja palaute

Jos kohtaat ongelmia tai sinulla on kysymyksiä, ota yhteyttä projektitiimiin.

## Lisenssi

© 2024 Smart Helper -projekti. Kaikki oikeudet pidätetään.

---

## Yhteenveto tietokannasta

- **Tiedosto**: `survey.db` luodaan automaattisesti projektin juureen
- **Taulut**: `responses` (vastaukset) ja `admin_users` (admin-käyttäjät)
- **Admin**: Luodaan automaattisesti `.env`-tiedoston tunnuksilla
- **Testidata**: Voit luoda `npm run seed` komennolla

**⚠️ TÄRKEÄÄ**:
- Älä koskaan commitoi `.env`-tiedostoa versionhallintaan!
- Vaihda tuotannon tunnukset vahvoiksi ennen julkaisua!
- Ota säännölliset varmuuskopiot `survey.db`-tietokannasta!
