import { useUser } from "@clerk/clerk-expo";
import { api } from "@outly/backend/convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Link } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";

import { Container } from "@/components/container";
import { SignOutButton } from "@/components/sign-out-button";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function Home() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const { user } = useUser();
  const healthCheck = useQuery(api.healthCheck.get);
  const privateData = useQuery(api.privateData.get);

  return (
    <Container>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>BETTER T STACK</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: healthCheck ? "#10b981" : "#f59e0b" },
                ]}
              />
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: theme.text }]}>Convex</Text>
                <Text style={[styles.statusText, { color: theme.text, opacity: 0.7 }]}>
                  {healthCheck === undefined
                    ? "Checking..."
                    : healthCheck === "OK"
                      ? "Connected to API"
                      : "API Disconnected"}
                </Text>
              </View>
            </View>
          </View>

          <Authenticated>
            <Text style={{ color: theme.text }}>Hello {user?.emailAddresses[0].emailAddress}</Text>
            <Text style={{ color: theme.text }}>Private Data: {privateData?.message}</Text>
            <SignOutButton />
          </Authenticated>
          <Unauthenticated>
            <Link href="/(auth)/sign-in">
              <Text style={{ color: theme.primary }}>Sign in</Text>
            </Link>
            <Link href="/(auth)/sign-up">
              <Text style={{ color: theme.primary }}>Sign up</Text>
            </Link>
          </Unauthenticated>
          <AuthLoading>
            <Text style={{ color: theme.text }}>Loading...</Text>
          </AuthLoading>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    height: 8,
    width: 8,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 12,
  },
  userCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
  },
  userHeader: {
    marginBottom: 8,
  },
  userText: {
    fontSize: 16,
  },
  userName: {
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  signOutButton: {
    padding: 12,
  },
  signOutText: {
    color: "#ffffff",
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
  },
  statusCardTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
});
