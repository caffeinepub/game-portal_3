import { Flame } from "lucide-react";
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
      className="border-t mt-20"
      style={{
        background: "oklch(0.07 0.015 265)",
        borderColor: "oklch(0.70 0.22 240 / 0.18)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Flame
                className="w-5 h-5"
                style={{ color: "oklch(0.70 0.22 240)" }}
              />
              <span className="font-cinzel font-bold text-sm tracking-widest cursed-blue-text">
                CURSED ARCADE
              </span>
            </div>
            <p className="text-sm" style={{ color: "oklch(0.65 0.015 270)" }}>
              The cursed energy gaming experience. Channel your inner sorcerer
              and conquer all 12 domains.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {SOCIAL_LINKS.map(({ Icon, name }) => (
                <a
                  key={name}
                  href="/"
                  className="transition-colors hover:text-[oklch(0.70_0.22_240)]"
                  style={{ color: "oklch(0.65 0.015 270)" }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4
              className="font-cinzel text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.70 0.22 240)" }}
            >
              EXPLORE
            </h4>
            <ul className="space-y-2">
              {EXPLORE_LINKS.map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-sm transition-colors no-underline hover:text-[oklch(0.70_0.22_240)]"
                    style={{ color: "oklch(0.65 0.015 270)" }}
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
              className="font-cinzel text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.70 0.22 240)" }}
            >
              RESOURCES
            </h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-sm transition-colors no-underline hover:text-[oklch(0.70_0.22_240)]"
                    style={{ color: "oklch(0.65 0.015 270)" }}
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
              className="font-cinzel text-xs tracking-widest mb-4"
              style={{ color: "oklch(0.70 0.22 240)" }}
            >
              STAY UPDATED
            </h4>
            <p
              className="text-sm mb-4"
              style={{ color: "oklch(0.65 0.015 270)" }}
            >
              Get the latest cursed energy news and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 rounded text-sm border"
                style={{
                  background: "oklch(0.11 0.012 268)",
                  borderColor: "oklch(0.70 0.22 240 / 0.25)",
                  color: "oklch(0.92 0.01 265)",
                }}
                data-ocid="footer.input"
              />
              <button
                type="button"
                className="cursed-btn-filled px-4 py-2 rounded text-xs font-cinzel"
                data-ocid="footer.primary_button"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: "oklch(0.70 0.22 240 / 0.15)" }}
        >
          <p className="text-xs" style={{ color: "oklch(0.65 0.015 270)" }}>
            &copy; {year} Cursed Arcade. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "oklch(0.65 0.015 270)" }}>
            Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              className="no-underline transition-colors"
              style={{ color: "oklch(0.70 0.22 240)" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
