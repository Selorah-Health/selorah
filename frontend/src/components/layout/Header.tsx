import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Plus } from "lucide-react";
import { Button } from "../ui";
import WaitlistModal from "../WaitlistModal";

interface HeaderProps {
  theme?: "dark" | "light";
  isLoggedIn?: boolean;
  userAvatar?: string;
}

export default function Header({
  theme = "dark",
  isLoggedIn = false,
  userAvatar,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== "/") {
      navigate("/#" + id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const shouldShow =
        currentScrollPos < 100 || currentScrollPos < lastScrollPos;
      setIsNavVisible(shouldShow);
      if (!shouldShow) setIsMenuOpen(false);
      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollPos]);

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => firstLinkRef.current?.focus(), 50);
    }
  }, [isMenuOpen]);

  const isSectionActive = (id: string) =>
    location.pathname === "/" && location.hash === `#${id}`;

  const desktopLinkClass = (isActive: boolean) =>
    `transition-colors text-sm ${
      theme === "dark" ? "hover:text-white" : "hover:text-primary"
    } ${isActive ? (theme === "dark" ? "text-white" : "text-primary") : ""}`;

  const sectionLinkClass = (id: string) =>
    `transition-colors text-sm ${
      theme === "dark" ? "hover:text-white" : "hover:text-primary"
    } ${
      isSectionActive(id)
        ? theme === "dark"
          ? "text-white"
          : "text-primary"
        : ""
    }`;

  return (
    <>
      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <header
        id="header"
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 backdrop-blur-md ${
          theme === "dark"
            ? "bg-black/70 border-b border-white/10"
            : "bg-white/80 border-b border-gray-100"
        } ${isNavVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0"
          >
            <img src="/logo.svg" alt="Selorah Logo" className="w-8 h-8" />
            <span
              className={`text-sm font-bold tracking-tight hidden sm:inline ${
                theme === "dark" ? "text-white" : "text-primary"
              }`}
            >
              Selorah Health
            </span>
          </Link>

          {/* Desktop Nav — only at xl (1280px+) */}
          <nav
            className={`hidden xl:flex items-center gap-7 font-medium ${
              theme === "dark" ? "text-white/70" : "text-gray-600"
            }`}
          >
            <Link
              to="/#how-it-works"
              onClick={() => scrollToSection("how-it-works")}
              className={sectionLinkClass("how-it-works")}
            >
              How It Works
            </Link>
            <Link
              to="/#hospitals"
              onClick={() => scrollToSection("hospitals")}
              className={sectionLinkClass("hospitals")}
            >
              For Hospitals
            </Link>
            <Link
              to="/#researchers"
              onClick={() => scrollToSection("researchers")}
              className={sectionLinkClass("researchers")}
            >
              For Researchers
            </Link>
            <Link
              to="/#insurers"
              onClick={() => scrollToSection("insurers")}
              className={sectionLinkClass("insurers")}
            >
              For Insurers
            </Link>
            <NavLink
              to="/pricing"
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              Pricing
            </NavLink>
          </nav>

          {/* Desktop CTAs — only at xl (1280px+) */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => desktopLinkClass(isActive)}
                >
                  Dashboard
                </NavLink>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 cursor-pointer">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-full h-full text-white/70" />
                  )}
                </div>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-5 py-2 rounded-full border text-sm font-medium transition-colors ${
                      theme === "dark"
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary"
                    } ${
                      isActive
                        ? theme === "dark"
                          ? "bg-white/10"
                          : "bg-gray-50 text-primary"
                        : ""
                    }`
                  }
                >
                  Log in
                </NavLink>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                  text="Join Waitlist"
                  size="md"
                />
              </>
            )}
          </div>

          {/* Hamburger — shows below xl */}
          <button
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className={`xl:hidden relative flex flex-col items-center justify-center gap-1.5 w-10 h-10 rounded-full z-50 ${
              theme === "dark" ? "bg-white/10" : "bg-gray-100"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span
              className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
                theme === "dark" ? "bg-white" : "bg-gray-900"
              } ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 transition-all duration-300 ${
                theme === "dark" ? "bg-white" : "bg-gray-900"
              } ${isMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 transition-all duration-300 origin-center ${
                theme === "dark" ? "bg-white" : "bg-gray-900"
              } ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            className={`absolute right-0 top-0 h-full w-80 max-w-[86vw] border-l p-6 ${
              theme === "dark"
                ? "bg-black/95 border-white/10"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex justify-end mb-6">
              <button
                aria-label="Close navigation menu"
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg ${
                  theme === "dark"
                    ? "border-white/10 text-white"
                    : "border-gray-200 text-gray-900"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <nav
              className={`flex flex-col gap-1 text-base font-medium ${
                theme === "dark" ? "text-white/80" : "text-gray-700"
              }`}
            >
              {[
                { label: "How It Works", id: "how-it-works" },
                { label: "For Hospitals", id: "hospitals" },
                { label: "For Researchers", id: "researchers" },
                { label: "For Insurers", id: "insurers" },
              ].map(({ label, id }) => (
                <Link
                  key={id}
                  to={`/#${id}`}
                  ref={id === "how-it-works" ? firstLinkRef : undefined}
                  onClick={() => scrollToSection(id)}
                  className={`${sectionLinkClass(id)} block py-3 px-3 rounded-xl hover:bg-white/5`}
                >
                  {label}
                </Link>
              ))}
              <NavLink
                to="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `${desktopLinkClass(isActive)} block py-3 px-3 rounded-xl hover:bg-white/5`
                }
              >
                Pricing
              </NavLink>
            </nav>

            <div
              className={`mt-6 pt-6 border-t ${
                theme === "dark" ? "border-white/10" : "border-gray-100"
              }`}
            >
              {isLoggedIn ? (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `${desktopLinkClass(isActive)} block py-3 px-3 rounded-xl text-center`
                  }
                >
                  Dashboard
                </NavLink>
              ) : (
                <div className="flex flex-col gap-3">
                  <NavLink
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full inline-flex items-center justify-center px-5 py-3 rounded-xl border text-sm font-medium ${
                      theme === "dark"
                        ? "border-white/20 text-white"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Log in
                  </NavLink>
                  <Button
                    onClick={() => {
                      setIsModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                    text="Join Waitlist"
                    size="md"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}