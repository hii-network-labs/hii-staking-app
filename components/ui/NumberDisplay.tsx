'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/utils/formatters';

interface NumberDisplayProps {
  value: string | number;
  label?: string;
  formatted: string;
  fullValue?: string;
  className?: string;
  showCopy?: boolean;
  horizontal?: boolean; // New prop for horizontal layout
}

export function NumberDisplay({
  value,
  label,
  formatted,
  fullValue,
  className = '',
  showCopy = true,
  horizontal = false
}: NumberDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async () => {
    const textToCopy = fullValue || value.toString();
    const success = await copyToClipboard(textToCopy);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayValue = fullValue || value.toString();
  const shouldShowTooltip = displayValue !== formatted;

  return (
    <div className={`relative group ${className}`}>
      {horizontal ? (
        // Horizontal layout: label and value on same line
        <div className="flex items-center justify-between gap-3">
          {label && (
            <div className="text-sm font-medium text-blue-600 flex-shrink-0">{label}</div>
          )}
          <div className="flex items-center min-w-0 relative flex-grow justify-end">
            <div
              className="relative text-right"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="font-mono text-lg font-bold text-gray-900 transition-colors duration-200 hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis block w-full" style={{minWidth: '150px', maxWidth: '100%'}}>
                {formatted}
              </span>
              
              {/* Tooltip for full value */}
              {shouldShowTooltip && showTooltip && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
                  {displayValue}
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
            
            {showCopy && (
              <button
                onClick={handleCopy}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-blue-50 rounded-full hover:scale-110 flex-shrink-0"
                title="Copy full value"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        // Vertical layout: original design
        <>
          {label && (
            <div className="text-sm font-medium text-blue-600 mb-2">{label}</div>
          )}
          
          <div className="flex items-center justify-center min-w-0 relative">
            <div
              className="relative text-center w-full"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="font-mono text-lg font-bold text-gray-900 transition-colors duration-200 hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis text-center block w-full" style={{minWidth: '150px', maxWidth: '100%'}}>
                {formatted}
              </span>
              
              {/* Tooltip for full value */}
              {shouldShowTooltip && showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
                  {displayValue}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
            
            {showCopy && (
              <button
                onClick={handleCopy}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-blue-50 rounded-full hover:scale-110"
                title="Copy full value"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}