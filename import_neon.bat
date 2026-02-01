@echo off
psql "postgresql://neondb_owner:npg_4Mrw9fyNgSqG@ep-sparkling-darkness-ahwmfcfu-pooler.us-east-1.aws.neon.tech/ccis_vision?sslmode=require&channel_binding=require" -f "database/ccis_vision_export_neon.sql"
pause
