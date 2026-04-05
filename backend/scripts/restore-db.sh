#!/bin/bash
if [ -z "$1" ]; then echo "Usage: ./restore-db.sh <fichier.sql>"; exit 1; fi
echo "⚠️ Continuer? (y/n)"; read c; if [ "$c" != "y" ]; then exit 1; fi
sudo -u postgres psql -c "DROP DATABASE IF EXISTS facturation_4usit;"
sudo -u postgres psql -c "CREATE DATABASE facturation_4usit OWNER facturation_user;"
sudo -u postgres psql facturation_4usit < $1
echo "✅ Base restaurée"
