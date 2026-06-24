import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animations';

export function AnimatedContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedFadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSlideDown({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSlideLeft({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
      className={`bg-white rounded-lg shadow transition-shadow ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedButton({
  children,
  className,
  disabled,
  onClick,
  type,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </motion.button>
  );
}

export function AnimatedInputWrapper({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedTableRow({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}

export function AnimatedModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnimatedStaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStaggerItem({
  children,
  className,
  hoverEffect = false,
}: {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
      whileHover={hoverEffect ? { y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } : undefined}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStaggerItemCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
      whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
    >
      {children}
    </motion.div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
};

export function StatCard({ label, value, sub, icon: Icon, color }: StatCardProps) {
  return (
    <AnimatedStaggerItem>
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
        className="bg-white rounded-lg shadow p-4 flex items-start gap-3 transition-shadow"
      >
        <div className={`${color} p-2 rounded-lg shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold font-mono text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </motion.div>
    </AnimatedStaggerItem>
  );
}

type CardPanelProps = {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
};

export function GlassCard({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl ${padding ? 'p-6' : ''} ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

export function CardPanel({
  title,
  icon: Icon,
  iconColor = 'text-purple-500',
  children,
  className,
  headerRight,
}: CardPanelProps) {
  return (
    <AnimatedStaggerItem>
      <div className={`bg-white rounded-lg shadow ${className ?? ''}`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Icon size={18} className={iconColor} />
          <h2 className="font-semibold text-gray-800">{title}</h2>
          {headerRight}
        </div>
        {children}
      </div>
    </AnimatedStaggerItem>
  );
}
