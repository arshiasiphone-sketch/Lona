import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { BottomNav } from "./BottomNav";
import { GlobalOverlays } from "@/components/global/GlobalOverlays";
import { useState, useCallback } from "react";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { RouteProgressBar, SmoothScrollProvider } from "@/components/motion/RouteProgressBar";
import { Cursor } from "@/components/motion/Cursor";
import { FlyToBagRenderer } from "@/components/motion/FlyToBag";
import { pageTransition } from "@/lib/motion";

export function PageShell() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((o) => !o), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <SmoothScrollProvider>
      <ScrollProgress />
      <RouteProgressBar />
      <Cursor />
      <FlyToBagRenderer />
      <div className="min-h-screen pb-16 lg:pb-0">
        <Navbar onMenuToggle={toggleMobileMenu} />
        <MobileNav open={mobileMenuOpen} onClose={closeMobileMenu} />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            aria-label="محتوای اصلی"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <Footer />
        <BottomNav />
        <GlobalOverlays />
      </div>
    </SmoothScrollProvider>
  );
}
