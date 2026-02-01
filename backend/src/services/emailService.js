const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const templates = {
  budgetAlert: (data) => ({
    subject: `⚠️ ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">CCIS Vision - Alerte Budget</h1>
        </div>
        <div style="padding: 30px; background: #f7fafc;">
          <h2 style="color: #2d3748;">${data.title}</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">${data.message}</p>
          
          ${data.threshold_value ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; color: #718096;">Seuil défini:</td>
                  <td style="padding: 10px; font-weight: bold; color: #2d3748; text-align: right;">${data.threshold_value}%</td>
                </tr>
                ${data.current_value ? `
                <tr>
                  <td style="padding: 10px; color: #718096;">Utilisation actuelle:</td>
                  <td style="padding: 10px; font-weight: bold; color: #e53e3e; text-align: right;">${data.current_value}%</td>
                </tr>
                ` : ''}
              </table>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
              Cette alerte a été générée automatiquement par le système CCIS Vision.
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  activityDeadline: (data) => ({
    subject: `📅 ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">CCIS Vision - Rappel Activité</h1>
        </div>
        <div style="padding: 30px; background: #f7fafc;">
          <h2 style="color: #2d3748;">${data.title}</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">${data.message}</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #10b981; font-size: 18px; font-weight: bold; margin: 0;">
              ${data.days_remaining} jours restants
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
              Connectez-vous à CCIS Vision pour plus de détails.
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  dataQuality: (data) => ({
    subject: `🔍 ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">CCIS Vision - Qualité des Données</h1>
        </div>
        <div style="padding: 30px; background: #f7fafc;">
          <h2 style="color: #2d3748;">${data.title}</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">${data.message}</p>
          
          ${data.company_name ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #718096; margin: 0;">Entreprise concernée:</p>
              <p style="color: #2d3748; font-weight: bold; font-size: 18px; margin: 10px 0;">${data.company_name}</p>
              <p style="color: #e53e3e; font-size: 16px; margin: 0;">Score: ${data.current_value}%</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
              Veuillez compléter les informations manquantes dans CCIS Vision.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Send email notification
 */
const sendEmail = async (to, template, data) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn('Email configuration missing, skipping email send');
      return { success: false, message: 'Email not configured' };
    }

    const emailContent = templates[template](data);

    const mailOptions = {
      from: `"CCIS Vision" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send alert notification email
 */
const sendAlertEmail = async (alert, recipients) => {
  try {
    // Determine template based on alert type
    let template = 'budgetAlert'; // default
    
    if (alert.alert_type_id === 4) {
      template = 'activityDeadline';
    } else if (alert.alert_type_id === 5) {
      template = 'dataQuality';
    }

    const results = [];
    for (const recipient of recipients) {
      const result = await sendEmail(recipient, template, alert);
      results.push({ recipient, ...result });
    }

    return results;
  } catch (error) {
    logger.error('Error sending alert emails:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendAlertEmail,
  transporter,
};
