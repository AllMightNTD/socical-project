import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionBubbleProps {
  action: string;
}

const ActionBubble: React.FC<ActionBubbleProps> = React.memo(({ action }) => {
  if (!action) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/50 backdrop-blur-sm shadow-xl z-30 whitespace-nowrap pointer-events-none"
      >
        <span className="text-[9px] md:text-[10px] font-bold text-slate-200 tracking-widest uppercase">{action}</span>
      </motion.div>
    </AnimatePresence>
  );
});
ActionBubble.displayName = 'ActionBubble';
export default ActionBubble;
