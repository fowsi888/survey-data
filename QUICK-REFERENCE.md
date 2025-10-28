# Quick Reference - EC2 Deployment Commands

Pikaviiteopas yleisimpiin komentoihin EC2-palvelimella.

---

## SSH Yhteys

```bash
# Yhdistä EC2:een
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP

# Kopioi tiedostoja EC2:een
scp -i /path/to/your-key.pem file.txt ubuntu@YOUR_EC2_IP:~/
```

---

## PM2 Komennot

```bash
# Listaa kaikki prosessit
pm2 list
pm2 status

# Näytä lokit
pm2 logs                    # Kaikki lokit
pm2 logs survey-app         # Tietyn prosessin lokit
pm2 logs --lines 100        # Näytä viimeiset 100 riviä

# Käynnistä/pysäytä/restart
pm2 start server.js --name survey-app
pm2 stop survey-app
pm2 restart survey-app
pm2 reload survey-app       # Zero-downtime restart

# Poista prosessi
pm2 delete survey-app

# Seuranta
pm2 monit                   # Reaaliaikainen seuranta

# Tallenna tila
pm2 save

# Tyhjennä lokit
pm2 flush
```

---

## Nginx Komennot

```bash
# Testaa konfiguraatio
sudo nginx -t

# Käynnistä/pysäytä/restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx    # Uudelleenlataa ilman pysäytystä

# Tarkista status
sudo systemctl status nginx

# Näytä lokit
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/survey-access.log
sudo tail -f /var/log/nginx/survey-error.log

# Editoi konfiguraatiota
sudo nano /etc/nginx/sites-available/survey
```

---

## Sovelluksen Päivitys

### Git-pohjainen päivitys

```bash
cd ~/survey-app
git pull
npm install --production
pm2 restart survey-app
```

### Manuaalinen päivitys (SCP)

```bash
# PAIKALLISELLA KONEELLA:
cd /Users/eng-fowsi/Desktop/Innovatio-survey
tar -czf survey-app.tar.gz --exclude='node_modules' --exclude='*.db' .
scp -i /path/to/your-key.pem survey-app.tar.gz ubuntu@YOUR_EC2_IP:~/

# EC2:SSA:
cd ~/survey-app
tar -xzf ../survey-app.tar.gz
npm install --production
pm2 restart survey-app
```

---

## Tietokanta

```bash
# Varmuuskopio
cp ~/survey-app/survey.db ~/survey-app/survey_backup_$(date +%Y%m%d).db

# Lataa paikalliselle koneelle
scp -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP:~/survey-app/survey.db ./survey_backup.db

# Palauta varmuuskopio
cp ~/survey-app/survey_backup_20241028.db ~/survey-app/survey.db
pm2 restart survey-app

# Tarkista tiedoston koko
ls -lh ~/survey-app/survey.db

# Tarkista tietueiden määrä (vaatii sqlite3)
sqlite3 ~/survey-app/survey.db "SELECT COUNT(*) FROM responses;"
```

---

## SSL-sertifikaatti (Let's Encrypt)

```bash
# Uusinta manuaalisesti
sudo certbot renew

# Testaa automaattinen uusiminen
sudo certbot renew --dry-run

# Listaa sertifikaatit
sudo certbot certificates

# Poista sertifikaatti
sudo certbot delete --cert-name survey.yourdomain.com
```

---

## Järjestelmän Seuranta

```bash
# Levytila
df -h

# Muisti
free -h

# CPU ja muisti reaaliajassa
htop               # Jos asennettu
top                # Oletus

# Prosessit
ps aux | grep node
ps aux | grep nginx

# Avoimet portit
sudo netstat -tlnp
sudo ss -tlnp

# Järjestelmän lokit
sudo journalctl -xe           # Viimeisimmät virheet
sudo journalctl -u nginx -f   # Nginx lokit live
sudo journalctl -u nginx --since "1 hour ago"
```

---

## Firewall (UFW)

```bash
# Tila
sudo ufw status verbose

# Salli/estä
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw deny 3000/tcp

# Poista sääntö
sudo ufw delete allow 3000/tcp

# Aktivoi/deaktivoi
sudo ufw enable
sudo ufw disable

# Reset (VAROITUS: estää kaiken!)
sudo ufw reset
```

---

## Ympäristömuuttujat

```bash
# Muokkaa .env
cd ~/survey-app
nano .env

# Tarkista .env (ilman arkaluontoisia tietoja)
cat .env

# Generoi uusi SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Muutosten jälkeen:
pm2 restart survey-app
```

---

## Git Komennot

```bash
# Tila
git status

# Lataa muutokset
git pull

# Katso muutokset
git diff
git log --oneline -10

# Palauta tiedosto
git checkout -- filename

# Palauta kaikki muutokset
git reset --hard HEAD
```

---

## Node.js & NPM

```bash
# Versiot
node --version
npm --version

# Asenna riippuvuudet
npm install
npm install --production    # Vain tuotantopaketit

# Päivitä riippuvuudet
npm update

# Listaa asennetut paketit
npm list --depth=0

# Puhdista npm cache
npm cache clean --force
```

---

## Varmuuskopiot

```bash
# Luo varmuuskopio
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/backups
tar -czf ~/backups/survey_$DATE.tar.gz -C ~/survey-app .

# Palauta varmuuskopio
cd ~/survey-app
tar -xzf ~/backups/survey_20241028_120000.tar.gz

# Lataa varmuuskopio paikalliselle
scp -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP:~/backups/survey_20241028_120000.tar.gz ./

# Poista vanhat varmuuskopiot (yli 30 päivää vanhat)
find ~/backups -name "survey_*.tar.gz" -mtime +30 -delete
```

---

## Vianmääritys

```bash
# Tarkista että sovellus vastaa
curl http://localhost:3000

# Tarkista DNS
nslookup survey.yourdomain.com
dig survey.yourdomain.com

# Testaa HTTPS
curl -I https://survey.yourdomain.com

# Tarkista avoimet yhteydet
sudo netstat -anp | grep :3000
sudo netstat -anp | grep :80

# Kill prosessi portissa 3000
sudo lsof -ti:3000 | xargs kill -9

# Käynnistä kaikki uudelleen
pm2 restart all
sudo systemctl restart nginx

# Puhdista PM2 prosessit
pm2 kill
pm2 start server.js --name survey-app
```

---

## Automaattinen varmuuskopiointi

```bash
# Luo backup skripti
nano ~/backup-survey.sh

# Sisältö (kopioi DEPLOYMENT.md:stä)

# Tee executable
chmod +x ~/backup-survey.sh

# Testaa
~/backup-survey.sh

# Aseta cron (päivittäin klo 2:00)
crontab -e
# Lisää: 0 2 * * * /home/ubuntu/backup-survey.sh

# Tarkista cron
crontab -l
```

---

## Yleisimmät ongelmat & ratkaisut

### Sovellus ei käynnisty

```bash
pm2 logs survey-app           # Katso virhe
cd ~/survey-app
npm install --production      # Asenna riippuvuudet uudelleen
pm2 restart survey-app
```

### 502 Bad Gateway

```bash
pm2 status                    # Varmista että sovellus on käynnissä
pm2 restart survey-app
sudo systemctl restart nginx
```

### HTTPS ei toimi

```bash
sudo certbot renew
sudo systemctl restart nginx
```

### DNS ei päivity

```bash
# Odota 15-30 min
# Tyhjennä selaimen välimuisti tai käytä incognito
# Tarkista: nslookup survey.yourdomain.com
```

### Tietokanta-virheet

```bash
ls -la ~/survey-app/survey.db
chmod 644 ~/survey-app/survey.db
pm2 restart survey-app
```

---

## Hyödylliset aliakset

Lisää nämä `~/.bashrc` tiedostoon helpottamaan työtä:

```bash
nano ~/.bashrc

# Lisää loppu:
alias survey='cd ~/survey-app'
alias logs='pm2 logs survey-app'
alias restart='pm2 restart survey-app'
alias status='pm2 status'
alias ngtest='sudo nginx -t'
alias ngrestart='sudo systemctl restart nginx'
alias backup='~/backup-survey.sh'

# Tallenna ja lataa uudelleen:
source ~/.bashrc
```

Nyt voit käyttää lyhyitä komentoja:
```bash
survey          # Siirtyy sovelluksen kansioon
logs            # Näyttää lokit
restart         # Käynnistää sovelluksen uudelleen
status          # Näyttää statuksen
ngtest          # Testaa Nginx konfiguraation
ngrestart       # Käynnistää Nginxin uudelleen
backup          # Luo varmuuskopion
```

---

## Tärkeät tiedostot ja polut

```
~/survey-app/                      # Sovelluksen kansio
~/survey-app/server.js             # Pääohjelma
~/survey-app/.env                  # Ympäristömuuttujat
~/survey-app/survey.db             # SQLite tietokanta
~/survey-app/public/               # Staattiset tiedostot

/etc/nginx/sites-available/survey  # Nginx config
/etc/nginx/sites-enabled/survey    # Symlink

/var/log/nginx/survey-access.log   # Nginx access log
/var/log/nginx/survey-error.log    # Nginx error log

~/.pm2/logs/                       # PM2 lokit
```

---

## Yhteystiedot ja URL:t

```
Sovellus:  https://survey.yourdomain.com
Dashboard: https://survey.yourdomain.com/dashboard

SSH: ssh -i key.pem ubuntu@YOUR_EC2_IP
```

---

**💡 Vinkki**: Tallenna tämä tiedosto kirjanmerkkeihin tai tulosta!
