# Pre-Deployment Checklist

Tarkistuslista ennen sovelluksen viemistä tuotantoon.

---

## 📋 Ennen EC2:lle siirtoa

### 1. Ympäristömuuttujat (.env)

- [ ] Vaihda `SESSION_SECRET` vahvaksi satunnaiseksi merkkijonoksi
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Vaihda `ADMIN_USERNAME` turvalliseksi käyttäjänimeksi
- [ ] Vaihda `ADMIN_PASSWORD` vahvaksi salasanaksi (min 12 merkkiä)
- [ ] Aseta `NODE_ENV=production`
- [ ] Varmista että `DB_PATH=./survey.db`

### 2. Tiedostot

- [ ] `.env` on lisätty `.gitignore` tiedostoon ✅ (jo tehty)
- [ ] `survey.db` on lisätty `.gitignore` tiedostoon ✅ (jo tehty)
- [ ] `node_modules/` on lisätty `.gitignore` tiedostoon ✅ (jo tehty)
- [ ] Luo `.env.example` tiedosto ilman arkaluontoisia tietoja ✅ (jo tehty)

### 3. Koodi

- [ ] Sovellus toimii paikallisesti: `npm start`
- [ ] Dashboard kirjautuminen toimii `.env` tunnuksilla
- [ ] Kyselyn lähetys toimii
- [ ] Analytics-dashboard näyttää dataa
- [ ] Ei console.log() -viestejä tuotantokoodissa
- [ ] Ei kovakoodattuja salasanoja tai API-avaimia

### 4. Testaus

- [ ] Testaa kyselyn lähetystä
- [ ] Testaa dashboardiin kirjautumista
- [ ] Testaa seed-dataa: `npm run seed`
- [ ] Tarkista että kaaviot näkyvät oikein

---

## 🖥️ EC2 Valmistelut

### 1. AWS EC2

- [ ] EC2-instanssi luotu (t2.micro tai suurempi)
- [ ] Key pair (.pem) ladattu ja tallennettu turvallisesti
- [ ] EC2:n julkinen IP-osoite tiedossa
- [ ] SSH-yhteys toimii: `ssh -i key.pem ubuntu@YOUR_IP`

### 2. Security Group

- [ ] SSH (22) - Your IP tai 0.0.0.0/0
- [ ] HTTP (80) - 0.0.0.0/0
- [ ] HTTPS (443) - 0.0.0.0/0
- [ ] ~~Custom (3000)~~ - Vain testausta varten, poista myöhemmin

### 3. Domain ja DNS

- [ ] Domain-nimi omistuksessa (esim. `yourdomain.com`)
- [ ] Pääsy domain-hallintaan (Namecheap, GoDaddy, Route53)
- [ ] Subdomain päätetty (esim. `survey.yourdomain.com`)

---

## 📦 Asennusvaihe EC2:lla

### 1. Järjestelmän päivitys

```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] Järjestelmä päivitetty

### 2. Node.js asennus

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Pitäisi näyttää v18.x.x
```

- [ ] Node.js v18+ asennettu
- [ ] NPM asennettu

### 3. Sovelluksen siirto

Valitse yksi:

**Git (suositeltu):**
```bash
git clone https://github.com/yourusername/survey-app.git
cd survey-app
```

- [ ] Repository luotu GitHubiin/GitLabiin (PRIVATE!)
- [ ] Sovellus kloonattu EC2:lle

**SCP:**
```bash
# Paikallisesti:
tar -czf survey-app.tar.gz --exclude='node_modules' --exclude='*.db' .
scp -i key.pem survey-app.tar.gz ubuntu@YOUR_IP:~/

# EC2:ssa:
tar -xzf survey-app.tar.gz -C ~/survey-app
```

- [ ] Sovellus siirretty EC2:lle
- [ ] Tiedostot purettu oikein

### 4. Riippuvuudet

```bash
cd ~/survey-app
npm install --production
```

- [ ] Riippuvuudet asennettu
- [ ] Ei virheitä asennuksessa

### 5. Ympäristömuuttujat EC2:lla

```bash
nano ~/survey-app/.env
```

- [ ] `.env` tiedosto luotu
- [ ] Kaikki muuttujat asetettu
- [ ] SESSION_SECRET vaihdettu
- [ ] Admin-tunnukset vaihdettu
- [ ] NODE_ENV=production

### 6. Testaa sovellusta

```bash
npm start
# Testaa: http://YOUR_EC2_IP:3000
```

- [ ] Sovellus käynnistyy ilman virheitä
- [ ] Tietokanta luodaan automaattisesti
- [ ] Pääset kyselyyn selaimella

---

## 🔧 PM2 Asennus

```bash
sudo npm install -g pm2
cd ~/survey-app
pm2 start server.js --name survey-app
pm2 startup
# SUORITA tulostettava komento!
pm2 save
```

- [ ] PM2 asennettu globaalisti
- [ ] Sovellus käynnistetty PM2:lla
- [ ] PM2 startup asetettu
- [ ] PM2 save suoritettu
- [ ] `pm2 status` näyttää sovelluksen käynnissä

---

## 🌐 Nginx Asennus

### 1. Asenna Nginx

```bash
sudo apt install -y nginx
```

- [ ] Nginx asennettu
- [ ] Nginx käynnissä: `sudo systemctl status nginx`

### 2. Konfiguraatio

```bash
sudo nano /etc/nginx/sites-available/survey
```

- [ ] Konfiguraatiotiedosto luotu
- [ ] `server_name` vaihdettu oikeaksi (survey.yourdomain.com)
- [ ] `proxy_pass` asetettu: http://localhost:3000

### 3. Aktivoi

```bash
sudo ln -s /etc/nginx/sites-available/survey /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Valinnainen
sudo nginx -t
sudo systemctl restart nginx
```

- [ ] Symbolinen linkki luotu
- [ ] Nginx testi OK: `sudo nginx -t`
- [ ] Nginx käynnistetty uudelleen

---

## 🌍 DNS Asetukset

### 1. Luo A-record

Domain-hallinnassa:

```
Type:  A
Host:  survey
Value: YOUR_EC2_IP
TTL:   Automatic / 300
```

- [ ] A-record lisätty
- [ ] DNS odottaa (15-30 min)
- [ ] DNS toimii: `nslookup survey.yourdomain.com`

### 2. Testaa HTTP

```bash
curl http://survey.yourdomain.com
```

- [ ] Subdomain vastaa
- [ ] Sovellus näkyy selaimessa: http://survey.yourdomain.com

---

## 🔒 SSL-sertifikaatti (HTTPS)

### 1. Asenna Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

- [ ] Certbot asennettu

### 2. Hanki sertifikaatti

```bash
sudo certbot --nginx -d survey.yourdomain.com
```

Seuraa ohjeita:
- [ ] Sähköposti syötetty
- [ ] Ehdot hyväksytty
- [ ] Valittu: Redirect (2)

### 3. Testaa HTTPS

- [ ] HTTPS toimii: https://survey.yourdomain.com
- [ ] Lukko näkyy selaimessa
- [ ] HTTP ohjautuu automaattisesti HTTPS:ään

### 4. Automaattinen uusiminen

```bash
sudo certbot renew --dry-run
```

- [ ] Testi onnistui
- [ ] Cron job luotu automaattisesti

---

## 🔐 Turvallisuus

### 1. Firewall (valinnainen mutta suositeltu)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

- [ ] UFW aktivoitu
- [ ] Nginx sallittu
- [ ] SSH sallittu

### 2. Security Group

- [ ] Poista Custom (3000) Security Groupista
- [ ] Vain portit 22, 80, 443 avoinna

### 3. Tietoturvatarkistukset

- [ ] `.env` ei ole versionhallinnassa
- [ ] `survey.db` ei ole versionhallinnassa
- [ ] Admin-salasana vaihdettu
- [ ] SESSION_SECRET vaihdettu
- [ ] HTTPS pakollinen (HTTP redirect)

---

## 💾 Varmuuskopiot

### 1. Luo backup-skripti

```bash
nano ~/backup-survey.sh
# (Kopioi sisältö DEPLOYMENT.md:stä)
chmod +x ~/backup-survey.sh
```

- [ ] Backup-skripti luotu
- [ ] Executable-oikeudet asetettu
- [ ] Testattu: `~/backup-survey.sh`

### 2. Automaattinen backup

```bash
crontab -e
# Lisää: 0 2 * * * /home/ubuntu/backup-survey.sh
```

- [ ] Cron job luotu (päivittäin klo 2:00)
- [ ] Crontab tarkistettu: `crontab -l`

---

## ✅ Lopputarkistukset

### Toiminnallisuus

- [ ] Kysely: https://survey.yourdomain.com
- [ ] Dashboard: https://survey.yourdomain.com/dashboard
- [ ] Kirjautuminen toimii admin-tunnuksilla
- [ ] Kyselyn lähetys toimii
- [ ] Vastaukset tallentuvat tietokantaan
- [ ] Analytics näyttää dataa
- [ ] Kaikki kaaviot näkyvät oikein

### Suorituskyky

- [ ] Sovellus latautuu nopeasti (< 3s)
- [ ] PM2 näyttää sovelluksen käynnissä: `pm2 status`
- [ ] Ei memory leakejä: `pm2 monit`

### Seuranta

- [ ] PM2 lokit toimivat: `pm2 logs survey-app`
- [ ] Nginx lokit toimivat: `sudo tail -f /var/log/nginx/survey-access.log`
- [ ] Ei virheitä logeissa

### Dokumentaatio

- [ ] README.md päivitetty
- [ ] DEPLOYMENT.md luettu
- [ ] QUICK-REFERENCE.md tallennettu
- [ ] Admin-tunnukset tallennettu turvallisesti (esim. 1Password)
- [ ] EC2 IP ja SSH-avain tallennettu turvallisesti

---

## 🎉 Valmis!

Kun kaikki kohdat on tarkistettu:

```bash
# Testaa lopullinen toimivuus
curl -I https://survey.yourdomain.com
pm2 status
pm2 logs survey-app --lines 20
```

**Sovellus on nyt käytössä osoitteessa:**
- 📊 Kysely: https://survey.yourdomain.com
- 📈 Dashboard: https://survey.yourdomain.com/dashboard

**Muista:**
- 🔐 Pidä admin-tunnukset turvassa
- 💾 Tarkista varmuuskopiot säännöllisesti
- 🔄 Päivitä sovellus tarvittaessa (katso QUICK-REFERENCE.md)
- 📊 Seuraa PM2 ja Nginx lokeja
- 🔒 Vaihda salasanat säännöllisesti

---

## 📞 Tuki

Jos kohtaat ongelmia:

1. Tarkista PM2: `pm2 logs survey-app`
2. Tarkista Nginx: `sudo tail -f /var/log/nginx/survey-error.log`
3. Katso vianmääritys: [DEPLOYMENT.md](./DEPLOYMENT.md#vianmääritys)
4. Katso pikaohjeet: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

**Onnea käyttöönottoon! 🚀**
