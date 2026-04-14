import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "@/services/api";
import { colors, radius, shadow } from "@/theme/tokens";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I can help with Browse Tasks, posting work, saved tasks, notifications, requester workflows, and task progress.",
  },
];

export function AIAssistantButton(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (): Promise<void> => {
    const nextMessage = input.trim();
    if (!nextMessage || isSending) return;

    const nextHistory = [...messages, { role: "user" as const, content: nextMessage }];
    setMessages(nextHistory);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.chat.send({
        message: nextMessage,
        history: nextHistory
          .filter((item) => item.role !== "assistant" || item.content !== starterMessages[0].content)
          .map((item) => ({ role: item.role, content: item.content })),
      });
      const reply = String(response.data?.reply || "I could not generate a reply right now.");
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "AI assistant is temporarily unavailable.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setIsOpen(true)}>
        <Text style={styles.fabText}>AI</Text>
      </Pressable>

      <Modal animationType="slide" transparent visible={isOpen} onRequestClose={() => setIsOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>ConnectMyTask AI</Text>
                <Text style={styles.modalSubtitle}>Always available for quick platform help</Text>
              </View>
              <Pressable onPress={() => setIsOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.messageList} contentContainerStyle={styles.messageContent}>
              {messages.map((item, index) => (
                <View
                  key={`${item.role}-${index}`}
                  style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}
                >
                  <Text style={[styles.messageText, item.role === "user" ? styles.userText : styles.assistantText]}>
                    {item.content}
                  </Text>
                </View>
              ))}
              {isSending ? (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <ActivityIndicator color={colors.primary[600]} />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                placeholder="Ask about tasks, progress, or account flows"
                placeholderTextColor={colors.dark[400]}
                value={input}
                onChangeText={setInput}
                style={styles.input}
                multiline
              />
              <Pressable style={styles.sendButton} onPress={() => void handleSend()}>
                <Text style={styles.sendText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[600],
    borderWidth: 1,
    borderColor: colors.primary[700],
    ...shadow.card,
  },
  fabText: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.34)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalCard: {
    maxHeight: "82%",
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[100],
  },
  modalTitle: {
    color: colors.dark[900],
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.dark[500],
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  closeText: {
    color: colors.primary[700],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  messageList: {
    maxHeight: 420,
  },
  messageContent: {
    padding: 18,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "86%",
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.dark[50],
    borderWidth: 1,
    borderColor: colors.dark[100],
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary[600],
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  assistantText: {
    color: colors.dark[800],
  },
  userText: {
    color: colors.white,
  },
  inputRow: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.dark[100],
    gap: 10,
  },
  input: {
    minHeight: 48,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark[200],
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.dark[900],
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
  },
  sendText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
});
