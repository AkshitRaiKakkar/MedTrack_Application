import React, { useState } from 'react';
import DualRangeSlider from './DualRangeSlider';
import PriceFilterPresetGroup from './PriceFilterPresetGroup';
import { Sliders, RefreshCw, Eye, ShieldAlert, Sparkles, Code2, Terminal, Check } from 'lucide-react';

/**
 * DualRangeSliderStudio - Interactive developer studio & playground for testing
 * and configuring the DualRangeSlider component.
 */
export const DualRangeSliderStudio = () => {
  // Config state
  const [minBound, setMinBound] = useState(0);
  const [maxBound, setMaxBound] = useState(250);
  const [stepSize, setStepSize] = useState(5);
  const [minSteps, setMinSteps] = useState(2);
  const [formatMode, setFormatMode] = useState('usd');
  const [accentColor, setAccentColor] = useState('indigo');
  const [showTooltips, setShowTooltips] = useState(true);
  const [disabled, setDisabled] = useState(false);

  // Slider range state
  const [range, setRange] = useState([25, 150]);
  const [copied, setCopied] = useState(false);

  // Format resolver
  const formatters = {
    usd: (val) => `$${val.toLocaleString()}`,
    eur: (val) => `€${val.toLocaleString()}`,
    percent: (val) => `${val}%`,
    integer: (val) => `${val}`,
    unit: (val) => `${val} units`,
  };

  const currentFormatter = formatters[formatMode] || formatters.usd;

  const handlePresetSelect = (min, max) => {
    setRange([min, max]);
  };

  const handleReset = () => {
    setMinBound(0);
    setMaxBound(250);
    setStepSize(5);
    setMinSteps(2);
    setFormatMode('usd');
    setAccentColor('indigo');
    setShowTooltips(true);
    setDisabled(false);
    setRange([25, 150]);
  };

  // Generated JSX code snippet
  const generatedCode = `<DualRangeSlider
  min={${minBound}}
  max={${maxBound}}
  step={${stepSize}}
  value={[${range[0]}, ${range[1]}]}
  onChange={(newRange) => setRange(newRange)}
  minStepsBetweenThumbs={${minSteps}}
  formatValue={(val) => \`${formatMode === 'usd' ? '$' : formatMode === 'eur' ? '€' : ''}\${val}${formatMode === 'percent' ? '%' : ''}\`}
  accentColor="${accentColor}"
  showTooltips={${showTooltips}}
  disabled={${disabled}}
/>`;

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dual Range Slider Studio</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
              v1.0.0 #2320
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Interactive developer playground to test dual thumb collisions, presets, formatting, and live telemetry.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start md:self-auto px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
        </button>
      </div>

      {/* Main Studio Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Live Interactive Preview Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Component Preview
              </span>
              <span className="text-xs text-slate-400">
                Range: {currentFormatter(range[0])} – {currentFormatter(range[1])}
              </span>
            </div>

            {/* Range Slider Container */}
            <div className="my-8 px-4">
              <DualRangeSlider
                id="studio-dual-slider"
                min={minBound}
                max={maxBound}
                step={stepSize}
                value={range}
                onChange={setRange}
                formatValue={currentFormatter}
                minStepsBetweenThumbs={minSteps}
                showTooltips={showTooltips}
                disabled={disabled}
                accentColor={accentColor}
              />
            </div>

            {/* Presets Row */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <PriceFilterPresetGroup
                currentValue={range}
                onSelectPreset={handlePresetSelect}
                maxBound={maxBound}
              />
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-inner font-mono text-xs relative group">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <Code2 className="w-4 h-4 text-indigo-400" /> React JSX Code
              </span>
              <button
                onClick={copyCode}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                {copied ? 'Copied!' : 'Copy Snippet'}
              </button>
            </div>
            <pre className="overflow-x-auto text-indigo-300 leading-relaxed">{generatedCode}</pre>
          </div>
        </div>

        {/* Right Column: Controls & Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          {/* Controls Panel */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-500" /> Studio Controls
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Min Bound</label>
                <input
                  type="number"
                  value={minBound}
                  onChange={(e) => setMinBound(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Max Bound</label>
                <input
                  type="number"
                  value={maxBound}
                  onChange={(e) => setMaxBound(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Step Size</label>
                <input
                  type="number"
                  min={1}
                  value={stepSize}
                  onChange={(e) => setStepSize(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Min Steps Spacing</label>
                <input
                  type="number"
                  min={0}
                  value={minSteps}
                  onChange={(e) => setMinSteps(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            {/* Format & Color Selectors */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Value Formatter</label>
                <select
                  value={formatMode}
                  onChange={(e) => setFormatMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="usd">USD Currency ($)</option>
                  <option value="eur">EUR Currency (€)</option>
                  <option value="percent">Percentage (%)</option>
                  <option value="integer">Plain Integer</option>
                  <option value="unit">Custom Unit (units)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Accent Theme</label>
                <div className="flex gap-2">
                  {['indigo', 'emerald', 'rose', 'cyan', 'amber'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setAccentColor(c)}
                      className={`px-2.5 py-1 capitalize text-xs rounded-md border font-medium transition ${
                        accentColor === c
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" /> Show Tooltips
                </label>
                <input
                  type="checkbox"
                  checked={showTooltips}
                  onChange={(e) => setShowTooltips(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Disabled State
                </label>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>
            </div>
          </div>

          {/* Telemetry Output */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-sans">
              <Terminal className="w-4 h-4 text-emerald-500" /> Live State Telemetry
            </h3>

            <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg space-y-1">
              <div>minVal: <span className="text-white">{range[0]}</span></div>
              <div>maxVal: <span className="text-white">{range[1]}</span></div>
              <div>formattedMin: <span className="text-yellow-300">"{currentFormatter(range[0])}"</span></div>
              <div>formattedMax: <span className="text-yellow-300">"{currentFormatter(range[1])}"</span></div>
              <div>minDistanceAllowed: <span className="text-cyan-300">{minSteps * stepSize} units</span></div>
              <div>selectedSpan: <span className="text-purple-300">{range[1] - range[0]} units</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualRangeSliderStudio;
