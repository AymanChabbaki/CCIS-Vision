/**
 * Chatbot Service - API calls for chatbot functionality
 */
import api from './api';

/**
 * Send a message to the chatbot
 */
export const sendMessage = async (message) => {
  const response = await api.post('/chatbot/message', { message });
  return response.data;
};

/**
 * Get conversation history
 */
export const getHistory = async (limit = 10) => {
  const response = await api.get(`/chatbot/history?limit=${limit}`);
  return response.data;
};

/**
 * Get available templates
 */
export const getTemplates = async () => {
  const response = await api.get('/chatbot/templates');
  return response.data;
};

/**
 * Download a specific template
 */
export const downloadTemplate = async (type) => {
  const response = await api.get(`/chatbot/templates/${type}`, {
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `template_${type}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

/**
 * Get help topics
 */
export const getHelpTopics = async () => {
  const response = await api.get('/chatbot/help');
  return response.data;
};

/**
 * Get FAQ
 */
export const getFAQ = async () => {
  const response = await api.get('/chatbot/faq');
  return response.data;
};

const chatbotService = {
  sendMessage,
  getHistory,
  getTemplates,
  downloadTemplate,
  getHelpTopics,
  getFAQ,
};

export default chatbotService;
