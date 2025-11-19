"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function PageTransition({ children }) {
  const pathname = Math.random();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname}>{children}</div>
    </AnimatePresence>
  );
}
