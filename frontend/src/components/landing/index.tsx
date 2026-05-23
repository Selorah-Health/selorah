import React from "react";
import Hero from "./Hero";
import AvatarBadge from "./AvatarBadge";
import Problem from "./Problem";
import HowItWorks from "./HowItWorks";
import BuiltForEveryone from "./BuiltForEveryone";
import PrivacyArchitecture from "./PrivacyArchitecture";

export default function LandingSections() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <BuiltForEveryone />
      <PrivacyArchitecture />
      <AvatarBadge />
    </>
  );
}
