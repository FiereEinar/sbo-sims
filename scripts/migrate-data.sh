#!/bin/bash
# MongoDB Migration Script - Local to Atlas
# Database: 22025 -> sbo-sims on Atlas

LOCAL_URI="mongodb://localhost:27017"
ATLAS_URI=""
LOCAL_DB="22025"
ATLAS_DB="sbo-sims"
BACKUP_DIR="./migration-backup"

echo "Starting migration from local database '$LOCAL_DB' to Atlas database '$ATLAS_DB'..."

# Step 1: Backup local database
echo ""
echo "Step 1: Creating backup of local database..."
mongodump --uri="$LOCAL_URI" --db=$LOCAL_DB --out=$BACKUP_DIR

if [ $? -ne 0 ]; then
    echo "Error: Backup failed!"
    exit 1
fi

echo "Backup completed successfully!"

# Step 2: Restore to Atlas with new database name
echo ""
echo "Step 2: Restoring to Atlas..."
mongorestore --uri="$ATLAS_URI" --db=$ATLAS_DB "$BACKUP_DIR/$LOCAL_DB"

if [ $? -ne 0 ]; then
    echo "Error: Restore to Atlas failed!"
    exit 1
fi

echo ""
echo "Migration completed successfully!"
echo "Local database '$LOCAL_DB' has been migrated to Atlas as '$ATLAS_DB'"
echo ""
echo "Collections migrated:"
echo "  - transactions (393 documents)"
echo "  - categories"
echo "  - prelistings"
echo "  - students"
