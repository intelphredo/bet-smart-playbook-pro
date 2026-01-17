import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  Sparkles,
  TrendingUp,
  DollarSign,
  Target,
  HelpCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: <TrendingUp className="h-3 w-3" />, text: "What is expected value?" },
  { icon: <DollarSign className="h-3 w-3" />, text: "Explain the Kelly Criterion" },
  { icon: <Target className="h-3 w-3" />, text: "How do I read American odds?" },
  { icon: <HelpCircle className="h-3 w-3" />, text: "What is CLV and why does it matter?" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/betting-assistant`;

export default function BettingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const allMessages = [...messages, userMsg];
    
    setMessages(allMessages);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Too many requests. Please wait a moment.");
        } else if (response.status === 402) {
          toast.error("AI credits exhausted.");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add initial assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, wait for more data
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final buffer flush
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }

    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1].content) {
          updated.pop();
        }
        return updated;
      });
      toast.error(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleSuggestion = (question: string) => {
    if (isLoading) return;
    streamChat(question);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Render message content with safe markdown support using DOMPurify
  const renderMessage = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text - apply regex transformation
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Sanitize the processed line to prevent XSS
        const sanitizedLine = DOMPurify.sanitize(processedLine, {
          ALLOWED_TAGS: ['strong', 'b', 'em', 'i'],
          ALLOWED_ATTR: []
        });
        
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const bulletContent = DOMPurify.sanitize(processedLine.slice(2), {
            ALLOWED_TAGS: ['strong', 'b', 'em', 'i'],
            ALLOWED_ATTR: []
          });
          return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: bulletContent }} />;
        }
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const numberedContent = DOMPurify.sanitize(processedLine.replace(/^\d+\.\s/, ''), {
            ALLOWED_TAGS: ['strong', 'b', 'em', 'i'],
            ALLOWED_ATTR: []
          });
          return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: numberedContent }} />;
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: sanitizedLine }} />;
      });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleOpen}
          className={cn(
            "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "flex items-center justify-center",
            "animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-4 duration-300",
            "flex flex-col",
            isMinimized 
              ? "bottom-20 right-4 w-72 h-14" 
              : "bottom-20 right-4 w-[380px] h-[520px] max-h-[80vh]",
            "sm:w-[400px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5" />
                <Sparkles className="h-2.5 w-2.5 absolute -top-1 -right-1 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Betting Assistant</h3>
                {!isMinimized && (
                  <p className="text-[10px] opacity-80">Ask about strategies & odds</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleOpen}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Bot className="h-12 w-12 mx-auto text-primary mb-3" />
                      <h4 className="font-semibold mb-1">Hi! I'm your betting assistant</h4>
                      <p className="text-sm text-muted-foreground">
                        Ask me about betting strategies, odds, or bankroll management.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 h-auto py-2 text-xs"
                            onClick={() => handleSuggestion(q.text)}
                            disabled={isLoading}
                          >
                            {q.icon}
                            {q.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {msg.role === "assistant" ? (
                            <div className="space-y-1 prose-sm">
                              {renderMessage(msg.content)}
                              {msg.content === "" && isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-3 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about betting strategies..."
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  For education only. Always gamble responsibly.
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}