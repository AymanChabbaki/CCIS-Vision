import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from './index';

export default function FilterPanel({ 
  filters = [], 
  values = {},
  onFilterChange, 
  onReset,
  title = 'Filtres',
  className = '' 
}) {
  const handleChange = (key, value) => {
    const newValues = { ...values, [key]: value };
    if (onFilterChange) {
      onFilterChange(newValues);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const activeFiltersCount = Object.values(values).filter(
    v => v !== '' && v !== null && v !== undefined
  ).length;

  const renderFilterInput = (filter) => {
    const value = values[filter.key] || '';
    const Icon = filter.icon;

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">{filter.placeholder || 'Tous'}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleChange(filter.key, selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[100px]"
          >
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value?.from || ''}
              onChange={(e) => handleChange(filter.key, { ...value, from: e.target.value })}
              placeholder="Du"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <input
              type="date"
              value={value?.to || ''}
              onChange={(e) => handleChange(filter.key, { ...value, to: e.target.value })}
              placeholder="Au"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            min={filter.min}
            max={filter.max}
            step={filter.step}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              min={filter.min || 0}
              max={filter.max || 100}
              step={filter.step || 1}
              className="w-full"
            />
            <div className="text-sm text-gray-600 text-center">{value || filter.min || 0}</div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(filter.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">{filter.checkboxLabel}</label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={filter.key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="relative">
            {Icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              placeholder={filter.placeholder}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                Icon ? 'pl-9' : ''
              }`}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className={filter.fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {filter.label}
                {filter.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderFilterInput(filter)}
              {filter.description && (
                <p className="mt-1 text-xs text-gray-500">{filter.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
