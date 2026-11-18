"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  PROFESSIONAL_MESSAGES_STORAGE_KEY,
  type ProfessionalRole,
} from "@/lib/professional-profile";

export type ProfessionalContact = {
  name: string;
  role: ProfessionalRole;
  focus: string;
};

export type SharedPost = {
  id: string;
  author: string;
  role: ProfessionalRole | "COMMUNITY";
  text: string;
  url: string;
};

export type SharedPostNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: number;
};

type ConversationMember = ProfessionalContact & { id: string };
type DirectMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  sharedPost?: SharedPost;
};
type Conversation = {
  id: string;
  participants: ConversationMember[];
  messages: DirectMessage[];
};

function memberId(member: Pick<ProfessionalContact, "name" | "role">): string {
  return `${member.role}:${member.name.trim().toLowerCase()}`;
}

function conversationId(
  first: Pick<ProfessionalContact, "name" | "role">,
  second: Pick<ProfessionalContact, "name" | "role">,
): string {
  return [memberId(first), memberId(second)].sort().join("::");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConversationMember(value: unknown): value is ConversationMember {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.role === "STUDENT" || value.role === "ADVOCATE") &&
    typeof value.focus === "string"
  );
}

function isSharedPost(value: unknown): value is SharedPost {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.author === "string" &&
    (value.role === "STUDENT" || value.role === "ADVOCATE" || value.role === "COMMUNITY") &&
    typeof value.text === "string" &&
    typeof value.url === "string" &&
    /^\/feed#post-[^/?#]+$/.test(value.url)
  );
}

function isDirectMessage(value: unknown): value is DirectMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.senderId === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "number" &&
    (value.sharedPost === undefined || isSharedPost(value.sharedPost))
  );
}

function isConversation(value: unknown): value is Conversation {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.participants) &&
    value.participants.length === 2 &&
    value.participants.every(isConversationMember) &&
    Array.isArray(value.messages) &&
    value.messages.every(isDirectMessage)
  );
}

function loadConversations(): Conversation[] {
  const raw = window.localStorage.getItem(PROFESSIONAL_MESSAGES_STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isConversation)) {
    throw new Error("Saved messages have an invalid format.");
  }
  return parsed;
}

export function sharePostWithContacts(
  currentUser: ProfessionalContact,
  recipients: ProfessionalContact[],
  sharedPost: SharedPost,
  note: string,
): void {
  const senderId = memberId(currentUser);
  const uniqueRecipients = new Map<string, ProfessionalContact>();
  recipients.forEach((recipient) => {
    const id = memberId(recipient);
    if (id !== senderId) uniqueRecipients.set(id, recipient);
  });
  if (uniqueRecipients.size === 0) {
    throw new Error("Choose at least one other forum member.");
  }

  let nextConversations = loadConversations();
  uniqueRecipients.forEach((recipient, recipientId) => {
    const threadId = conversationId(currentUser, recipient);
    const existing = nextConversations.find((thread) => thread.id === threadId);
    const message: DirectMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId,
      text: note,
      createdAt: Date.now(),
      sharedPost,
    };
    const nextConversation: Conversation = existing
      ? { ...existing, messages: [...existing.messages, message] }
      : {
          id: threadId,
          participants: [
            { ...currentUser, id: senderId },
            { ...recipient, id: recipientId },
          ],
          messages: [message],
        };
    nextConversations = existing
      ? nextConversations.map((thread) => thread.id === threadId ? nextConversation : thread)
      : [nextConversation, ...nextConversations];
  });

  window.localStorage.setItem(
    PROFESSIONAL_MESSAGES_STORAGE_KEY,
    JSON.stringify(nextConversations),
  );
}

export function getSharedPostNotifications(
  currentUser: ProfessionalContact,
): SharedPostNotification[] {
  const currentUserId = memberId(currentUser);
  return loadConversations().flatMap((thread) =>
    thread.messages.flatMap((message) => {
      if (!message.sharedPost || message.senderId === currentUserId) return [];
      const sender = thread.participants.find((participant) => participant.id === message.senderId);
      if (!sender || !thread.participants.some((participant) => participant.id === currentUserId)) {
        return [];
      }
      const context = message.text.trim();
      return [{
        id: `${message.id}-shared-post`,
        title: `${sender.name} shared a post with you`,
        detail: context
          ? `${context} · ${message.sharedPost.author}: ${message.sharedPost.text}`
          : `${message.sharedPost.author}: ${message.sharedPost.text}`,
        createdAt: message.createdAt,
      }];
    }),
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProfessionalMessaging({
  currentUser,
  members,
  initialRecipient,
}: {
  currentUser: ProfessionalContact;
  members: ProfessionalContact[];
  initialRecipient: ProfessionalContact | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<ProfessionalContact | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const currentUserId = memberId(currentUser);
  const initialRecipientId = initialRecipient ? memberId(initialRecipient) : "";

  useEffect(() => {
    let savedConversations: Conversation[] = [];
    try {
      savedConversations = loadConversations();
    } catch (loadError) {
      setLoadFailed(true);
      setError(
        loadError instanceof Error
          ? `Messages could not be loaded: ${loadError.message}`
          : "Messages could not be loaded from this browser.",
      );
    }

    setConversations(savedConversations);
    if (initialRecipient) {
      setSelectedRecipient(initialRecipient);
      setActiveConversationId(conversationId(currentUser, initialRecipient));
    } else if (savedConversations.length > 0) {
      const mostRecent = [...savedConversations].sort(
        (left, right) =>
          (right.messages[right.messages.length - 1]?.createdAt ?? 0) -
          (left.messages[left.messages.length - 1]?.createdAt ?? 0),
      )[0];
      const recipient = mostRecent.participants.find(
        (participant) => participant.id !== currentUserId,
      );
      if (recipient) {
        setSelectedRecipient(recipient);
        setActiveConversationId(mostRecent.id);
      }
    }
    setReady(true);
  }, [currentUserId, initialRecipientId]);

  const conversation = conversations.find((item) => item.id === activeConversationId);
  const contacts = useMemo(() => {
    const candidates = [
      ...members,
      ...conversations.flatMap((thread) =>
        thread.participants.filter((participant) => participant.id !== currentUserId),
      ),
    ];
    const unique = new Map<string, ProfessionalContact>();
    candidates.forEach((contact) => {
      const id = memberId(contact);
      if (id !== currentUserId && !unique.has(id)) unique.set(id, contact);
    });
    return [...unique.values()].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [conversations, currentUserId, members]);

  function selectRecipient(contact: ProfessionalContact) {
    setSelectedRecipient(contact);
    setActiveConversationId(conversationId(currentUser, contact));
    setMessageDraft("");
    setError("");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!selectedRecipient || !text) return;
    if (loadFailed) return;
    if (text.length > 2000) {
      setError("Messages must be 2,000 characters or fewer.");
      return;
    }

    const recipient: ConversationMember = {
      ...selectedRecipient,
      id: memberId(selectedRecipient),
    };
    const sender: ConversationMember = {
      ...currentUser,
      id: currentUserId,
    };
    const threadId = conversationId(currentUser, selectedRecipient);
    const existing = conversations.find((thread) => thread.id === threadId);
    const message: DirectMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: currentUserId,
      text,
      createdAt: Date.now(),
    };
    const nextConversation: Conversation = existing
      ? { ...existing, messages: [...existing.messages, message] }
      : { id: threadId, participants: [sender, recipient], messages: [message] };
    const nextConversations = existing
      ? conversations.map((thread) => thread.id === threadId ? nextConversation : thread)
      : [nextConversation, ...conversations];

    try {
      window.localStorage.setItem(
        PROFESSIONAL_MESSAGES_STORAGE_KEY,
        JSON.stringify(nextConversations),
      );
      setConversations(nextConversations);
      setMessageDraft("");
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Your message could not be saved: ${saveError.message}`
          : "Your message could not be saved in this browser.",
      );
    }
  }

  if (!ready) {
    return <p className="network-profile-loading" aria-busy="true">Loading your messages…</p>;
  }

  return (
    <section className="messaging-panel" id="messaging" aria-labelledby="messaging-heading">
      <div className="messaging-heading">
        <div>
          <h1 id="messaging-heading">Messaging</h1>
          <p>Connect directly with students and advocates in your network.</p>
        </div>
        <span>Private to this browser demo</span>
      </div>
      {error && <p className="feed-error" role="alert">{error}</p>}
      <div className="messaging-workspace">
        <aside className="messaging-contacts" aria-label="People and conversations">
          <h2>People</h2>
          {contacts.length === 0 ? (
            <p className="messaging-empty">Find people in Network to start a conversation.</p>
          ) : (
            contacts.map((contact) => {
              const isSelected = selectedRecipient !== null && memberId(contact) === memberId(selectedRecipient);
              const threadId = conversationId(currentUser, contact);
              return (
                <button
                  type="button"
                  className={`messaging-contact${isSelected ? " active" : ""}`}
                  key={memberId(contact)}
                  onClick={() => selectRecipient(contact)}
                >
                  <ProfileAvatar name={contact.name} completion={100} />
                  <span>
                    <b>{contact.name}</b>
                    <small>{contact.role === "STUDENT" ? "Law student" : "Advocate"}</small>
                  </span>
                  {conversations.some((thread) => thread.id === threadId) && (
                    <span className="messaging-contact-indicator" aria-label="Conversation started" />
                  )}
                </button>
              );
            })
          )}
        </aside>

        <div className="messaging-thread">
          {selectedRecipient ? (
            <>
              <div className="messaging-recipient">
                <ProfileAvatar name={selectedRecipient.name} completion={100} />
                <div>
                  <b>{selectedRecipient.name}</b>
                  <span>{selectedRecipient.role === "STUDENT" ? "Law student" : "Advocate"} · {selectedRecipient.focus}</span>
                </div>
              </div>
              <div className="messaging-history" aria-live="polite">
                {(conversation?.messages ?? []).map((message) => (
                  <article
                    className={`message-bubble${message.senderId === currentUserId ? " message-bubble--own" : ""}`}
                    key={message.id}
                  >
                    {message.sharedPost ? (
                      <>
                        <span className="message-share-label">
                          {message.senderId === currentUserId ? "You shared a post" : "Shared post"}
                        </span>
                        {message.text.trim() && <p>{message.text}</p>}
                        <div className="message-shared-post">
                          <small>{message.sharedPost.role === "STUDENT"
                            ? "Law student"
                            : message.sharedPost.role === "ADVOCATE"
                              ? "Advocate"
                              : "Legal community"}</small>
                          <b>{message.sharedPost.author}</b>
                          <p>{message.sharedPost.text}</p>
                          <a href={message.sharedPost.url}>View post</a>
                        </div>
                      </>
                    ) : (
                      <p>{message.text}</p>
                    )}
                    <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
                  </article>
                ))}
                {!conversation?.messages.length && (
                  <p className="messaging-empty-thread">Start the conversation with {selectedRecipient.name}.</p>
                )}
              </div>
              <form className="messaging-compose" onSubmit={sendMessage}>
                <label className="sr-only" htmlFor="direct-message-input">Write a message</label>
                <textarea
                  id="direct-message-input"
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.currentTarget.value)}
                  placeholder="Write a professional message…"
                  rows={2}
                  maxLength={2000}
                />
                <div>
                  <span>{messageDraft.length}/2000</span>
                  <button className="primary" type="submit" disabled={!messageDraft.trim() || loadFailed}>
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="messaging-empty-state">
              <span aria-hidden="true">✉</span>
              <h2>Your conversations</h2>
              <p>Select a person to message, or find students and advocates in Network.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
