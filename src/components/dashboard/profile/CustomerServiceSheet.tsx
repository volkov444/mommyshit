"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Sheet } from "./Sheet";
import { useToast } from "@/components/dashboard/ToastProvider";
import { useUser } from "@/components/dashboard/UserProvider";
import { createTicket } from "@/lib/admin/ticketsStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CustomerServiceSheet({ open, onClose }: Props) {
  const { user } = useUser();
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !message.trim() || !user) return;
    setSending(true);
    const ticket = await createTicket({ userId: user.id, userName: user.name, subject: subject.trim(), message: message.trim() });
    setSending(false);
    if (!ticket) {
      toast("Couldn't send your message — please try again.", "error");
      return;
    }
    setSubject("");
    setMessage("");
    toast("Message sent — our team will get back to you.", "success");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Customer Service" description="Send a report or issue you're experiencing.">
      <div className="space-y-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-2xl bg-canvas px-4 py-3 text-sm text-navy ring-1 ring-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Write your issue or question here…"
          className="w-full resize-none rounded-2xl bg-canvas px-4 py-3 text-sm text-navy ring-1 ring-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !message.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-60"
        >
          <Send size={15} />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </Sheet>
  );
}
