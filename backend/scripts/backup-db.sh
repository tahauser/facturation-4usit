#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups/facturation"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump facturation_4usit > $BACKUP_DIR/facturation_4usit_$DATE.sql
echo "✅ Backup: $BACKUP_DIR/facturation_4usit_$DATE.sql"
