# Quick Deployment Guide

## Deploy to EC2 in One Command

To update your survey application on EC2, simply run:

```bash
cd /Users/eng-fowsi/Desktop/Innovatio-survey
./deploy-to-ec2.sh
```

## What the Script Does

The `deploy-to-ec2.sh` script automatically:

1. ✅ Packages your application (excludes node_modules, .db, .git)
2. ✅ Uploads to EC2 (13.50.146.127)
3. ✅ Extracts files on the server
4. ✅ Backs up and restores your .env file
5. ✅ Installs/updates dependencies
6. ✅ Restarts PM2 (survey-app)
7. ✅ Cleans up temporary files

## Important: First Time Setup

**Before your first deployment, delete the old database on EC2:**

```bash
ssh -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127 'rm /home/ubuntu/survey-app/survey.db'
```

This ensures the new database schema with q1-q6 columns is created correctly.

## Other Useful Commands

**Connect to EC2:**
```bash
ssh -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127
```

**Check application status:**
```bash
ssh -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127 'pm2 status'
```

**View logs:**
```bash
ssh -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127 'pm2 logs survey-app'
```

**Restart application:**
```bash
ssh -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127 'pm2 restart survey-app'
```

**Backup database from EC2:**
```bash
scp -i /Users/eng-fowsi/Desktop/eu-sw.pem ubuntu@13.50.146.127:/home/ubuntu/survey-app/survey.db ~/Desktop/survey-backup-$(date +%Y%m%d).db
```

## Full Documentation

For complete deployment instructions including Nginx, SSL, and DNS setup, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Troubleshooting

If deployment fails:
1. Check that your EC2 key has correct permissions: `chmod 400 /Users/eng-fowsi/Desktop/eu-sw.pem`
2. Ensure PM2 is installed on EC2: `ssh ... 'which pm2'`
3. Check logs: `ssh ... 'pm2 logs survey-app'`

## Local Testing

Before deploying to EC2, test locally:

```bash
cd /Users/eng-fowsi/Desktop/Innovatio-survey
npm install
node server.js
```

Then visit: http://localhost:3000
