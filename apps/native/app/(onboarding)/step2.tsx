import { OnboardingShell } from "@/components/onboarding-shell";
import { NotificationMock } from "@/components/notification-mock";

const BACKGROUND_IMAGE = { uri: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80" };

export default function OnboardingStep2() {
  return (
    <OnboardingShell
      backgroundImage={BACKGROUND_IMAGE}
      currentStep={2}
      title="Weather alerts that matter"
      subtitle="Get notified before bad weather hits your route, so you can plan ahead."
      nextRoute="/(onboarding)/step3"
    >
      <NotificationMock
        title="Storm Alert"
        message="Heavy rain expected in 30 minutes. Consider leaving now to avoid the worst conditions."
        time="now"
        icon="weather"
      />
    </OnboardingShell>
  );
}
