import React, { useRef, useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import useWindowSize from 'react-use/lib/useWindowSize';
import './Celebration.css';

interface CelebrationProps {
  title: string;
  subtitle: string;
  onClose?: () => void; // optional CTA handler
  buttonLabel?: string; // optional CTA label
}

const Celebration: React.FC<CelebrationProps> = ({ title, subtitle, onClose, buttonLabel = 'Awesome!' }) => {
  const { width, height } = useWindowSize();
  const trophyRef = useRef<HTMLDivElement>(null);
  const [confettiSource, setConfettiSource] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    if (trophyRef.current) {
      const { x, y, width, height } = trophyRef.current.getBoundingClientRect();
      setConfettiSource({ x, y, w: width, h: height });
    }
  }, []);

  return (
    <AnimatePresence>
      <div className="celebration-overlay" role="dialog" aria-live="polite" aria-label="Celebration">
        {/* Animated aurora background shapes */}
        <motion.div
          className="aurora aurora-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.div
          className="aurora aurora-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
        />

        {confettiSource && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={420}
            tweenDuration={6000}
            gravity={0.15}
            confettiSource={confettiSource}
          />
        )}

        <motion.div
          className="celebration-modal glass"
          initial={{ opacity: 0, scale: 0.86, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        >
          {/* Gradient ring border */}
          <div className="celebration-ring" aria-hidden="true" />

          <motion.div
            ref={trophyRef}
            className="trophy-container"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
          >
            <span role="img" aria-label="trophy" className="trophy-icon glow">🏆</span>
            {/* floating sparkles */}
            <span className="sparkle s1">✨</span>
            <span className="sparkle s2">✨</span>
            <span className="sparkle s3">✨</span>
          </motion.div>

          <motion.h2
            className="celebration-title gradient-text"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            {title}
          </motion.h2>

          <motion.p
            className="celebration-subtitle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {subtitle}
          </motion.p>

          {onClose && (
            <motion.button
              type="button"
              className="celebration-cta"
              onClick={onClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              {buttonLabel}
            </motion.button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Celebration;
