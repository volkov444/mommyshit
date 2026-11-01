// Support tickets, backed by Supabase (see supabase/tickets_schema.sql). A
// user can insert their own ticket directly (no money/atomicity concern,
// unlike orders/deposits); only an admin can change one afterwards (status
// + appending a reply), enforced by the table's RLS policies.

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupportTicket, TicketStatus } from "./types";

type TicketRow = {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  message: string;
  status: TicketStatus;
  replies: SupportTicket["replies"];
  created_at: string;
};

const COLUMNS = "id, user_id, user_name, subject, message, status, replies, created_at";

function fromRow(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    replies: row.replies,
  };
}

export async function getTickets(): Promise<SupportTicket[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("tickets").select(COLUMNS).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as TicketRow[]).map(fromRow);
}

export async function getTicketById(id: string): Promise<SupportTicket | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("tickets").select(COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data as unknown as TicketRow);
}

export async function createTicket(input: { userId: string; userName: string; subject: string; message: string }): Promise<SupportTicket | undefined> {
  const supabase = getSupabaseClient();
  const id = `tkt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from("tickets").insert({
    id,
    user_id: input.userId,
    user_name: input.userName,
    subject: input.subject,
    message: input.message,
    status: "open",
    replies: [],
  });
  if (error) return undefined;
  return getTicketById(id);
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket | undefined> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
  if (error) return undefined;
  return getTicketById(id);
}

export async function replyToTicket(id: string, message: string): Promise<SupportTicket | undefined> {
  const current = await getTicketById(id);
  if (!current) return undefined;

  const supabase = getSupabaseClient();
  const nextReplies = [...current.replies, { author: "admin" as const, message, at: new Date().toISOString() }];
  const nextStatus: TicketStatus = current.status === "resolved" ? "resolved" : "in_progress";
  const { error } = await supabase.from("tickets").update({ replies: nextReplies, status: nextStatus }).eq("id", id);
  if (error) return undefined;
  return getTicketById(id);
}
