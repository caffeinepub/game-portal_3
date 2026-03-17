import { Gamepad2 } from "lucide-react";
import { SiDiscord, SiGithub, SiTwitch, SiX } from "react-icons/si";

const SOCIAL_LINKS = [
  { Icon: SiGithub, name: "github" },
  { Icon: SiX, name: "x" },
  { Icon: SiDiscord, name: "discord" },
  { Icon: SiTwitch, name: "twitch" },
];

const EXPLORE_LINKS = ["Home", "Games", "Leaderboards", "News"];
const RESOURCE_LINKS = ["FAQ", "Support", "Privacy Policy", "Terms"];

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer
      className="border-t border-border mt-20"
      style={{ background: "oklch(0.09 0.008 265)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2
                className="w-5 h-5"
                style={{ color: "var(--neon-cyan)" }}
              />
              <span className="font-orbitron font-bold text-sm tracking-widest neon-cyan-text">
                NEON ARCADE
              </span>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.72 0.015 280)" }}>
              The ultimate retro arcade experience. Play classic games
              reimagined with neon aesthetics.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {SOCIAL_LINKS.map(({ Icon, name }) => (
                <a
                  key={name}
                  href="/"
                  className="transition-colors"
                  style={{ color: "oklch(0.72 0.015 280)" }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4
              className="font-orbitron text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.84 0.17 200)" }}
            >
              EXPLORE
            </h4>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-sm transition-colors no-underline"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4
              className="font-orbitron text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.84 0.17 200)" }}
            >
              RESOURCES
            </h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-sm transition-colors no-underline"
                    style={{ color: "oklch(0.72 0.015 280)" }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4
              className="font-orbitron text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.84 0.17 200)" }}
            >
              STAY UPDATED
            </h4>
            <p
              className="text-sm mb-4"
              style={{ color: "oklch(0.72 0.015 280)" }}
            >
              Get the latest game news and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 rounded text-sm font-body border"
                style={{
                  background: "oklch(0.12 0.008 270)",
                  borderColor: "oklch(0.22 0.02 270)",
                  color: "oklch(0.93 0.01 275)",
                }}
                data-ocid="footer.input"
              />
              <button
                type="button"
                className="neon-btn-filled-cyan px-4 py-2 rounded text-xs font-orbitron"
                data-ocid="footer.primary_button"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "oklch(0.72 0.015 280)" }}>
            &copy; {year} Neon Arcade. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "oklch(0.72 0.015 280)" }}>
            Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              className="no-underline transition-colors"
              style={{ color: "oklch(0.84 0.17 200)" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
