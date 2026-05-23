export interface HeroSlide {
  id: number;
  video: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface HeroContent {
  tag: string;
  title: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    scrollTarget: string;
  };
  backgroundVideo: string;
}

export interface LandingFeatureCard {
  id: string;
  title: string;
  desc: string;
  features: string[];
  iconKey?: 'patient' | 'hospital' | 'research';
}
