import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { api } from "../../lib/api";
import type { ChatMessage } from "@friendinerary/types";
import { COLORS } from "../../theme/colors";
import type { TripScreenProps } from "../../navigation/types";

const AIAssistantScreen = ({ route }: TripScreenProps<"AIAssistant">) => {
  const { tripId } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initThread();
  }, []);

  const initThread = async () => {
    try {
      // Get or create a thread
      const { data: threads } = await api.get<{ data: { id: string }[] }>(`/trips/${tripId}/ai/threads`);
      let id = threads.data[0]?.id;
      if (!id) {
        const { data: created } = await api.post<{ data: { id: string } }>(`/trips/${tripId}/ai/threads`);
        id = created.data.id;
      }
      setThreadId(id);
      const { data: msgs } = await api.get<{ data: ChatMessage[] }>(`/trips/${tripId}/ai/threads/${id}/messages`);
      setMessages(msgs.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !threadId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      threadId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await api.post<{ data: { userMessage: ChatMessage; assistantMessage: ChatMessage } }>(
        `/trips/${tripId}/ai/threads/${threadId}/messages`,
        { content: text }
      );
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMsg.id),
        data.data.userMessage,
        data.data.assistantMessage,
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyTitle}>Friendinerary AI</Text>
            <Text style={styles.emptySubtitle}>
              Ask me anything about your trip — recommendations, itinerary planning, local tips, and more.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === "user" ? styles.userBubble : styles.assistantBubble,
          ]}>
            <Text style={[
              styles.messageText,
              item.role === "user" ? styles.userText : styles.assistantText,
            ]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your trip..."
          placeholderTextColor={COLORS.gray400}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  messagesContent: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray800, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: COLORS.brand500,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.gray100,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  userText: { color: COLORS.white },
  assistantText: { color: COLORS.gray900 },
  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.gray900,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand500,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.gray300 },
  sendBtnText: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
});

export default AIAssistantScreen;
