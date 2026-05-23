import type { HeroContent, HeroSlide } from "../../types/landing/hero";

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    video: "/assets/hero-bg-video-1.mp4",
    title: "Securing Health Records",
    subtitle: "from Patient to Provider",
    description:
      "At Selorah Health, we transform how your medical history travels with you — putting ownership where it has always belonged: in your hands.",
    buttonText: "HERE'S HOW IT WORKS",
    buttonLink: "#how-it-works",
  },
  {
    id: 2,
    video: "/assets/hero-bg-video-2.mp4",
    title: "Tired of Chasing Your Own Records?",
    subtitle: "",
    description:
      "Selorah Health gives you full ownership — encrypted, portable, private. Access your data anytime, anywhere, with anyone you trust.",
    buttonText: "HERE'S HOW IT WORKS",
    buttonLink: "#how-it-works",
  },
];

export const HERO_CONTENT: HeroContent = {
  tag: "Building the Future of health records in Africa",
  title: "Tired of chasing your own records?",
  description:
    "Selorah Health gives you full ownership — encrypted, portable, and private. Access your data anytime, anywhere, with anyone you trust.",
  primaryCta: {
    label: "Get Started",
    href: "#how-it-works",
  },
  secondaryCta: {
    label: "Here's How It Works",
    scrollTarget: "how-it-works",
  },
  backgroundVideo: "/assets/hero-bg-video-1.mp4",
};
