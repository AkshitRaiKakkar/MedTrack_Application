import React from 'react';
import { DollarSign, Tag, RotateCcw } from 'lucide-react';

/**
 * Default price presets configuration
 */
export const DEFAULT_PRICE_PRESETS = [
  { id: 'free', label: 'Free', min: 0, max: 0 },
  { id: 'under_25', label: 'Under $25', min: 0, max: 25 },
  { id: '25_to_50', label: '$25 – $50', min: 25, max: 50 },
  { id: '50_plus', label: '$50+', min: 50, max: 100 },
  { id: 'all', label: 'All Prices', min: 0, max: 100 },
];

/**
 * PriceFilterPresetGroup - Preset shortcuts for rapid dual-range filtering.
 * 
 * @param {Object} props
 * @param {[number, number]} props.currentValue - Active [minVal, maxVal]
 * @param {Function} props.onSelectPreset - Callback fired when a preset button is clicked: (min, max) => void
 * @param {Array} props.presets - Custom presets list
 * @param {number} props.maxBound - Global upper limit (default 100)
 * @param {string} props.className - Extra CSS classes
 */
export const PriceFilterPresetGroup = ({
  currentValue = [0, 100],
  onSelectPreset,
  presets = DEFAULT_PRICE_PRESETS,
  maxBound = 100,
  className = '',
}) => {
  const [curMin, curMax] = currentValue;

  const isPresetActive = (preset) => {
    if (preset.id === '50_plus') {
      return curMin === 50 && curMax === maxBound;
    }
    return curMin === preset.min && curMax === (preset.max === 100 ? maxBound : preset.max);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
        <Tag className="w-3.5 h-3.5 text-indigo-500" /> Presets:
      </span>
      {presets.map((preset) => {
        const active = isPresetActive(preset);
        const targetMax = preset.max === 100 ? maxBound : preset.max;

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset && onSelectPreset(preset.min, targetMax)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 flex items-center gap-1 shadow-sm border ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-300 dark:ring-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-750'
            }`}
          >
            {preset.id === 'free' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-0.5 inline-block" />
            ) : (
              <DollarSign className={`w-3 h-3 ${active ? 'text-white' : 'text-slate-400'}`} />
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

export default PriceFilterPresetGroup;
