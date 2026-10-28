/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export type ScrollAnimationDirection = 'up' | 'down' | 'left' | 'right' | 'none' | 'scale';

interface ScrollRevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  direction?: ScrollAnimationDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  scale?: number;
  className?: string;
  viewportOnce?: boolean;
  threshold?: number;
  id?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  distance = 28,
  scale,
  className = '',
  viewportOnce = true,
  threshold = 0.15,
  id,
  ...rest
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance, x: 0, scale: scale ?? 1 };
      case 'down':
        return { opacity: 0, y: -distance, x: 0, scale: scale ?? 1 };
      case 'left':
        return { opacity: 0, x: distance, y: 0, scale: scale ?? 1 };
      case 'right':
        return { opacity: 0, x: -distance, y: 0, scale: scale ?? 1 };
      case 'scale':
        return { opacity: 0, y: 0, x: 0, scale: scale ?? 0.94 };
      case 'none':
      default:
        return { opacity: 0, y: 0, x: 0, scale: scale ?? 1 };
    }
  };

  return (
    <motion.div
      id={id}
      initial={getInitialPosition()}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      viewport={{ once: viewportOnce, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // fluid cubic bezier ease-out
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  viewportOnce?: boolean;
  id?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
  viewportOnce = true,
  id,
  ...rest
}) => {
  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  direction?: ScrollAnimationDirection;
  distance?: number;
  className?: string;
  id?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  direction = 'up',
  distance = 24,
  className = '',
  id,
  ...rest
}) => {
  const getVariants = () => {
    switch (direction) {
      case 'up':
        return {
          hidden: { opacity: 0, y: distance },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -distance },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.94 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        };
      case 'none':
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5 } },
        };
    }
  };

  return (
    <motion.div id={id} variants={getVariants() as any} className={className} {...rest}>
      {children}
    </motion.div>
  );
};
