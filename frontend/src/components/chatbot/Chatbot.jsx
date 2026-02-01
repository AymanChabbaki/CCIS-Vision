/**
 * Chatbot Component - AI Assistant Widget
 */
import React, { useState, useEffect, useRef } from 'react';
import chatbotService from '../../services/chatbotService';
import { 
  FiMessageCircle, 
  FiX, 
  FiSend, 
  FiDownload, 
  FiHelpCircle,
  FiBook,
  FiMinus
} from 'react-icons/fi';
import './Chatbot.css';

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTopics, setHelpTopics] = useState([]);
  const messagesEndRef = useRef(null);

  // Load help topics on mount
  useEffect(() => {
    if (isOpen) {
      loadHelpTopics();
      // Add welcome message
      if (messages.length === 0) {
        setMessages([
          {
            type: 'bot',
            data: {
              type: 'text',
              message: 'Bonjour! Je suis votre assistant CCIS-Vision. Comment puis-je vous aider aujourd\'hui?',
              suggestions: [
                'Voir mes statistiques',
                'Télécharger modèles Excel',
                'Comment ajouter une entreprise?',
                'Résoudre une erreur'
              ]
            },
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHelpTopics = async () => {
    try {
      const response = await chatbotService.getHelpTopics();
      setHelpTopics(response.data.topics || []);
    } catch (error) {
      console.error('Error loading help topics:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: userMessage,
        timestamp: new Date()
      }
    ]);

    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(userMessage);
      
      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          data: response.data.response,
          timestamp: new Date(response.data.timestamp)
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          data: {
            type: 'error',
            message: 'Désolé, une erreur s\'est produite. Veuillez réessayer.'
          },
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const handleTemplateDownload = async (type) => {
    try {
      await chatbotService.downloadTemplate(type);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    setShowHelp(false);
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'user') {
      return (
        <div key={index} className="message user-message">
          <div className="message-content">
            <p>{msg.text}</p>
          </div>
          <span className="message-time">
            {msg.timestamp.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      );
    }

    // Bot message
    const { data } = msg;
    
    return (
      <div key={index} className="message bot-message">
        <div className="message-content">
          {renderBotResponse(data)}
        </div>
        <span className="message-time">
          {msg.timestamp.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    );
  };

  const renderBotResponse = (response) => {
    switch (response.type) {
      case 'text':
        return (
          <div>
            <p className="bot-text">{response.message}</p>
            {response.suggestions && response.suggestions.length > 0 && (
              <div className="suggestions">
                {response.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'stats':
        return (
          <div>
            <p className="bot-text">{response.message}</p>
            <div className="stats-grid">
              {Object.entries(response.data).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <span className="stat-label">
                    {key === 'companies' ? 'Entreprises' : 
                     key === 'activities' ? 'Activités' :
                     key === 'unreadAlerts' ? 'Alertes non lues' : key}
                  </span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templates':
        return (
          <div>
            <p className="bot-text">{response.message}</p>
            <div className="templates-list">
              {response.templates.map((template, idx) => (
                <div key={idx} className="template-item">
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                  <button
                    className="download-btn"
                    onClick={() => handleTemplateDownload(template.type)}
                  >
                    <FiDownload /> Télécharger
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div>
            <p className="bot-text">{response.message}</p>
            <div className="solutions-list">
              {response.solutions.map((solution, idx) => (
                <div key={idx} className="solution-item">
                  <h4 className="solution-title">{solution.problem}</h4>
                  <ul className="solution-steps">
                    {solution.solutions.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="error-message">
            <p>{response.message}</p>
          </div>
        );

      default:
        return <p className="bot-text">{response.message}</p>;
    }
  };

  if (!isOpen) {
    return (
      <button
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen(true)}
        title="Ouvrir l'assistant"
      >
        <FiMessageCircle size={24} />
        <span className="pulse-indicator"></span>
      </button>
    );
  }

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-content">
          <FiMessageCircle size={20} />
          <h3>Assistant CCIS-Vision</h3>
          <span className="status-indicator"></span>
        </div>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setShowHelp(!showHelp)}
            title="Aide rapide"
          >
            <FiHelpCircle size={18} />
          </button>
          <button
            className="header-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title="Minimiser"
          >
            <FiMinus size={18} />
          </button>
          <button
            className="header-btn"
            onClick={() => setIsOpen(false)}
            title="Fermer"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Help Panel */}
          {showHelp && (
            <div className="help-panel">
              <h4><FiBook /> Sujets d'aide rapide</h4>
              <div className="help-topics">
                {helpTopics.map((topic, idx) => (
                  <div key={idx} className="help-category">
                    <h5>{topic.category}</h5>
                    <ul>
                      {topic.questions.map((q, qIdx) => (
                        <li key={qIdx}>
                          <button onClick={() => handleQuickQuestion(q)}>
                            {q}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {loading && (
              <div className="message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Posez votre question..."
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
            >
              <FiSend size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
