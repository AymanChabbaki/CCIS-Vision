const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');

/**
 * Chatbot Routes
 * All routes require authentication
 */

// Send a message to the chatbot
router.post('/message', authenticate, chatbotController.sendMessage);

// Get conversation history
router.get('/history', authenticate, chatbotController.getHistory);

// Get available Excel templates
router.get('/templates', authenticate, chatbotController.getTemplates);

// Download a specific template
router.get('/templates/:type', authenticate, chatbotController.downloadTemplate);

// Get help topics
router.get('/help', authenticate, chatbotController.getHelpTopics);

// Get FAQ
router.get('/faq', authenticate, chatbotController.getFAQ);

module.exports = router;
