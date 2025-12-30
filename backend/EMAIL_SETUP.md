# Email Configuration Guide

This guide explains how to set up email functionality for Focus Forge team invitations.

## Overview

When a team member is invited, an email is automatically sent to the invitee with:
- A personalized invitation message
- A unique invitation link
- Team details

## Configuration Options

### Option 1: Gmail (Recommended for Development)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password
1. Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your setup)
3. Google will generate a 16-character password
4. Copy this password

#### Step 3: Update .env file
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM_NAME=Focus Forge
EMAIL_FROM_ADDRESS=noreply@focusforge.com
FRONTEND_URL=http://localhost:8081
```

### Option 2: SendGrid

#### Step 1: Create SendGrid Account
1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your sender email
3. Create an API key

#### Step 2: Update .env file
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM_NAME=Focus Forge
EMAIL_FROM_ADDRESS=noreply@focusforge.com
FRONTEND_URL=http://localhost:8081
```

### Option 3: Other SMTP Services (Mailgun, AWS SES, etc.)

Use the SMTP configuration from your provider:
```env
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port (usually 587 for TLS or 465 for SSL)
EMAIL_USER=your_username
EMAIL_PASSWORD=your_password
EMAIL_FROM_NAME=Focus Forge
EMAIL_FROM_ADDRESS=noreply@focusforge.com
FRONTEND_URL=http://localhost:8081
```

## Testing Email Functionality

### Method 1: Using MailHog (Local Testing)

For development, you can use MailHog to catch emails locally:

```env
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM_NAME=Focus Forge
EMAIL_FROM_ADDRESS=test@focusforge.local
FRONTEND_URL=http://localhost:8081
```

Then run MailHog:
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Visit http://localhost:8025 to see captured emails.

### Method 2: Using Ethereal (Free Temporary Service)

Visit [Ethereal](https://ethereal.email/create) to create a temporary email account:

```env
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_ethereal_email@ethereal.email
EMAIL_PASSWORD=your_ethereal_password
EMAIL_FROM_NAME=Focus Forge
EMAIL_FROM_ADDRESS=noreply@focusforge.com
FRONTEND_URL=http://localhost:8081
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server host | smtp.gmail.com |
| `EMAIL_PORT` | SMTP server port | 587 |
| `EMAIL_USER` | Email username/account | your_email@gmail.com |
| `EMAIL_PASSWORD` | Email password/app password | xxxxxxxxxxxxxxxx |
| `EMAIL_FROM_NAME` | Display name in emails | Focus Forge |
| `EMAIL_FROM_ADDRESS` | From email address | noreply@focusforge.com |
| `FRONTEND_URL` | Frontend URL for invitation links | http://localhost:8081 |

## Troubleshooting

### Emails Not Sending

1. Check server logs for error messages
2. Verify credentials are correct
3. Ensure firewall allows SMTP connections
4. Check that 2FA and app passwords are properly configured (for Gmail)

### Emails Going to Spam

1. Configure DKIM, SPF, and DMARC records
2. Use a professional email service (SendGrid, Mailgun)
3. Avoid common spam trigger words
4. Ensure proper email headers

### SSL/TLS Issues

- Port 587 uses TLS (recommended)
- Port 465 uses SSL
- Port 25 is typically blocked by ISPs

## Email Templates

Email templates are defined in `backend/utils/emailService.js`:

- **Team Invitation**: Sent when someone is invited to a team
- **Invitation Accepted**: Sent to the inviter when invitation is accepted

You can customize these templates by editing the `emailTemplates` object in `emailService.js`.

## Production Considerations

1. **Use a Professional Email Service**: SendGrid, Mailgun, AWS SES
2. **Set Up DNS Records**: SPF, DKIM, DMARC for deliverability
3. **Monitor Delivery**: Track bounces and complaints
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Secure Credentials**: Use environment variables, never hardcode passwords
6. **Test Thoroughly**: Test in staging before production

## Disabling Email (Optional)

If you want to run without email functionality:

1. Email service will gracefully fail
2. Invitations can still be shared manually using the link
3. No configuration needed - just don't set EMAIL_USER

The system will log a warning but continue functioning.
