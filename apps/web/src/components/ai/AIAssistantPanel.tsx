import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import { Send, Bot, User, X, Plus, Sparkles, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface AIAssistantPanelProps {
  tripId: string;
}

const AIAssistantPanel = observer(({ tripId }: AIAssistantPanelProps) => {
  const { ai, ui, auth } = useStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ai.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || ai.sending) return;
    const msg = input.trim();
    setInput("");

    try {
      await ai.sendMessage(tripId, msg);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "PRO_REQUIRED") {
        toast.error("Upgrade to Pro for unlimited AI messages");
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Trip Assistant</span>
          {!auth.isPro && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Free: 5 messages</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => ai.newThread(tripId)} className="btn-ghost p-1" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => ui.toggleAIPanel()} className="btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ai.messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Ask me anything about your trip!</p>
            <div className="mt-4 space-y-2">
              {[
                "What are the best restaurants in Tokyo?",
                "Generate a 5-day itinerary for Paris",
                "What should I pack for a beach trip?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {ai.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-brand-500 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {ai.sending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {!auth.isPro && (
          <div className="mb-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
            <Crown className="w-3.5 h-3.5" />
            <span>5 free messages per chat. <a href="/pro" className="underline font-medium">Upgrade for unlimited</a></span>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="Ask about your trip..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={ai.sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || ai.sending}
            className="btn-primary px-3 py-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
});

export default AIAssistantPanel;
