'use client';

import type { ReactNode } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { SectionId } from '../../lib/i18n/locales';

const visited = new Set<SectionId>();

export default function MotionSection({ id, children }: { id: SectionId; children: ReactNode }) {
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-section={id}
      initial={false}
      animate={controls}
      viewport={{ once: true }}
      onViewportEnter={() => {
        if (reduced || visited.has(id)) return;
        visited.add(id);
        void controls.start({ opacity: [0.85, 1], y: [8, 0], transition: { duration: 0.25 } });
      }}
    >
      {children}
    </motion.div>
  );
}
