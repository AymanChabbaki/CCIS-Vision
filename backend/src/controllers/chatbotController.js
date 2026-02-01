const chatbotService = require('../services/chatbotService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Chatbot Controller - Handles chatbot API endpoints
 */

/**
 * Process a chatbot message
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le message ne peut pas être vide'
      });
    }

    // Process the message through chatbot service
    const response = await chatbotService.processMessage(message, userId);

    res.status(200).json({
      status: 'success',
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation history
 */
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const history = await chatbotService.getConversationHistory(userId, limit);

    res.status(200).json({
      status: 'success',
      data: {
        conversations: history,
        count: history.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Download Excel template
 */
exports.downloadTemplate = async (req, res, next) => {
  try {
    const { type } = req.params;

    if (!['companies', 'activities', 'budgets', 'participants'].includes(type)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Type de modèle invalide. Utilisez "companies", "activities", "budgets" ou "participants"'
      });
    }

    const templatesDir = path.join(__dirname, '../../uploads/templates');
    const templateFiles = {
      companies: 'Template_Import_Entreprises.xlsx',
      activities: 'Template_Import_Activites.xlsx',
      budgets: 'Template_Import_Budgets.xlsx',
      participants: 'Template_Import_Participants.xlsx'
    };
    const fileName = templateFiles[type];
    const filePath = path.join(templatesDir, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        status: 'fail',
        message: 'Modèle non trouvé'
      });
    }

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        next(err);
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get available templates list
 */
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = [
      {
        id: 'companies',
        name: 'Modèle Entreprises',
        description: 'Modèle Excel pour importer des entreprises avec tous les champs requis (nom, ICE, téléphone, email, etc.)',
        filename: 'Template_Import_Entreprises.xlsx',
        downloadUrl: '/api/v1/chatbot/templates/companies'
      },
      {
        id: 'activities',
        name: 'Modèle Activités',
        description: 'Modèle Excel pour importer des formations, missions et consultations avec les entreprises bénéficiaires',
        filename: 'Template_Import_Activites.xlsx',
        downloadUrl: '/api/v1/chatbot/templates/activities'
      },
      {
        id: 'budgets',
        name: 'Modèle Budgets',
        description: 'Modèle Excel pour importer les budgets et dépenses par département et activité',
        filename: 'Template_Import_Budgets.xlsx',
        downloadUrl: '/api/v1/chatbot/templates/budgets'
      },
      {
        id: 'participants',
        name: 'Modèle Participants',
        description: 'Modèle Excel pour importer les participants aux formations et activités',
        filename: 'Template_Import_Participants.xlsx',
        downloadUrl: '/api/v1/chatbot/templates/participants'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        templates,
        count: templates.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get quick help topics
 */
exports.getHelpTopics = async (req, res, next) => {
  try {
    const topics = [
      {
        category: 'Authentification',
        questions: [
          'Comment me connecter?',
          'Mot de passe oublié?',
          'Comment changer mon mot de passe?'
        ]
      },
      {
        category: 'Gestion des Entreprises',
        questions: [
          'Comment ajouter une entreprise?',
          'Comment importer des entreprises?',
          'Format du numéro ICE?',
          'Trouver les doublons?'
        ]
      },
      {
        category: 'Gestion des Activités',
        questions: [
          'Comment créer une activité?',
          'Types d\'activités disponibles?',
          'Comment suivre les formations?'
        ]
      },
      {
        category: 'Import Excel',
        questions: [
          'Télécharger modèle Excel',
          'Résoudre erreur d\'import',
          'Format des colonnes?'
        ]
      },
      {
        category: 'Tableau de Bord',
        questions: [
          'Voir mes statistiques',
          'Exporter les données',
          'Filtrer par date/région'
        ]
      },
      {
        category: 'Alertes',
        questions: [
          'Comment gérer les alertes?',
          'Types d\'alertes disponibles',
          'Configurer des seuils'
        ]
      },
      {
        category: 'Dépannage',
        questions: [
          'Erreur de connexion base de données',
          'Fichier trop volumineux',
          'Token expiré'
        ]
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        topics,
        totalCategories: topics.length
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ - Frequently Asked Questions
 */
exports.getFAQ = async (req, res, next) => {
  try {
    const faq = [
      {
        question: 'Comment importer des entreprises depuis Excel?',
        answer: 'Téléchargez le modèle Excel via le chatbot ou le menu Import. Remplissez les colonnes requises (nom, ICE, téléphone) et uploadez le fichier. Le système validera automatiquement les données.'
      },
      {
        question: 'Quel est le format du numéro ICE?',
        answer: 'Le numéro ICE doit contenir exactement 15 chiffres. Exemple: 000123456789012. Le système ajoutera automatiquement les zéros manquants.'
      },
      {
        question: 'Comment résoudre une erreur d\'import?',
        answer: 'Les erreurs courantes incluent: colonnes manquantes, format ICE incorrect, dates invalides. Vérifiez que votre fichier suit exactement le modèle fourni.'
      },
      {
        question: 'Comment fusionner des entreprises en doublon?',
        answer: 'Allez dans Entreprises > Doublons. Le système détecte automatiquement les doublons par ICE ou nom similaire. Sélectionnez les entreprises à fusionner et cliquez sur Fusionner.'
      },
      {
        question: 'Comment exporter mes données?',
        answer: 'Chaque liste dispose d\'un bouton "Exporter en Excel" en haut à droite. Vous pouvez appliquer des filtres avant d\'exporter.'
      },
      {
        question: 'Que signifie le score de qualité?',
        answer: 'Le score de qualité (0-100) indique la complétude des informations d\'une entreprise. Plus le score est élevé, plus les données sont complètes et fiables.'
      },
      {
        question: 'Comment configurer des alertes?',
        answer: 'Les alertes sont configurées automatiquement pour: budget dépassé, seuils atteints, doublons détectés. Vous pouvez les personnaliser dans Paramètres > Alertes.'
      },
      {
        question: 'Quelle est la taille maximale des fichiers Excel?',
        answer: 'La taille maximale est de 10 MB. Pour des fichiers plus volumineux, divisez-les en plusieurs parties.'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        faq,
        count: faq.length
      }
    });

  } catch (error) {
    next(error);
  }
};
