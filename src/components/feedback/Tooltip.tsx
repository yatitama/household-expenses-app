import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
 label: string;
 text: string;
 position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ label, text, position = 'top' }: TooltipProps) => {
 const [isVisible, setIsVisible] = useState(false);

 const positionClasses = {
 top: 'bottom-full mb-2',
 bottom: 'top-full mt-2',
 left: 'right-full mr-2',
 right: 'left-full ml-2',
 };

 return (
 <div className="relative inline-block group">
 <button
 onMouseEnter={() => setIsVisible(true)}
 onMouseLeave={() => setIsVisible(false)}
 onClick={() => setIsVisible(!isVisible)}
 className="inline-flex items-center justify-center ml-1 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
 title={label}
 aria-label={label}
 >
 <HelpCircle size={14} />
 </button>

 {/* ツールチップ */}
 {isVisible && (
 <div
 className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-100 text-sm rounded-lg p-2 w-max max-w-[200px] z-50 pointer-events-none`}
 >
 {text}
 {/* 矢印 */}
 <div
 className={`absolute w-0 h-0 ${
 position === 'top'
 ? 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700'
 : position === 'bottom'
 ? 'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900 dark:border-b-gray-700'
 : ''
 }`}
 />
 </div>
 )}
 </div>
 );
};
