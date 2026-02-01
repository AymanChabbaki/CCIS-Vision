const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

/**
 * Chatbot Service - Intelligent assistant for CCIS-Vision
 * Helps users with tracking, troubleshooting, information, and templates
 */

class ChatbotService {
  constructor() {
    // Knowledge base for common questions and answers
    this.knowledgeBase = {
      // Authentication & Access
      'comment me connecter': 'Pour vous connecter, utilisez votre nom d\'utilisateur et mot de passe sur la page de connexion. Si vous avez oublié vos identifiants, contactez l\'administrateur.',
      'mot de passe oublié': 'Contactez l\'administrateur système pour réinitialiser votre mot de passe.',
      
      // Company Management
      'comment ajouter une entreprise': 'Allez dans le menu "Entreprises" > "Ajouter". Remplissez les informations obligatoires (nom, ICE, téléphone) et cliquez sur "Enregistrer".',
      'comment importer des entreprises': 'Utilisez le menu "Import Excel" > "Entreprises". Téléchargez le modèle Excel, remplissez-le, puis uploadez le fichier.',
      'format ice': 'Le numéro ICE doit contenir exactement 15 chiffres. Exemple: 000123456789012',
      
      // Activities
      'comment créer une activité': 'Naviguez vers "Activités" > "Nouvelle Activité". Sélectionnez l\'entreprise, le type (formation, mission, consultation), et remplissez les détails.',
      'types d\'activités': 'Les types disponibles sont: Formation, Mission, Consultation, Événement.',
      
      // Excel Import
      'erreur import excel': 'Vérifiez que votre fichier respecte le format du modèle. Les erreurs courantes incluent: colonnes manquantes, format ICE incorrect, dates invalides.',
      'télécharger modèle': 'Vous pouvez télécharger les modèles Excel via l\'API /api/v1/chatbot/templates ou demandez-moi "modèle entreprises" ou "modèle activités".',
      
      // Dashboard & Reports
      'voir statistiques': 'Le tableau de bord affiche les KPIs principaux: nombre d\'entreprises, activités, budget utilisé. Utilisez les filtres par date et région.',
      'exporter données': 'Chaque liste (entreprises, activités) dispose d\'un bouton "Exporter en Excel" en haut à droite.',
      
      // Alerts
      'comment gérer les alertes': 'Les alertes apparaissent en haut à droite. Cliquez pour voir les détails et marquer comme résolu.',
      'types d\'alertes': 'Alertes budget, seuils dépassés, données manquantes, doublons détectés.',
      
      // Data Quality
      'améliorer qualité données': 'Assurez-vous que tous les champs obligatoires sont remplis. Le système calcule un score de qualité pour chaque entreprise.',
      'doublons': 'Le système détecte automatiquement les doublons par ICE ou nom similaire. Vous pouvez les fusionner via "Entreprises" > "Doublons".',
      
      // Troubleshooting
      'erreur connexion base de données': 'Vérifiez que PostgreSQL est en cours d\'exécution. Contactez l\'administrateur si le problème persiste.',
      'fichier trop volumineux': 'La taille maximale des fichiers Excel est de 10 MB. Divisez votre fichier en plusieurs parties si nécessaire.',
      'token expiré': 'Votre session a expiré. Veuillez vous reconnecter.',
    };

    // Templates available for download
    this.templates = {
      companies: 'Template_Import_Entreprises.xlsx',
      activities: 'Template_Import_Activites.xlsx',
      budgets: 'Template_Import_Budgets.xlsx',
      participants: 'Template_Import_Participants.xlsx'
    };
  }

  /**
   * Process user message and generate response
   */
  async processMessage(message, userId) {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Log the conversation
    await this.logConversation(userId, message);

    // Check for template requests
    if (this.isTemplateRequest(normalizedMessage)) {
      return this.handleTemplateRequest(normalizedMessage);
    }

    // Check for stats/tracking requests
    if (this.isStatsRequest(normalizedMessage)) {
      return await this.handleStatsRequest(normalizedMessage, userId);
    }

    // Check for troubleshooting
    if (this.isTroubleshootingRequest(normalizedMessage)) {
      return this.handleTroubleshooting(normalizedMessage);
    }

    // Search knowledge base
    const kbResponse = this.searchKnowledgeBase(normalizedMessage);
    if (kbResponse) {
      return {
        type: 'text',
        message: kbResponse,
        suggestions: this.getSuggestions(normalizedMessage)
      };
    }

    // Default response with suggestions
    return {
      type: 'text',
      message: 'Je n\'ai pas compris votre question. Voici quelques sujets que je peux vous aider:',
      suggestions: [
        'Comment ajouter une entreprise?',
        'Télécharger modèle Excel',
        'Voir mes statistiques',
        'Comment gérer les alertes?',
        'Résoudre erreur d\'import'
      ]
    };
  }

  /**
   * Search knowledge base for matching answer
   */
  searchKnowledgeBase(message) {
    for (const [key, value] of Object.entries(this.knowledgeBase)) {
      if (message.includes(key) || this.calculateSimilarity(message, key) > 0.7) {
        return value;
      }
    }
    return null;
  }

  /**
   * Check if message is requesting a template
   */
  isTemplateRequest(message) {
    const templateKeywords = ['modèle', 'template', 'télécharger', 'download', 'xlsx', 'excel'];
    return templateKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle template download requests
   */
  handleTemplateRequest(message) {
    const templates = [];
    
    if (message.includes('entreprise') || message.includes('company')) {
      templates.push({
        name: 'Modèle Entreprises',
        type: 'companies',
        description: 'Modèle Excel pour importer des entreprises avec tous les champs requis'
      });
    }
    
    if (message.includes('activité') || message.includes('activity')) {
      templates.push({
        name: 'Modèle Activités',
        type: 'activities',
        description: 'Modèle Excel pour importer des formations, missions et consultations'
      });
    }
    
    if (message.includes('budget')) {
      templates.push({
        name: 'Modèle Budgets',
        type: 'budgets',
        description: 'Modèle Excel pour importer les budgets et dépenses'
      });
    }
    
    if (message.includes('participant')) {
      templates.push({
        name: 'Modèle Participants',
        type: 'participants',
        description: 'Modèle Excel pour importer les participants aux activités'
      });
    }

    // If no specific template mentioned, return all
    if (templates.length === 0) {
      templates.push(
        {
          name: 'Modèle Entreprises',
          type: 'companies',
          description: 'Modèle Excel pour importer des entreprises'
        },
        {
          name: 'Modèle Activités',
          type: 'activities',
          description: 'Modèle Excel pour importer des activités'
        },
        {
          name: 'Modèle Budgets',
          type: 'budgets',
          description: 'Modèle Excel pour importer des budgets'
        },
        {
          name: 'Modèle Participants',
          type: 'participants',
          description: 'Modèle Excel pour importer des participants'
        }
      );
    }

    return {
      type: 'templates',
      message: 'Voici les modèles Excel disponibles:',
      templates,
      downloadUrl: '/api/v1/chatbot/templates'
    };
  }

  /**
   * Check if message is requesting statistics
   */
  isStatsRequest(message) {
    const statsKeywords = ['statistique', 'stats', 'combien', 'nombre', 'total', 'suivi'];
    return statsKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle statistics requests
   */
  async handleStatsRequest(message, userId) {
    try {
      const stats = {};

      // Get company count
      if (message.includes('entreprise') || message.includes('company')) {
        const companies = await query('SELECT COUNT(*) as count FROM companies');
        stats.companies = companies.rows[0].count;
      }

      // Get activities count
      if (message.includes('activité') || message.includes('activity')) {
        const activities = await query('SELECT COUNT(*) as count FROM activities');
        stats.activities = activities.rows[0].count;
      }

      // Get alerts count
      if (message.includes('alerte') || message.includes('alert')) {
        const alerts = await query('SELECT COUNT(*) as count FROM alerts WHERE is_read = false');
        stats.unreadAlerts = alerts.rows[0].count;
      }

      // If no specific stats requested, get overview
      if (Object.keys(stats).length === 0) {
        const overview = await query(`
          SELECT 
            (SELECT COUNT(*) FROM companies) as companies,
            (SELECT COUNT(*) FROM activities) as activities,
            (SELECT COUNT(*) FROM alerts WHERE is_read = false) as unread_alerts
        `);
        
        return {
          type: 'stats',
          message: 'Voici un aperçu de vos données:',
          data: {
            companies: overview.rows[0].companies,
            activities: overview.rows[0].activities,
            unreadAlerts: overview.rows[0].unread_alerts
          }
        };
      }

      return {
        type: 'stats',
        message: 'Voici les statistiques demandées:',
        data: stats
      };

    } catch (error) {
      return {
        type: 'error',
        message: 'Erreur lors de la récupération des statistiques. Veuillez réessayer.'
      };
    }
  }

  /**
   * Check if message is about troubleshooting
   */
  isTroubleshootingRequest(message) {
    const troubleshootKeywords = ['erreur', 'error', 'problème', 'problem', 'bug', 'ne fonctionne pas', 'doesn\'t work'];
    return troubleshootKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle troubleshooting requests
   */
  handleTroubleshooting(message) {
    const solutions = [];

    if (message.includes('import') || message.includes('excel')) {
      solutions.push({
        problem: 'Erreur d\'import Excel',
        solutions: [
          'Vérifiez que le fichier suit le format du modèle',
          'Assurez-vous que tous les champs obligatoires sont remplis',
          'Vérifiez le format des dates (JJ/MM/AAAA)',
          'Le numéro ICE doit contenir 15 chiffres'
        ]
      });
    }

    if (message.includes('connexion') || message.includes('login')) {
      solutions.push({
        problem: 'Problème de connexion',
        solutions: [
          'Vérifiez votre nom d\'utilisateur et mot de passe',
          'Effacez le cache de votre navigateur',
          'Contactez l\'administrateur pour réinitialiser votre compte'
        ]
      });
    }

    if (message.includes('lent') || message.includes('slow') || message.includes('performance')) {
      solutions.push({
        problem: 'Performance lente',
        solutions: [
          'Utilisez les filtres pour limiter les résultats affichés',
          'Effacez le cache de votre navigateur',
          'Vérifiez votre connexion internet'
        ]
      });
    }

    if (solutions.length > 0) {
      return {
        type: 'troubleshooting',
        message: 'Voici des solutions possibles:',
        solutions
      };
    }

    return {
      type: 'text',
      message: 'Pour vous aider au mieux, pouvez-vous préciser le problème? Par exemple: "erreur import Excel" ou "problème de connexion"'
    };
  }

  /**
   * Get contextual suggestions
   */
  getSuggestions(message) {
    if (message.includes('entreprise')) {
      return [
        'Comment ajouter une entreprise?',
        'Télécharger modèle entreprises',
        'Trouver les doublons'
      ];
    }

    if (message.includes('activité')) {
      return [
        'Comment créer une activité?',
        'Types d\'activités disponibles',
        'Télécharger modèle activités'
      ];
    }

    return [
      'Voir mes statistiques',
      'Télécharger modèles Excel',
      'Comment gérer les alertes?'
    ];
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Log conversation for analytics
   */
  async logConversation(userId, message) {
    try {
      await query(
        `INSERT INTO chatbot_conversations (user_id, message, created_at) 
         VALUES ($1, $2, NOW())`,
        [userId, message]
      );
    } catch (error) {
      console.error('Error logging conversation:', error);
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId, limit = 10) {
    try {
      const result = await query(
        `SELECT message, response, created_at 
         FROM chatbot_conversations 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
}

module.exports = new ChatbotService();
