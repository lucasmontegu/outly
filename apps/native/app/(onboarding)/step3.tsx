import { OnboardingShell } from "@/components/onboarding-shell";
import { NotificationMock } from "@/components/notification-mock";

const BACKGROUND_IMAGE = { uri: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80" };

export default function OnboardingStep3() {
  return (
    <OnboardingShell
      backgroundImage={BACKGROUND_IMAGE}
      currentStep={3}
      title="Beat the traffic"
      subtitle="Real-time incident reports and delay predictions help you find the best time to leave."
      nextRoute="/(auth)/sign-up"
      isLastStep={true}
    >
      <NotificationMock
        title="Traffic Alert"
        message="Accident reported on I-95 North. Expected delay: 15 minutes. Consider alternate route."
        time="2m ago"
        icon="traffic"
      />
    </OnboardingShell>
  );
}
