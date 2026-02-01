import { useState } from 'react';
import { Search, X, Filter, Calendar, MapPin, Building2, Users } from 'lucide-react';
import Select from './Select';

export default function SearchBar({ 
  onSearch, 
  placeholder = 'Rechercher...', 
  showFilters = false,
  filters = [],
  className = '' 
}) {
  const [searchValue, setSearchValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleSearch = (value) => {
    setSearchValue(value);
    onSearch({ query: value, ...activeFilters });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onSearch({ query: searchValue, ...newFilters });
  };

  const handleClear = () => {
    setSearchValue('');
    setActiveFilters({});
    onSearch({ query: '', ...{} });
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {(searchValue || hasActiveFilters) && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {showFilters && filters.length > 0 && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 border rounded-lg font-medium transition-all flex items-center gap-2 ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-semibold">
                {Object.values(activeFilters).filter(v => v).length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showFilters && filters.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => {
              const FilterIcon = filter.icon;
              return (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {FilterIcon && <FilterIcon className="w-4 h-4 inline mr-1" />}
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <Select
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      options={filter.options || []}
                      placeholder={filter.placeholder || 'Sélectionner...'}
                    />
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
