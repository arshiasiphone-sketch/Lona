import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/glass";

interface ShippingEstimatorProps {
  defaultZip?: string;
}

interface Estimate {
  label: string;
  window: string;
  price: number;
  recommended?: boolean;
}

const countryTable: Record<string, Estimate[]> = {
  US: [
    { label: "Standard · DHL", window: "5–8 business days", price: 0, recommended: true },
    { label: "Express · DHL", window: "2–3 business days", price: 24 },
    { label: "White-glove · local courier", window: "Same/Next-day in major cities", price: 64 },
  ],
  EU: [
    { label: "Standard · DHL", window: "4–7 business days", price: 0, recommended: true },
    { label: "Express · DHL", window: "2–3 business days", price: 22 },
  ],
  UK: [
    { label: "Standard · DHL", window: "4–7 business days", price: 0, recommended: true },
    { label: "Express · DHL", window: "2–3 business days", price: 26 },
  ],
  JP: [
    { label: "Standard · Sagawa", window: "3–5 business days", price: 0, recommended: true },
    { label: "Express · Yamato", window: "1–2 business days", price: 28 },
  ],
  OTHER: [
    { label: "Standard · DHL", window: "7–10 business days", price: 28, recommended: true },
  ],
};

export function ShippingEstimator({ defaultZip = "" }: ShippingEstimatorProps) {
  const [zip, setZip] = useState(defaultZip);
  const [country, setCountry] = useState("US");
  const [confirmed, setConfirmed] = useState(false);

  const handleEstimate = () => {
    if (zip.trim().length < 3) return;
    setConfirmed(true);
  };

  const options = countryTable[country] ?? countryTable.OTHER;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-ink" />
        <p className="type-eyebrow text-ink">Shipping estimate</p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Enter your country and postal code for delivery windows and prices.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr_auto]">
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setConfirmed(false);
          }}
          className="h-11 rounded-2xl bg-canvas/60 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="US">United States</option>
          <option value="EU">European Union</option>
          <option value="UK">United Kingdom</option>
          <option value="JP">Japan</option>
          <option value="OTHER">Rest of world</option>
        </select>
        <input
          value={zip}
          onChange={(e) => {
            setZip(e.target.value);
            setConfirmed(false);
          }}
          placeholder="Postal / ZIP code"
          className="h-11 rounded-2xl bg-canvas/60 px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleEstimate}
          className="h-11 rounded-full bg-ink px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
        >
          Estimate
        </button>
      </div>

      {confirmed && (
        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-5 space-y-2"
        >
          {options.map((opt) => (
            <li
              key={opt.label}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm",
                opt.recommended
                  ? "bg-ink text-canvas"
                  : "hairline bg-white/50 text-ink"
              )}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span className="font-medium">{opt.label}</span>
              </span>
              <span className="type-caption">
                {opt.window} · {opt.price === 0 ? "Included" : `$${opt.price}`}
              </span>
              {opt.recommended && <Check className="h-3.5 w-3.5" />}
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
