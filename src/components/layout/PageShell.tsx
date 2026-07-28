import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { GlobalOverlays } from "@/components/global/GlobalOverlays";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { RouteProgressBar, SmoothScrollProvider } from "@/components/motion/RouteProgressBar";
import { Cursor } from "@/components/motion/Cursor";
import { FlyToBagRenderer } from "@/components/motion/FlyToBag";
import { pageTransition } from "@/lib/motion";

export function PageShell() {
  const location = useLocation();
  return (
    <SmoothScrollProvider>
      <ScrollProgress />
      <RouteProgressBar />
      <Cursor />
      <FlyToBagRenderer />
      <div className="min-h-screen">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <Footer />
        <GlobalOverlays />
      </div>
    </SmoothScrollProvider>
  );
}
