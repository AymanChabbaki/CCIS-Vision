# Automated Alert System - Setup Complete ✅

## Overview
The automated alert and email notification system is now fully operational. The system automatically monitors business rules and sends email notifications to relevant users.

## Features Implemented

### 1. **Email Service** (`backend/src/services/emailService.js`)
- Professional HTML email templates with gradient headers
- Three template types:
  - **Budget Alerts** (Purple gradient) - For budget warnings and exceeded budgets
  - **Activity Deadline Alerts** (Green gradient) - For registration deadline reminders
  - **Data Quality Alerts** (Blue gradient) - For companies with low quality scores
- Responsive design with proper styling
- Automatic recipient management

### 2. **Alert Generation Service** (`backend/src/services/alertService.js`)
Automated checks for 4 critical business rules:

#### Budget Monitoring
- **Warning**: Alerts when budget utilization ≥ 90%
- **Critical**: Alerts when budget utilization = 100%
- Emails sent to all admins
- Prevents duplicate alerts within 7 days

#### Activity Deadlines
- Alerts 7 days before registration deadline
- Emails sent to admins and service users
- Prevents duplicate alerts for same activity

#### Data Quality
- Monitors companies with quality score < 50%
- Creates alerts every 14 days if not resolved
- Emails sent to all admins
- Tracks improvement over time

#### Activity Capacity
- **Warning**: Alerts when activity is 90% full
- **Critical**: Alerts when activity is 100% full
- Emails sent to admins and service users
- Prevents duplicate capacity alerts within 7 days

### 3. **Automated Scheduling** (`backend/src/services/scheduler.js`)
Two cron job schedules:
- **Daily at 9:00 AM**: Full system check
- **Every 6 hours**: Continuous monitoring
- Comprehensive logging of all checks
- Automatic error handling and recovery

### 4. **Manual Trigger Endpoint**
For testing and on-demand checks:
```
POST /api/v1/alerts/trigger-checks
Authorization: Bearer <admin-token>
```

Response includes summary of all checks performed.

## Configuration Required

### SMTP Email Settings
Update your `.env` file with email credentials:

```env
# Email Configuration (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@ccis.ma
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in SMTP_PASSWORD

## Testing the System

### 1. Test Manual Trigger
Use Postman or curl to trigger checks manually:

```bash
curl -X POST http://localhost:5000/api/v1/alerts/trigger-checks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Verify Automated Checks
Check server logs to confirm cron jobs are running:
```
[Alert Scheduler] Daily check job initialized (runs at 9:00 AM)
[Alert Scheduler] Frequent check job initialized (runs every 6 hours)
[Alert Scheduler] Running automated alert checks...
```

### 3. Test Email Delivery
Create test data that triggers alerts:
- Set a budget to 90% utilization
- Create an activity with registration deadline in 6 days
- Add a company with quality score < 50%
- Fill an activity to 90% capacity

## System Integration

### Server Startup (`backend/src/server.js`)
The scheduler is automatically initialized when the server starts:
```javascript
const { initializeScheduledJobs } = require('./src/services/scheduler');
initializeScheduledJobs();
```

### Alert API Routes (`backend/src/routes/alert.routes.js`)
New endpoint added:
- `POST /trigger-checks` - Manually trigger all alert checks (admin only)

### Alert Controller (`backend/src/controllers/alertController.js`)
New controller method:
- `triggerAlertChecks()` - Executes all checks and returns summary

## How It Works

### Automated Flow
1. **Cron Job Triggers** → Runs at scheduled times (9AM daily + every 6 hours)
2. **Service Checks Database** → Queries for threshold violations
3. **Alert Creation** → Creates alerts in database if conditions met
4. **Duplicate Prevention** → Checks for recent similar alerts
5. **Email Notification** → Sends formatted HTML email to relevant users
6. **Logging** → Records all activities and results

### Smart Features
- **No Spam**: Prevents duplicate alerts using time-based checks
- **Targeted Recipients**: Sends to admins for budgets/quality, admins+service users for activities
- **Severity Levels**: Distinguishes between warnings and critical alerts
- **Detailed Context**: Includes threshold values, current values, and actionable information
- **Error Resilience**: Individual check failures don't stop other checks

## Alert Types in Database

| ID | Type | Description |
|----|------|-------------|
| 1 | budget_exceeded | Budget has reached 100% utilization |
| 2 | budget_warning | Budget has reached 90% utilization |
| 3 | capacity | Activity participant capacity threshold reached |
| 4 | deadline | Activity registration deadline approaching |
| 5 | data_quality | Company data quality score below threshold |

## Monitoring and Maintenance

### Check Logs
Monitor the application logs for:
- Cron job execution times
- Number of alerts created
- Email delivery status
- Any errors or warnings

### Alert Dashboard
Users can view all alerts in the web interface:
- Navigate to `/alerts` in the frontend
- Filter by read/unread status
- Mark alerts as read
- View alert details and severity

### Database Queries
Check recent alert activity:
```sql
-- Recent alerts
SELECT * FROM alerts 
ORDER BY created_at DESC 
LIMIT 10;

-- Alerts by type
SELECT at.name, COUNT(*) as count
FROM alerts a
JOIN alert_types at ON a.alert_type_id = at.id
GROUP BY at.name;

-- Unread alerts
SELECT COUNT(*) FROM alerts WHERE is_read = false;
```

## Future Enhancements
- Add more alert types (e.g., partner engagement, form submissions)
- Implement alert preferences per user
- Add SMS notifications for critical alerts
- Create weekly summary emails
- Add alert escalation for unresolved issues

## Troubleshooting

### Emails Not Sending
1. Verify SMTP credentials in `.env`
2. Check SMTP_HOST and SMTP_PORT are correct
3. For Gmail, ensure app password is used (not regular password)
4. Check server logs for email errors

### Alerts Not Creating
1. Verify cron jobs are initialized (check startup logs)
2. Manually trigger checks via API endpoint
3. Check database for existing alerts (might be preventing duplicates)
4. Verify threshold data exists (budgets, activities, etc.)

### Duplicate Alerts
1. Check alert creation timestamps
2. Verify duplicate prevention logic (7-day window for most alerts)
3. Review alert service logic for specific alert type

## Support
For issues or questions, check:
- Server logs: `backend/logs/`
- Database alerts table
- Email service configuration
- Cron job status

---
**Status**: ✅ System Active and Monitoring
**Last Updated**: January 29, 2026
