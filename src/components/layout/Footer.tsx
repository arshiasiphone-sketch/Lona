import { Link } from "react-router";
import { useState } from "react";
import { ArrowRight, Instagram, Mail } from "lucide-react";
import { cn } from "@/lib/glass";

const sections: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All", to: "/shop" },
      { label: "Outerwear", to: "/shop?category=outerwear" },
      { label: "Knitwear", to: "/shop?category=knitwear" },
      { label: "Shirting", to: "/shop?category=shirting" },
      { label: "Trousers", to: "/shop?category=trousers" },
      { label: "Objects", to: "/collections/objects" },
    ],
  },
  {
    title: "House",
    links: [
      { label: "Atelier", to: "/about" },
      { label: "Journal", to: "/press" },
      { label: "Sustainability", to: "/about#sustainability" },
      { label: "Stores", to: "/about#stores" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Shipping & Returns", to: "/about" },
      { label: "Size Guide", to: "/about" },
      { label: "Garment Care", to: "/about" },
      { label: "Contact", to: "/about#contact" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="relative mt-32 overflow-hidden">
      {/* Top band — newsletter */}
      <div className="mx-auto max-w-[1728px] px-6 lg:px-10">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-8 py-12 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/40 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <p className="type-eyebrow text-ink-muted">Receive the Letter</p>
              <h3 className="font-display text-3xl leading-[1.05] text-ink lg:text-5xl">
                A quiet note from the Atelier — once a season.
              </h3>
              <p className="mt-4 max-w-md text-sm text-ink-muted">
                Editorials, careful windows of arrivals, and the occasional private piece. No promotions.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setSubmitted(true);
                setTimeout(() => {
                  setEmail("");
                  setSubmitted(false);
                }, 3500);
              }}
              className="flex flex-col gap-3 self-end"
            >
              <label className="type-eyebrow text-ink-muted" htmlFor="newsletter">
                Your email
              </label>
              <div className="glass flex items-center gap-3 rounded-full px-4 py-2">
                <Mail className="h-4 w-4 text-ink-muted" />
                <input
                  id="newsletter"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="submit"
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full transition",
                    "bg-ink text-canvas hover:bg-primary"
                  )}
                  aria-label="Subscribe"
                >
                  {submitted ? (
                    <span className="text-[10px]">Thank you</span>
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-ink-muted">
                By subscribing you accept our privacy notice.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Link sections */}
      <div className="mx-auto mt-20 max-w-[1728px] px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-5xl font-light leading-none tracking-[0.36em] text-ink">
              ÆON
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
              ÆON is an editorial house designing objects and garments intended to be kept — quietly, for years.
            </p>
            <Link
              to="https://instagram.com"
              className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full hairline text-ink-soft transition hover:bg-white/40 hover:text-ink"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </Link>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <p className="type-eyebrow text-ink-muted">{section.title}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-soft transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom band */}
      <div className="mx-auto mt-20 max-w-[1728px] border-t border-edge/60 px-6 py-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-4 text-xs text-ink-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ÆON Atelier Ltd. — Established 2012.</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-ink">
              Privacy
            </Link>
            <Link to="/about" className="hover:text-ink">
              Cookies
            </Link>
            <Link to="/about" className="hover:text-ink">
              Terms
            </Link>
            <select
              className="rounded-full hairline bg-transparent px-3 py-1 text-xs text-ink-muted"
              defaultValue="us-en"
              aria-label="Region"
            >
              <option value="us-en">United States · EN</option>
              <option value="eu-en">Europe · EN</option>
              <option value="jp-ja">Japan · JA</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
