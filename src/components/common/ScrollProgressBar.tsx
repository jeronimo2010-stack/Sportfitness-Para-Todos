/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ScrollProgressBarProps {
  showBackToTop?: boolean;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ showBackToTop = true }) => {
  const { t } = useApp();
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    return scrollY.on('change', (latest) => {
      setVisible(latest > 280);
    });
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Global Scroll Progress Indicator */}
      <motion.div
        id="app-scroll-progress-bar"
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#56A867] via-emerald-400 to-[#56A867] origin-left z-50 pointer-events-none shadow-[0_0_10px_rgba(86,168,103,0.5)]"
        style={{ scaleX }}
      />

      {/* Floating Smooth Scroll to Top Button */}
      {showBackToTop && (
        <motion.button
          id="scroll-to-top-button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-xl border backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer bg-[#14141E]/85 border-[#2A2A3D] text-[#56A867] hover:text-white hover:bg-[#56A867] hover:border-[#56A867] group ${
            visible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          aria-label={t('common.backToTop')}
          title={t('common.backToTop')}
        >
          <ChevronUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </>
  );
};
