#!/bin/bash

# EC2 Deployment Script for Innovatio Survey
# This script packages and deploys the application to EC2

set -e  # Exit on error

# Configuration
EC2_KEY="/Users/eng-fowsi/Desktop/eu-sw.pem"
EC2_USER="ubuntu"
EC2_IP="13.50.146.127"
EC2_PATH="/home/ubuntu/survey-app"
LOCAL_PATH="/Users/eng-fowsi/Desktop/Innovatio-survey"

echo "🚀 Starting deployment to EC2..."

# Step 1: Package the application locally
echo "📦 Packaging application..."
cd "$LOCAL_PATH"
tar -czf survey-app.tar.gz \
  --exclude='node_modules' \
  --exclude='*.db' \
  --exclude='.DS_Store' \
  --exclude='.git' \
  --exclude='deploy-to-ec2.sh' \
  --exclude='survey-app.tar.gz' \
  .

echo "✅ Package created: survey-app.tar.gz"

# Step 2: Copy to EC2
echo "📤 Uploading to EC2..."
scp -i "$EC2_KEY" survey-app.tar.gz ${EC2_USER}@${EC2_IP}:~/

echo "✅ Upload complete"

# Step 3: Extract and setup on EC2
echo "🔧 Setting up on EC2..."
ssh -i "$EC2_KEY" ${EC2_USER}@${EC2_IP} << 'ENDSSH'
  set -e

  echo "📂 Extracting files..."
  cd ~/survey-app

  # Backup current .env if it exists
  if [ -f .env ]; then
    echo "💾 Backing up .env file..."
    cp .env .env.backup
  fi

  # Extract new files (this will overwrite old files)
  tar -xzf ../survey-app.tar.gz

  # Restore .env if we backed it up
  if [ -f .env.backup ]; then
    echo "♻️  Restoring .env file..."
    mv .env.backup .env
  fi

  # Remove the tar file
  rm ~/survey-app.tar.gz

  # Install/update dependencies
  echo "📚 Installing dependencies..."
  npm install --production

  # Restart PM2
  echo "🔄 Restarting application..."
  pm2 restart survey-app || echo "⚠️  PM2 not running or app not started yet"

  echo "✅ Deployment complete on EC2!"
ENDSSH

# Step 4: Clean up local tar file
echo "🧹 Cleaning up..."
rm "$LOCAL_PATH/survey-app.tar.gz"

echo ""
echo "✨ Deployment successful! ✨"
echo "🌐 Your app should be live at: https://survey.yourdomain.com"
echo ""
echo "📊 To check status, run:"
echo "   ssh -i $EC2_KEY ${EC2_USER}@${EC2_IP} 'pm2 status'"
echo ""
echo "📋 To view logs, run:"
echo "   ssh -i $EC2_KEY ${EC2_USER}@${EC2_IP} 'pm2 logs survey-app'"
