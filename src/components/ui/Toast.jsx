import { useEffect } from 'react';
import { X } from 'lucide-react';

// Toast Notification Component
const Toast = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-sm border ${
        type === 'success' 
          ? 'bg-slate-800/95 border-blue-500/50' 
          : 'bg-slate-800/95 border-red-500/50'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          type === 'success' ? 'bg-blue-500' : 'bg-red-500'
        }`} />
        <p className="text-sm text-white">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;