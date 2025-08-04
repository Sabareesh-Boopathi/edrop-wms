import React, { useRef, useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import useWindowSize from 'react-use/lib/useWindowSize';
import './Celebration.css';

interface CelebrationProps {
  title: string;
  subtitle: string;
}

const Celebration: React.FC<CelebrationProps> = ({ title, subtitle }) => {
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
      <div className="celebration-overlay">
        {confettiSource && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            tweenDuration={6000}
            gravity={0.15}
            confettiSource={confettiSource}
            initialVelocityY={{ min: -20, max: -10 }}
          />
        )}
        <motion.div
          className="celebration-modal"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            ref={trophyRef}
            className="trophy-container"
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            <span role="img" aria-label="trophy" className="trophy-icon">🏆</span>
          </motion.div>
          
          <motion.h2 
            className="celebration-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            {title}
          </motion.h2>
          <motion.p 
            className="celebration-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Celebration;
