import { OnboardingShell } from "@/components/onboarding-shell";

const BACKGROUND_IMAGE = { uri: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80" };

export default function OnboardingStep1() {
  return (
    <OnboardingShell
      backgroundImage={BACKGROUND_IMAGE}
      currentStep={1}
      title="Know when it's safe to go"
      subtitle="Real-time weather and traffic alerts help you always leave at the perfect time."
      nextRoute="/(onboarding)/step2"
    />
  );
}
