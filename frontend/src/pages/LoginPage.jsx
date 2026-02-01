/**
 * Login Page - CCIS Vision Authentication
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common';
import { User, Lock, AlertCircle, TrendingUp, BarChart3, Users, Building2, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    clearError();
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 lg:p-16">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/logo.png" 
              alt="CCIS Logo" 
              className="h-32 w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bienvenue
            </h1>
            <p className="text-gray-600">
              Connectez-vous à votre espace CCIS Vision
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 animate-fade-in">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Chambre de Commerce, d'Industrie et de Services
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Rabat-Salé-Kénitra
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          {/* Floating Circles */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-delay"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-float-slow"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white">
          <div className="max-w-lg space-y-8">
            {/* Main Title */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight">
                CCIS Vision
              </h2>
              <p className="text-xl text-blue-100">
                Système de Gestion Intelligent
              </p>
              <div className="h-1 w-20 bg-blue-300 rounded-full"></div>
            </div>

            {/* Features */}
            <div className="space-y-6 mt-12">
              <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform duration-300">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Suivi en Temps Réel</h3>
                  <p className="text-blue-200 text-sm">Surveillez vos activités et performances</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform duration-300">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Analyses Avancées</h3>
                  <p className="text-blue-200 text-sm">Tableaux de bord et rapports détaillés</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform duration-300">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="h-6 w-6 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gestion Collaborative</h3>
                  <p className="text-blue-200 text-sm">Travaillez en équipe efficacement</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 transform hover:translate-x-2 transition-transform duration-300">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gestion des Entreprises</h3>
                  <p className="text-blue-200 text-sm">Base de données complète et organisée</p>
                </div>
              </div>
            </div>

            {/* Stats - Animated */}
            <div className="grid grid-cols-3 gap-6 mt-16 pt-8 border-t border-blue-400/30">
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-200 mt-1">Entreprises</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold">1200+</div>
                <div className="text-sm text-blue-200 mt-1">Activités</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-blue-200 mt-1">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
