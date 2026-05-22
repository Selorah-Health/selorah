import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Plus } from "lucide-react";
import { Button } from "../ui";
import WaitlistModal from "../WaitlistModal";

interface HeaderProps {
  theme?: "dark" | "light";
  isLoggedIn?: boolean; // New prop
  userAvatar?: string; // Optional avatar URL
}

export default function Header({
  theme = "dark",
  isLoggedIn = false,
  userAvatar,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [lastScrollPos, setLastScrollPos] = useState(0);

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== "/") {
      navigate("/#" + id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const shouldShow =
        currentScrollPos < 100 || currentScrollPos < lastScrollPos;

      setIsNavVisible(shouldShow);
      if (!shouldShow) {
        setIsMenuOpen(false);
      }
      setLastScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollPos]);

  const isSectionActive = (id: string) =>
    location.pathname === "/" && location.hash === `#${id}`;

  const desktopLinkClass = (isActive: boolean) =>
    `transition-colors ${theme === "dark" ? "hover:text-white" : "hover:text-[#4262FF]"} ${
      isActive ? (theme === "dark" ? "text-white" : "text-[#4262FF]") : ""
    }`;

  const sectionLinkClass = (id: string) =>
    `transition-colors ${
      theme === "dark" ? "hover:text-white" : "hover:text-[#4262FF]"
    } ${
      isSectionActive(id)
        ? theme === "dark"
          ? "text-white"
          : "text-[#4262FF]"
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
        className={`fixed top-0 left-0 right-0 z-50 rounded p-2 bg-zinc-900/50 amber-100 fade-in delay-3  transition-transform duration-300 backdrop-blur-md border-b $
          theme === "dark"
            ? "bg-black/70 border-white/10"
            : "bg-white/80 border-gray-100"
        } ${isNavVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="container mx-auto px-4 py-3  bg-zinc-900/10 max-w-9xl rounded-xl flex items-center justify-between lg:px-12 h-20">
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.svg"
              alt="Selorah Logo"
              className="w-8 h-8 group-hover:scale-105 transition-transform"
            />
            <span
              className={`text-sm font-bold tracking-tight hidden sm:inline ${
                theme === "dark" ? "text-white" : "text-[#4262FF]"
              }`}
            >
              Selorah Health
            </span>
          </Link>

          <nav className={`hidden lg:flex items-center justify-center gap-8 text-sm font-medium ${theme === "dark" ? "text-white/80" : "text-gray-600"}`}>
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

          <div className="hidden lg:flex items-center gap-4">
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
              <div className="flex items-center gap-3">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-full border transition-colors ${
                      theme === "dark"
                        ? "border-white/20 hover:bg-white/10 hover:text-white"
                        : "border-gray-200 hover:bg-gray-50 hover:text-[#4262FF]"
                    } ${
                      isActive
                        ? theme === "dark"
                          ? "bg-white/10 text-white"
                          : "bg-gray-50 text-[#4262FF]"
                        : ""
                    }`
                  }
                >
                  Log in
                </NavLink>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                  className={
                    theme === "dark"
                      ? "border-white/20 hover:bg-white/10 hover:text-white"
                      : "border-gray-200 hover:bg-gray-50 hover:text-[#4262FF]"
                  }
                >
                  Join Waitlist
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden relative w-4 h-4 flex flex-col justify-center items-center gap-1.5 z-50`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span
              className={`w-4 h-0.5 transition-all duration-300 origin-center ${
                theme === "dark" ? "bg-white" : "bg-gray-900"
              } ${isMenuOpen ? "rotate-45 translate-y-1" : ""}`}
            />
            <span
              className={`w-4 h-0.5 transition-all duration-300 origin-center ${
                theme === "dark" ? "bg-white" : "bg-gray-900"
              } ${isMenuOpen ? "-rotate-45 -translate-y-1" : ""}`}
            />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 h-full w-64 border-l p-6 transform transition-transform duration-300 ${
              theme === "dark"
                ? "bg-black/70 border-white/10"
                : "bg-white/80 border-gray-100"
            } ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex justify-end">
              <button
                aria-label="Close navigation menu"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <span
                  className={theme === "dark" ? "text-white" : "text-gray-900"}
                >
                  ×
                </span>
              </button>
            </div>
            <nav
              className={`mt-10 flex flex-col gap-5 text-base font-medium ${
                theme === "dark" ? "text-white/80" : "text-gray-600"
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
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => desktopLinkClass(isActive)}
              >
                Pricing
              </NavLink>

              {isLoggedIn ? (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) => desktopLinkClass(isActive)}
                >
                  Dashboard
                </NavLink>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-6 py-2 rounded-full border transition-colors inline-flex justify-center mt-4 ${
                      theme === "dark"
                        ? "border-white/20 hover:bg-white/10"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${
                      isActive
                        ? theme === "dark"
                          ? "bg-white/10"
                          : "bg-gray-50"
                        : ""
                    }`
                  }
                >
                  Log in
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
