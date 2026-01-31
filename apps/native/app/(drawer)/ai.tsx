import { useUIMessages, useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@outly/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { Container } from "@/components/container";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

function MessageContent({
  text,
  isStreaming,
  textColor,
}: {
  text: string;
  isStreaming: boolean;
  textColor: string;
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: isStreaming,
  });
  return <Text style={[styles.messageText, { color: textColor }]}>{visibleText}</Text>;
}

export default function AIScreen() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const createThread = useMutation(api.chat.createNewThread);
  const sendMessage = useMutation(api.chat.sendMessage);

  const { results: messages } = useUIMessages(
    api.chat.listMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const hasStreamingMessage = messages?.some((m: UIMessage) => m.status === "streaming");

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function onSubmit() {
    const value = input.trim();
    if (!value || isLoading) return;

    setIsLoading(true);
    setInput("");

    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      await sendMessage({ threadId: currentThreadId, prompt: value });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AI Chat</Text>
            <Text style={[styles.headerSubtitle, { color: theme.text, opacity: 0.7 }]}>
              Chat with our AI assistant
            </Text>
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {!messages || messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.text, opacity: 0.7 }]}>
                  Ask me anything to get started!
                </Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((message: UIMessage) => (
                  <View
                    key={message.key}
                    style={[
                      styles.messageCard,
                      {
                        backgroundColor:
                          message.role === "user" ? theme.primary + "20" : theme.card,
                        borderColor: theme.border,
                        alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                        marginLeft: message.role === "user" ? 32 : 0,
                        marginRight: message.role === "user" ? 0 : 32,
                      },
                    ]}
                  >
                    <Text style={[styles.messageRole, { color: theme.text }]}>
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </Text>
                    <MessageContent
                      text={message.text ?? ""}
                      isStreaming={message.status === "streaming"}
                      textColor={theme.text}
                    />
                  </View>
                ))}
                {isLoading && !hasStreamingMessage && (
                  <View
                    style={[
                      styles.messageCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        alignSelf: "flex-start",
                        marginRight: 32,
                      },
                    ]}
                  >
                    <Text style={[styles.messageRole, { color: theme.text }]}>AI Assistant</Text>
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.loadingText, { color: theme.text, opacity: 0.7 }]}>
                        Thinking...
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor={theme.text}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
                onSubmitEditing={(e) => {
                  e.preventDefault();
                  onSubmit();
                }}
                editable={!isLoading}
                autoFocus={true}
                multiline
              />
              <TouchableOpacity
                onPress={onSubmit}
                disabled={!input.trim() || isLoading}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: input.trim() && !isLoading ? theme.primary : theme.border,
                    opacity: input.trim() && !isLoading ? 1 : 0.5,
                  },
                ]}
              >
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  messagesList: {
    gap: 8,
    paddingBottom: 16,
  },
  messageCard: {
    borderWidth: 1,
    padding: 12,
    maxWidth: "80%",
  },
  messageRole: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 8,
    fontSize: 14,
    minHeight: 36,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
