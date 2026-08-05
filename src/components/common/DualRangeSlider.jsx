import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * DualRangeSlider - A robust, accessible, dual-thumb range slider component.
 * 
 * @param {Object} props
 * @param {number} props.min - Minimum allowable value (default 0)
 * @param {number} props.max - Maximum allowable value (default 100)
 * @param {number} props.step - Step interval (default 1)
 * @param {[number, number]} props.value - Controlled range value array [minVal, maxVal]
 * @param {Function} props.onChange - Callback fired on value change: onChange([minVal, maxVal])
 * @param {Function} props.formatValue - Custom formatting function for display values: (val) => string
 * @param {number} props.minStepsBetweenThumbs - Minimum step distance enforced between thumbs (default 1)
 * @param {boolean} props.disabled - Whether the slider is disabled (default false)
 * @param {boolean} props.showTooltips - Whether to display floating tooltips above thumbs (default true)
 * @param {string} props.accentColor - Color theme for active selection track ("indigo", "emerald", "rose", "cyan", "amber")
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabelMin - Accessibility label for min thumb
 * @param {string} props.ariaLabelMax - Accessibility label for max thumb
 */
export const DualRangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = [0, 100],
  onChange,
  formatValue = (val) => `${val}`,
  minStepsBetweenThumbs = 1,
  disabled = false,
  showTooltips = true,
  accentColor = 'indigo',
  className = '',
  ariaLabelMin = 'Minimum value',
  ariaLabelMax = 'Maximum value',
  id,
}) => {
  const [internalValue, setInternalValue] = useState(() => {
    if (Array.isArray(value) && value.length === 2) return value;
    return defaultValue;
  });

  const [activeThumb, setActiveThumb] = useState(null); // 'min' | 'max' | null
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef(null);

  // Sync controlled value prop
  useEffect(() => {
    if (Array.isArray(value) && value.length === 2) {
      setInternalValue(value);
    }
  }, [value]);

  const currentMin = internalValue[0];
  const currentMax = internalValue[1];

  const minDistance = minStepsBetweenThumbs * step;

  // Calculate percentage positions for styling
  const getPercent = useCallback(
    (val) => {
      if (max === min) return 0;
      const pct = ((val - min) / (max - min)) * 100;
      return Math.min(Math.max(pct, 0), 100);
    },
    [min, max]
  );

  const minPercent = getPercent(currentMin);
  const maxPercent = getPercent(currentMax);

  // Clamp helper
  const clampValue = useCallback(
    (val, lowerBound, upperBound) => {
      const rounded = Math.round((val - min) / step) * step + min;
      return Math.min(Math.max(rounded, lowerBound), upperBound);
    },
    [min, step]
  );

  // Update value helper with collision safety
  const updateValues = useCallback(
    (newMin, newMax) => {
      let clampedMin = clampValue(newMin, min, max - minDistance);
      let clampedMax = clampValue(newMax, min + minDistance, max);

      if (clampedMin > clampedMax - minDistance) {
        if (activeThumb === 'min') {
          clampedMin = clampedMax - minDistance;
        } else {
          clampedMax = clampedMin + minDistance;
        }
      }

      const nextVal = [clampedMin, clampedMax];
      setInternalValue(nextVal);
      if (onChange) {
        onChange(nextVal);
      }
    },
    [clampValue, min, max, minDistance, activeThumb, onChange]
  );

  // Handle direct min slider input
  const handleMinChange = (e) => {
    if (disabled) return;
    const val = parseFloat(e.target.value);
    const safeMin = Math.min(val, currentMax - minDistance);
    updateValues(safeMin, currentMax);
  };

  // Handle direct max slider input
  const handleMaxChange = (e) => {
    if (disabled) return;
    const val = parseFloat(e.target.value);
    const safeMax = Math.max(val, currentMin + minDistance);
    updateValues(currentMin, safeMax);
  };

  // Drag interaction handling via mouse/touch on track
  const handleTrackPointerDown = (e) => {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clickRatio = (clientX - rect.left) / rect.width;
    const clickedVal = min + clickRatio * (max - min);

    const distToMin = Math.abs(clickedVal - currentMin);
    const distToMax = Math.abs(clickedVal - currentMax);

    if (distToMin < distToMax) {
      setActiveThumb('min');
      const safeMin = Math.min(clickedVal, currentMax - minDistance);
      updateValues(safeMin, currentMax);
    } else {
      setActiveThumb('max');
      const safeMax = Math.max(clickedVal, currentMin + minDistance);
      updateValues(currentMin, safeMax);
    }
  };

  // Accent color map
  const accentClasses = {
    indigo: {
      track: 'bg-indigo-600 dark:bg-indigo-500',
      thumb: 'border-indigo-600 focus-visible:ring-indigo-400',
      tooltip: 'bg-indigo-700 text-white dark:bg-indigo-600',
    },
    emerald: {
      track: 'bg-emerald-600 dark:bg-emerald-500',
      thumb: 'border-emerald-600 focus-visible:ring-emerald-400',
      tooltip: 'bg-emerald-700 text-white dark:bg-emerald-600',
    },
    rose: {
      track: 'bg-rose-600 dark:bg-rose-500',
      thumb: 'border-rose-600 focus-visible:ring-rose-400',
      tooltip: 'bg-rose-700 text-white dark:bg-rose-600',
    },
    cyan: {
      track: 'bg-cyan-600 dark:bg-cyan-500',
      thumb: 'border-cyan-600 focus-visible:ring-cyan-400',
      tooltip: 'bg-cyan-700 text-white dark:bg-cyan-600',
    },
    amber: {
      track: 'bg-amber-600 dark:bg-amber-500',
      thumb: 'border-amber-600 focus-visible:ring-amber-400',
      tooltip: 'bg-amber-700 text-white dark:bg-amber-600',
    },
  }[accentColor] || {
    track: 'bg-indigo-600 dark:bg-indigo-500',
    thumb: 'border-indigo-600 focus-visible:ring-indigo-400',
    tooltip: 'bg-indigo-700 text-white dark:bg-indigo-600',
  };

  return (
    <div
      id={id}
      className={`relative w-full py-6 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveThumb(null);
      }}
    >
      {/* Outer Slider Container */}
      <div
        ref={trackRef}
        className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer touch-none"
        onMouseDown={handleTrackPointerDown}
        onTouchStart={handleTrackPointerDown}
      >
        {/* Active Selected Range Track */}
        <div
          className={`absolute h-full rounded-full transition-all duration-75 ${accentClasses.track}`}
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Hidden Native Input Controls for Accessibility & Keyboard Navigation */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMin}
          disabled={disabled}
          onChange={handleMinChange}
          onFocus={() => setActiveThumb('min')}
          onBlur={() => setActiveThumb(null)}
          aria-label={ariaLabelMin}
          aria-valuenow={currentMin}
          aria-valuemin={min}
          aria-valuemax={currentMax - minDistance}
          className="absolute w-full h-full opacity-0 z-30 cursor-pointer pointer-events-auto"
          style={{
            pointerEvents: activeThumb === 'max' ? 'none' : 'auto',
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMax}
          disabled={disabled}
          onChange={handleMaxChange}
          onFocus={() => setActiveThumb('max')}
          onBlur={() => setActiveThumb(null)}
          aria-label={ariaLabelMax}
          aria-valuenow={currentMax}
          aria-valuemin={currentMin + minDistance}
          aria-valuemax={max}
          className="absolute w-full h-full opacity-0 z-30 cursor-pointer pointer-events-auto"
          style={{
            pointerEvents: activeThumb === 'min' ? 'none' : 'auto',
          }}
        />

        {/* Custom Visual Min Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-2 ${accentClasses.thumb} rounded-full shadow-md transition-transform duration-100 cursor-grab active:cursor-grabbing z-20 ${
            activeThumb === 'min' ? 'scale-125 ring-4 ring-opacity-40' : 'hover:scale-110'
          }`}
          style={{ left: `${minPercent}%` }}
        >
          {/* Floating Tooltip Min */}
          {showTooltips && (
            <div
              className={`absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs font-semibold rounded-md shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${accentClasses.tooltip} ${
                isHovered || activeThumb === 'min' ? 'opacity-100 translate-y-0' : 'opacity-90 -translate-y-0.5'
              }`}
            >
              {formatValue(currentMin)}
              {/* Tooltip Triangle Arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-current text-indigo-700 dark:text-indigo-600"
              />
            </div>
          )}
        </div>

        {/* Custom Visual Max Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-2 ${accentClasses.thumb} rounded-full shadow-md transition-transform duration-100 cursor-grab active:cursor-grabbing z-20 ${
            activeThumb === 'max' ? 'scale-125 ring-4 ring-opacity-40' : 'hover:scale-110'
          }`}
          style={{ left: `${maxPercent}%` }}
        >
          {/* Floating Tooltip Max */}
          {showTooltips && (
            <div
              className={`absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 text-xs font-semibold rounded-md shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${accentClasses.tooltip} ${
                isHovered || activeThumb === 'max' ? 'opacity-100 translate-y-0' : 'opacity-90 -translate-y-0.5'
              }`}
            >
              {formatValue(currentMax)}
              {/* Tooltip Triangle Arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-current text-indigo-700 dark:text-indigo-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Min / Max Labels under track */}
      <div className="flex justify-between items-center mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{formatValue(min)}</span>
        <span className="text-slate-400 dark:text-slate-500">
          Selected: <strong className="text-slate-700 dark:text-slate-200">{formatValue(currentMin)}</strong> – <strong className="text-slate-700 dark:text-slate-200">{formatValue(currentMax)}</strong>
        </span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};

export default DualRangeSlider;
