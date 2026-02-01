import { useSignUp, useSSO } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { api } from "@outly/backend/convex/_generated/api";
import { Link, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { Mail01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

// Warm up browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const ensureUser = useMutation(api.users.ensureUser);

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle social sign up
  const onSocialSignUp = useCallback(
    async (strategy: "oauth_apple" | "oauth_google") => {
      if (!isLoaded) return;

      const provider = strategy === "oauth_apple" ? "apple" : "google";
      setIsSocialLoading(provider);
      setError(null);

      try {
        const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId && setActiveSession) {
          await setActiveSession({ session: createdSessionId });
          // Ensure user exists in Convex
          await ensureUser();
          router.replace("/(tabs)");
        }
      } catch (err: any) {
        console.error("Social sign up error:", err);
        setError(err.errors?.[0]?.message || "Social sign up failed");
      } finally {
        setIsSocialLoading(null);
      }
    },
    [isLoaded, startSSOFlow, ensureUser, router]
  );

  // Handle email/password sign up (without email verification)
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError(null);

    try {
      // Create sign up with email and password
      const signUpAttempt = await signUp.create({
        emailAddress,
        password,
      });

      // Check if sign up is complete (no verification required)
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        // Ensure user exists in Convex
        await ensureUser();
        router.replace("/(tabs)");
      } else if (signUpAttempt.status === "missing_requirements") {
        // If Clerk requires verification, try to complete anyway
        // This happens when email verification is disabled in Clerk dashboard
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: "", // Empty code for auto-verification
        }).catch(() => null);

        if (completeSignUp?.status === "complete") {
          await setActive({ session: completeSignUp.createdSessionId });
          await ensureUser();
          router.replace("/(tabs)");
        } else {
          // Fallback: just set the session active
          if (signUpAttempt.createdSessionId) {
            await setActive({ session: signUpAttempt.createdSessionId });
            await ensureUser();
            router.replace("/(tabs)");
          } else {
            setError("Unable to complete sign up. Please try again.");
          }
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Sign up to get started with Outly
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Apple Sign Up */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onSocialSignUp("oauth_apple")}
              disabled={isSocialLoading !== null}
            >
              <Image
                source={{ uri: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/apple.svg" }}
                style={styles.socialIconApple}
              />
              <Text style={styles.socialButtonText}>
                {isSocialLoading === "apple" ? "Signing up..." : "Continue with Apple"}
              </Text>
            </TouchableOpacity>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => onSocialSignUp("oauth_google")}
              disabled={isSocialLoading !== null}
            >
              <Image
                source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }}
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                {isSocialLoading === "google" ? "Signing up..." : "Continue with Google"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <HugeiconsIcon icon={Mail01Icon} size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={emailAddress}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setEmailAddress}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <HugeiconsIcon icon={LockIcon} size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={password}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <Button
              variant="primary"
              size="lg"
              style={styles.submitButton}
              onPress={onSignUpPress}
              isDisabled={isLoading || !emailAddress || !password || isSocialLoading !== null}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    height: 52,
    borderRadius: 12,
    gap: 12,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialIconApple: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  googleButtonText: {
    color: "#111827",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#9CA3AF",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  submitButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111827",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
