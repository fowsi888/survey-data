# EC2 Deployment Guide - Smart Helper Survey

Opas Smart Helper -kyselyn käyttöönotolle AWS EC2-palvelimella subdomainin kanssa.

## Sisältö
- [Esivalmistelut](#esivalmistelut)
- [EC2-palvelimen asetukset](#ec2-palvelimen-asetukset)
- [Tiedostojen siirto](#tiedostojen-siirto)
- [Node.js ja riippuvuudet](#nodejs-ja-riippuvuudet)
- [Sovelluksen asennus](#sovelluksen-asennus)
- [PM2 prosessinhallinta](#pm2-prosessinhallinta)
- [Nginx reverse proxy](#nginx-reverse-proxy)
- [SSL-sertifikaatti (HTTPS)](#ssl-sertifikaatti-https)
- [Subdomain DNS-asetukset](#subdomain-dns-asetukset)
- [Vianmääritys](#vianmääritys)

---

## Esivalmistelut

### 1. Tarvittavat tiedot
- ✅ EC2-palvelimen IP-osoite
- ✅ SSH-avain (.pem tiedosto)
- ✅ Domain-nimi (esim. `yourdomain.com`)
- ✅ Haluttu subdomain (esim. `survey.yourdomain.com`)

### 2. Domain-hallinta
Varmista että sinulla on pääsy domain-hallintaan (esim. Namecheap, GoDaddy, Route53)

---

## EC2-palvelimen asetukset

### 1. Security Group -säännöt

Varmista että EC2 Security Groupissa on seuraavat säännöt:

```
Inbound Rules:
- SSH (22)         | Source: Your IP / 0.0.0.0/0
- HTTP (80)        | Source: 0.0.0.0/0
- HTTPS (443)      | Source: 0.0.0.0/0
- Custom (3000)    | Source: 0.0.0.0/0 (vain testausta varten, poista myöhemmin)
```

### 2. Yhdistä EC2:een SSH:lla

```bash
# Aseta avaimen oikeudet (vain ensimmäisellä kerralla)
chmod 400 /path/to/your-key.pem

# Yhdistä palvelimeen (Ubuntu)
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP

# Tai Amazon Linux
ssh -i /path/to/your-key.pem ec2-user@YOUR_EC2_IP
```

### 3. Päivitä järjestelmä

```bash
sudo apt update && sudo apt upgrade -y   # Ubuntu
# TAI
sudo yum update -y                        # Amazon Linux
```

---

## Tiedostojen siirto

### Vaihtoehto 1: SCP (suositeltu pienille projekteille)

**Paketoi projekti paikallisesti:**
```bash
# Siirry projektin juureen
cd /Users/eng-fowsi/Desktop/Innovatio-survey

# Luo .tar.gz paketti (jättää pois node_modules ja .db)
tar -czf survey-app.tar.gz \
  --exclude='node_modules' \
  --exclude='*.db' \
  --exclude='.DS_Store' \
  .
```

**Siirrä palvelimelle:**
```bash
# Siirrä paketti EC2:een
scp -i /path/to/your-key.pem survey-app.tar.gz ubuntu@YOUR_EC2_IP:~/

# Yhdistä EC2:een
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP

# Pura paketti
mkdir -p ~/survey-app
tar -xzf survey-app.tar.gz -C ~/survey-app
cd ~/survey-app
```

### Vaihtoehto 2: Git (suositeltu tuotantoon)

**Luo Git repository:**
```bash
# Paikallisesti
cd /Users/eng-fowsi/Desktop/Innovatio-survey
git init
git add .
git commit -m "Initial commit"

# Push GitHubiin tai GitLabiin (private repo!)
git remote add origin https://github.com/yourusername/survey-app.git
git push -u origin main
```

**Kloonaa EC2:een:**
```bash
# EC2:ssa
cd ~
git clone https://github.com/yourusername/survey-app.git
cd survey-app
```

---

## Node.js ja riippuvuudet

### 1. Asenna Node.js (v18 LTS)

**Ubuntu:**
```bash
# Asenna Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Varmista versio
node --version  # pitäisi näyttää v18.x.x
npm --version   # pitäisi näyttää 9.x.x tai uudempi
```

**Amazon Linux:**
```bash
# Asenna Node.js 18.x
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Varmista versio
node --version
npm --version
```

### 2. Asenna projektin riippuvuudet

```bash
cd ~/survey-app
npm install --production

# Jos tulee virheitä, kokeile:
npm install
```

---

## Sovelluksen asennus

### 1. Konfiguroi ympäristömuuttujat

```bash
# Muokkaa .env tiedostoa
nano .env
```

**Päivitä seuraavat arvot:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Session Secret (VAIHDA TURVALLISEKSI!)
SESSION_SECRET=your-super-secret-random-string-min-32-characters

# Dashboard Admin Credentials (VAIHDA!)
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_secure_password_min_12_chars

# Database Configuration
DB_PATH=./survey.db
```

**Generoi turvallinen SESSION_SECRET:**
```bash
# Käytä tätä komentoa generoimaan satunnainen salaisuus
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Testaa sovellusta

```bash
# Käynnistä sovellus
npm start

# Avaa toisessa terminaalissa tai selaimessa:
# http://YOUR_EC2_IP:3000
```

Jos sovellus toimii, paina `Ctrl+C` ja jatka PM2:n asennukseen.

---

## PM2 prosessinhallinta

PM2 pitää sovelluksen käynnissä ja käynnistää sen uudelleen automaattisesti.

### 1. Asenna PM2 globaalisti

```bash
sudo npm install -g pm2
```

### 2. Käynnistä sovellus PM2:lla

```bash
cd ~/survey-app

# Käynnistä sovellus
pm2 start server.js --name survey-app

# Aseta PM2 käynnistymään automaattisesti
pm2 startup
# SUORITA komento joka tulostuu!

# Tallenna PM2 prosessilista
pm2 save
```

### 3. PM2 komennot

```bash
# Tarkista status
pm2 status

# Näytä lokit
pm2 logs survey-app

# Käynnistä uudelleen
pm2 restart survey-app

# Pysäytä
pm2 stop survey-app

# Poista prosessi
pm2 delete survey-app
```

---

## Nginx reverse proxy

Nginx toimii välityspalvelimena ja mahdollistaa HTTPS:n.

### 1. Asenna Nginx

**Ubuntu:**
```bash
sudo apt install -y nginx
```

**Amazon Linux:**
```bash
sudo amazon-linux-extras install nginx1 -y
```

### 2. Luo Nginx-konfiguraatio

```bash
# Luo konfiguraatiotiedosto
sudo nano /etc/nginx/sites-available/survey
```

**Lisää seuraava sisältö:**
```nginx
server {
    listen 80;
    server_name survey.yourdomain.com;  # VAIHDA OMA SUBDOMAIN!

    # Logs
    access_log /var/log/nginx/survey-access.log;
    error_log /var/log/nginx/survey-error.log;

    # Reverse proxy Node.js sovellukseen
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Client max body size (for large survey responses if needed)
    client_max_body_size 10M;
}
```

### 3. Aktivoi konfiguraatio

**Ubuntu:**
```bash
# Luo symbolinen linkki
sudo ln -s /etc/nginx/sites-available/survey /etc/nginx/sites-enabled/

# Poista default sivu (valinnainen)
sudo rm /etc/nginx/sites-enabled/default

# Testaa konfiguraatio
sudo nginx -t

# Käynnistä Nginx uudelleen
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**Amazon Linux:**
```bash
# Siirrä konfiguraatio oikeaan paikkaan
sudo mv /etc/nginx/sites-available/survey /etc/nginx/conf.d/survey.conf

# Testaa konfiguraatio
sudo nginx -t

# Käynnistä Nginx uudelleen
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Subdomain DNS-asetukset

### 1. Lisää A-record domain-hallinnassa

Mene domain-palveluntarjoajasi hallintapaneeliin (esim. Namecheap, GoDaddy, AWS Route53)

**Lisää uusi A-record:**
```
Type:  A Record
Host:  survey               (tai subdomain-nimesi)
Value: YOUR_EC2_IP_ADDRESS
TTL:   Automatic / 300
```

**Esimerkki:**
```
survey.yourdomain.com → 54.123.45.67
```

### 2. Odota DNS:n päivittymistä

DNS-muutokset voivat kestää 5-30 minuuttia.

**Tarkista DNS:**
```bash
# Paikallisesti
nslookup survey.yourdomain.com

# Tai
dig survey.yourdomain.com
```

### 3. Testaa subdomain

Avaa selaimessa: `http://survey.yourdomain.com`

Sovelluksen pitäisi nyt näkyä!

---

## SSL-sertifikaatti (HTTPS)

Käytetään Let's Encrypt -palvelua ilmaiseen SSL-sertifikaattiin.

### 1. Asenna Certbot

**Ubuntu:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Amazon Linux:**
```bash
sudo yum install -y certbot python3-certbot-nginx
# TAI jos ei toimi:
sudo python3 -m pip install certbot certbot-nginx
```

### 2. Hanki SSL-sertifikaatti

```bash
# Hanki ja asenna sertifikaatti automaattisesti
sudo certbot --nginx -d survey.yourdomain.com

# Seuraa ohjeita:
# - Syötä sähköpostiosoite
# - Hyväksy käyttöehdot (Y)
# - Valitse haluatko jakaa sähköpostia (N tai Y)
# - Valitse: Redirect (2) - pakottaa HTTPS:n
```

### 3. Testaa HTTPS

Avaa selaimessa: `https://survey.yourdomain.com`

Pitäisi näkyä lukon kuvake ja toimia turvallisesti!

### 4. Automaattinen uusiminen

```bash
# Testaa automaattinen uusiminen
sudo certbot renew --dry-run

# Certbot asettaa automaattisen uusimisen croniin
# Sertifikaatti uusiutuu automaattisesti ennen vanhentumista
```

---

## Tuotanto-optimoinnit

### 1. Poista turhat portit Security Groupista

```
# Poista:
- Custom (3000) - ei enää tarvita, koska Nginx hoitaa
```

### 2. Aseta firewall (valinnainen)

**Ubuntu:**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

### 3. Säännölliset varmuuskopiot

**Luo backup-skripti:**
```bash
nano ~/backup-survey.sh
```

**Sisältö:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/survey-backups
mkdir -p $BACKUP_DIR

# Varmuuskopioi tietokanta
cp ~/survey-app/survey.db $BACKUP_DIR/survey_$DATE.db

# Säilytä vain viimeiset 30 päivää
find $BACKUP_DIR -name "survey_*.db" -mtime +30 -delete

echo "Backup completed: survey_$DATE.db"
```

**Aseta oikeudet ja testaa:**
```bash
chmod +x ~/backup-survey.sh
~/backup-survey.sh
```

**Aseta automaattinen varmuuskopiointi (päivittäin klo 2:00):**
```bash
crontab -e
# Lisää rivi:
0 2 * * * /home/ubuntu/backup-survey.sh
```

### 4. Seuranta ja lokit

```bash
# PM2 lokit
pm2 logs survey-app

# Nginx lokit
sudo tail -f /var/log/nginx/survey-access.log
sudo tail -f /var/log/nginx/survey-error.log

# Järjestelmä lokit
sudo journalctl -u nginx -f
```

---

## Päivitykset

### Päivitä sovellus (Git)

```bash
cd ~/survey-app

# Ota uusimmat muutokset
git pull

# Asenna mahdolliset uudet riippuvuudet
npm install --production

# Käynnistä PM2 uudelleen
pm2 restart survey-app
```

### Päivitä sovellus (SCP)

```bash
# Paikallisesti - luo uusi paketti
cd /Users/eng-fowsi/Desktop/Innovatio-survey
tar -czf survey-app.tar.gz --exclude='node_modules' --exclude='*.db' .
scp -i /path/to/your-key.pem survey-app.tar.gz ubuntu@YOUR_EC2_IP:~/

# EC2:ssa
cd ~/survey-app
tar -xzf ../survey-app.tar.gz
npm install --production
pm2 restart survey-app
```

---

## Vianmääritys

### Ongelma: Sivusto ei vastaa

```bash
# Tarkista PM2
pm2 status
pm2 logs survey-app

# Tarkista Nginx
sudo systemctl status nginx
sudo nginx -t

# Tarkista portti
sudo netstat -tlnp | grep 3000
```

### Ongelma: 502 Bad Gateway

```bash
# Sovellus ei ole käynnissä
pm2 restart survey-app

# Tarkista että portti 3000 on käytössä
pm2 logs survey-app
```

### Ongelma: SSL-sertifikaatti ei toimi

```bash
# Uusinta
sudo certbot renew

# Käynnistä Nginx uudelleen
sudo systemctl restart nginx
```

### Ongelma: DNS ei päivity

```bash
# Odota 15-30 minuuttia
# Tarkista DNS
nslookup survey.yourdomain.com

# Tyhjennä selaimen välimuisti
# Tai käytä incognito-tilaa
```

### Ongelma: Tietokanta-virheet

```bash
# Tarkista tietokannan oikeudet
ls -la ~/survey-app/survey.db

# Korjaa oikeudet
chmod 644 ~/survey-app/survey.db

# Tarkista että .env on oikein
cat ~/survey-app/.env
```

---

## Turvallisuus checklist

- ✅ Vaihdettu `.env` tiedoston salasanat ja SECRET
- ✅ Security Group rajoittaa vain tarvittavat portit
- ✅ HTTPS käytössä (SSL-sertifikaatti)
- ✅ Firewall käytössä (UFW)
- ✅ PM2 käynnistyy automaattisesti
- ✅ Säännölliset varmuuskopiot
- ✅ Päivitykset asennettu
- ✅ `.db` ja `.env` eivät ole versionhallinnassa

---

## Hyödyllisiä komentoja

```bash
# Järjestelmän resurssit
htop
df -h               # Levytila
free -h            # Muisti

# PM2 seuranta
pm2 monit

# Nginx testi
sudo nginx -t

# Käynnistä kaikki uudelleen
pm2 restart all
sudo systemctl restart nginx

# Tarkista avoimet portit
sudo netstat -tlnp

# Tarkista prosessit
ps aux | grep node
```

---

## Yhteenveto - Pika-asennusohje

```bash
# 1. Yhdistä EC2:een
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Asenna Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Siirrä ja pura sovellus
scp -i your-key.pem survey-app.tar.gz ubuntu@YOUR_EC2_IP:~/
mkdir ~/survey-app && tar -xzf survey-app.tar.gz -C ~/survey-app

# 4. Asenna riippuvuudet
cd ~/survey-app
npm install --production

# 5. Konfiguroi .env (muokkaa salasanat!)
nano .env

# 6. Asenna PM2
sudo npm install -g pm2
pm2 start server.js --name survey-app
pm2 startup && pm2 save

# 7. Asenna Nginx
sudo apt install -y nginx

# 8. Konfiguroi Nginx
sudo nano /etc/nginx/sites-available/survey
# (kopioi konfiguraatio ylhäältä)
sudo ln -s /etc/nginx/sites-available/survey /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 9. Aseta DNS (domain-hallinnassa)
# A Record: survey -> YOUR_EC2_IP

# 10. Asenna SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d survey.yourdomain.com

# VALMIS! 🎉
# https://survey.yourdomain.com
```

---

## Tuki

Jos kohtaat ongelmia, tarkista:
1. PM2 lokit: `pm2 logs survey-app`
2. Nginx lokit: `sudo tail -f /var/log/nginx/survey-error.log`
3. Järjestelmä lokit: `sudo journalctl -u nginx -f`

**Onnea käyttöönotossa! 🚀**
