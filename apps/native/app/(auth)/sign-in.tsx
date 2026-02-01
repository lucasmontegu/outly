import { useSignIn, useSSO } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const ensureUser = useMutation(api.users.ensureUser);

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle social sign in
  const onSocialSignIn = useCallback(
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
          router.replace("/(setup)");
        }
      } catch (err: any) {
        console.error("Social sign in error:", err);
        setError(err.errors?.[0]?.message || "Social sign in failed");
      } finally {
        setIsSocialLoading(null);
      }
    },
    [isLoaded, startSSOFlow, ensureUser, router]
  );

  // Handle email/password sign in
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError(null);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        // Ensure user exists in Convex
        await ensureUser();
        router.replace("/(setup)");
      } else {
        setError("Sign in incomplete. Please try again.");
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account to continue
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Apple Sign In */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => onSocialSignIn("oauth_apple")}
              disabled={isSocialLoading !== null}
            >
              <Image
                source={{ uri: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/apple.svg" }}
                style={styles.socialIconApple}
              />
              <Text style={styles.socialButtonText}>
                {isSocialLoading === "apple" ? "Signing in..." : "Continue with Apple"}
              </Text>
            </TouchableOpacity>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => onSocialSignIn("oauth_google")}
              disabled={isSocialLoading !== null}
            >
              <Image
                source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" }}
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                {isSocialLoading === "google" ? "Signing in..." : "Continue with Google"}
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
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              size="lg"
              className="w-full mt-2"
              onPress={onSignInPress}
              isDisabled={isLoading || !emailAddress || !password || isSocialLoading !== null}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Sign up</Text>
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
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
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
  signUpLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
});

