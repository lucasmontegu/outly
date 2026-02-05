import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { api } from "@outia/backend/convex/_generated/api";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { Mail01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { colors, spacing, borderRadius, typography, shadows } from "@/lib/design-tokens";

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>outia</Text>
          </View>

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
              style={styles.appleButton}
              onPress={() => onSocialSignIn("oauth_apple")}
              disabled={isSocialLoading !== null}
              accessibilityLabel="Continue with Apple"
              accessibilityRole="button"
            >
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              <Text style={styles.appleButtonText}>
                {isSocialLoading === "apple" ? "Signing in…" : "Continue with Apple"}
              </Text>
            </TouchableOpacity>

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => onSocialSignIn("oauth_google")}
              disabled={isSocialLoading !== null}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
            >
              <Ionicons name="logo-google" size={20} color="#000000" />
              <Text style={styles.googleButtonText}>
                {isSocialLoading === "google" ? "Signing in…" : "Continue with Google"}
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
                <HugeiconsIcon icon={Mail01Icon} size={20} color={colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={emailAddress}
                  placeholder="Enter your email…"
                  placeholderTextColor={colors.text.tertiary}
                  onChangeText={setEmailAddress}
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <HugeiconsIcon icon={LockIcon} size={20} color={colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  value={password}
                  placeholder="Enter your password…"
                  placeholderTextColor={colors.text.tertiary}
                  secureTextEntry
                  onChangeText={setPassword}
                  autoComplete="password"
                  textContentType="password"
                  accessibilityLabel="Password"
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
              {isLoading ? "Signing in…" : "Sign In"}
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
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing[8],
  },
  logoText: {
    fontSize: typography.size["4xl"],
    fontWeight: typography.weight.bold,
    color: colors.brand.primary,
    letterSpacing: typography.tracking.tight,
  },
  header: {
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.size["5xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
  errorBox: {
    backgroundColor: colors.risk.high.light,
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: typography.size.base,
    color: colors.state.error,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    height: 52,
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  appleButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: "#FFFFFF",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
  },
  googleButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: "#000000",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing[4],
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  inputGroup: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.slate[700],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    height: 52,
    gap: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.state.info,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing[8],
    gap: spacing[1],
  },
  footerText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  signUpLink: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.state.info,
  },
});

