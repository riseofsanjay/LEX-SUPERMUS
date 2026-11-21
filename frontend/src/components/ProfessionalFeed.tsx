"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfessionalMessaging, {
  getSharedPostNotifications,
  sharePostWithContacts,
  type ProfessionalContact,
  type SharedPost,
} from "@/components/ProfessionalMessaging";
import {
  markProfessionalNotificationsRead,
  syncProfessionalNotifications,
} from "@/lib/professional-content";
import {
  getSavedProfileKey,
  PROFESSIONAL_FEED_STORAGE_KEY,
} from "@/lib/professional-profile";

type ProfessionalRole = "STUDENT" | "ADVOCATE" | "LAW_FIRM" | "ADMIN";
type FeedRole = ProfessionalRole | "COMMUNITY";
type FeedView = "FOR_YOU" | "NETWORK";
type FeedPage = "HOME" | "NETWORK" | "MESSAGING" | "NOTIFICATIONS";
type SuggestedMember = {
  id: string;
  name: string;
  role: ProfessionalRole;
  focus: string;
};

type FeedComment = {
  id: string;
  author: string;
  role: ProfessionalRole;
  text: string;
  createdAt: number;
};

type FeedShare = {
  id: string;
  memberKey: string;
  recipientKeys: string[];
  createdAt: number;
};

type FeedPost = {
  id: string;
  author: string;
  role: FeedRole;
  text: string;
  tags: string[];
  createdAt: number;
  likedBy: string[];
  comments: FeedComment[];
  image?: string;
  shares?: FeedShare[];
};

type FeedNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: number;
};

const STARTER_POSTS: FeedPost[] = [
  {
    id: "welcome-to-the-network",
    author: "LEX SUPERMUS Legal Network",
    role: "COMMUNITY",
    text: "Welcome to a shared professional space for India’s legal community. Students and advocates can exchange insights, discover opportunities, and grow together.",
    tags: ["#LegalCommunity", "#IndiaLaw"],
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    likedBy: [],
    comments: [],
  },
  {
    id: "focused-case-briefs",
    author: "Aarav Menon",
    role: "ADVOCATE",
    text: "A thoughtful case brief starts with a clear issue, the governing rule, and a concise explanation of how the court applied it. What helps you keep your research focused?",
    tags: ["#LegalResearch", "#Advocacy"],
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    likedBy: [],
    comments: [],
  },
  {
    id: "student-research-note",
    author: "Nisha Rao",
    role: "STUDENT",
    text: "I’m learning to compare judgments by tracing how each court frames the legal issue. A clear research question has made my case notes much more focused.",
    tags: ["#LawStudent", "#LegalResearch"],
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    likedBy: [],
    comments: [],
  },
];

const SUGGESTED_MEMBERS: SuggestedMember[] = [
  { id: "meera-iyer", name: "Meera Iyer", role: "ADVOCATE", focus: "Constitutional law · Chennai" },
  { id: "kabir-shah", name: "Kabir Shah", role: "STUDENT", focus: "LL.B. · Legal research" },
  { id: "sana-khan", name: "Sana Khan", role: "ADVOCATE", focus: "Dispute resolution · Mumbai" },
];

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((field) => typeof field === "string")
  );
}

function isFeedComment(value: unknown): value is FeedComment {
  if (!value || typeof value !== "object") return false;
  const comment = value as Record<string, unknown>;
  return (
    typeof comment.id === "string" &&
    typeof comment.author === "string" &&
    (comment.role === "STUDENT" || comment.role === "ADVOCATE" || comment.role === "LAW_FIRM" || comment.role === "ADMIN") &&
    typeof comment.text === "string" &&
    typeof comment.createdAt === "number"
  );
}

function isFeedShare(value: unknown): value is FeedShare {
  if (!value || typeof value !== "object") return false;
  const share = value as Record<string, unknown>;
  return (
    typeof share.id === "string" &&
    typeof share.memberKey === "string" &&
    Array.isArray(share.recipientKeys) &&
    share.recipientKeys.every((key) => typeof key === "string") &&
    typeof share.createdAt === "number"
  );
}

function isFeedPost(value: unknown): value is FeedPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "string" &&
    typeof post.author === "string" &&
    (post.role === "STUDENT" || post.role === "ADVOCATE" || post.role === "LAW_FIRM" || post.role === "ADMIN" || post.role === "COMMUNITY") &&
    typeof post.text === "string" &&
    Array.isArray(post.tags) &&
    post.tags.every((tag) => typeof tag === "string") &&
    typeof post.createdAt === "number" &&
    Array.isArray(post.likedBy) &&
    post.likedBy.every((member) => typeof member === "string") &&
    Array.isArray(post.comments) &&
    post.comments.every(isFeedComment) &&
    (post.image === undefined || typeof post.image === "string") &&
    (post.shares === undefined || (Array.isArray(post.shares) && post.shares.every(isFeedShare)))
  );
}

function formatRole(role: FeedRole) {
  if (role === "STUDENT") return "Law student";
  if (role === "ADVOCATE") return "Advocate";
  if (role === "LAW_FIRM") return "Law firm";
  if (role === "ADMIN") return "Administrator";
  return "Legal community";
}

function formatPostTime(timestamp: number) {
  const elapsedMinutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProfessionalFeed() {
  const router = useRouter();
  const [userName, setUserName] = useState("LEX SUPERMUS Member");
  const [userRole, setUserRole] = useState<ProfessionalRole | null>(null);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileDetails, setProfileDetails] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postText, setPostText] = useState("");
  const [feedView, setFeedView] = useState<FeedView>("FOR_YOU");
  const [activePage, setActivePage] = useState<FeedPage>("HOME");
  const [networkSearch, setNetworkSearch] = useState("");
  const [selectedMessageMember, setSelectedMessageMember] = useState<ProfessionalContact | null>(null);
  const [connectedMembers, setConnectedMembers] = useState<string[]>([]);
  const [incomingShareNotifications, setIncomingShareNotifications] = useState<FeedNotification[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [feedError, setFeedError] = useState("");
  const [sharingPost, setSharingPost] = useState<FeedPost | null>(null);
  const [shareRecipientKeys, setShareRecipientKeys] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState("");
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const syncFeedPage = () => {
      const requestedPage = window.location.hash.slice(1).toUpperCase();
      const nextPage: FeedPage =
        requestedPage === "NETWORK" ||
        requestedPage === "MESSAGING" ||
        requestedPage === "NOTIFICATIONS"
          ? requestedPage
          : "HOME";
      setActivePage(nextPage);
      setFeedView(nextPage === "NETWORK" ? "NETWORK" : "FOR_YOU");
      setNetworkSearch(new URLSearchParams(window.location.search).get("search") ?? "");
    };
    const handleNetworkNavigation = (event: Event) => {
      const destination = (event as CustomEvent<string>).detail;
      if (destination === "NETWORK" || destination === "MESSAGING" || destination === "NOTIFICATIONS") {
        setActivePage(destination);
        setFeedView(destination === "NETWORK" ? "NETWORK" : "FOR_YOU");
      } else if (destination === "HOME") {
        setActivePage("HOME");
        setFeedView("FOR_YOU");
      }
    };

    syncFeedPage();
    window.addEventListener("hashchange", syncFeedPage);
    window.addEventListener("popstate", syncFeedPage);
    window.addEventListener("professional-feed:navigate", handleNetworkNavigation);
    return () => {
      window.removeEventListener("hashchange", syncFeedPage);
      window.removeEventListener("popstate", syncFeedPage);
      window.removeEventListener("professional-feed:navigate", handleNetworkNavigation);
    };
  }, []);

  useEffect(() => {
    const storedName = window.localStorage.getItem("lex-supermus-user-name");
    const storedRole = window.localStorage.getItem("lex-supermus-user-role");
    if (!storedName || (storedRole !== "STUDENT" && storedRole !== "ADVOCATE")) {
      router.replace(storedRole === "CLIENT" ? "/client" : "/login");
      return;
    }

    setUserName(storedName);
    setUserRole(storedRole);
    setProfilePhoto(window.localStorage.getItem("lex-supermus-user-avatar") ?? "");

    const rawProfileDetails = window.localStorage.getItem(
      getSavedProfileKey(storedRole, "details"),
    );
    if (rawProfileDetails) {
      try {
        const parsed: unknown = JSON.parse(rawProfileDetails);
        if (!isStringRecord(parsed)) {
          throw new Error("Saved profile details have an invalid format.");
        }
        setProfileDetails(parsed);
      } catch (error) {
        setFeedError(
          error instanceof Error
            ? `Profile details could not be loaded: ${error.message}`
            : "Profile details could not be loaded.",
        );
      }
    }

    const savedConnections = window.localStorage.getItem(
      `lex-supermus-connections:${storedRole}:${storedName.toLowerCase()}`,
    );
    if (savedConnections) {
      try {
        const parsed: unknown = JSON.parse(savedConnections);
        if (!Array.isArray(parsed) || !parsed.every((member) => typeof member === "string")) {
          throw new Error("Saved connections have an invalid format.");
        }
        setConnectedMembers(parsed);
      } catch (error) {
        setFeedError(
          error instanceof Error
            ? `Connections could not be loaded: ${error.message}`
            : "Connections could not be loaded.",
        );
      }
    }

    try {
      const savedFeed = window.localStorage.getItem(PROFESSIONAL_FEED_STORAGE_KEY);
      if (savedFeed === null) {
        window.localStorage.setItem(PROFESSIONAL_FEED_STORAGE_KEY, JSON.stringify(STARTER_POSTS));
        setPosts(STARTER_POSTS);
      } else {
        const parsed: unknown = JSON.parse(savedFeed);
        if (!Array.isArray(parsed) || !parsed.every(isFeedPost)) {
          throw new Error("Saved community posts have an invalid format.");
        }
        setPosts(parsed);
      }
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `The shared feed could not be loaded: ${error.message}`
          : "The shared feed could not be loaded.",
      );
    }

    setIsAuthenticated(true);
  }, [router]);

  const memberKey = userRole ? `${userRole}:${userName.toLowerCase()}` : "";
  const portalHref = userRole === "STUDENT" ? "/student" : "/advocate";
  const roleHeadline = userRole === "STUDENT"
    ? [profileDetails.degree || "Law student", profileDetails.institution].filter(Boolean).join(" · ")
    : [profileDetails.practiceAreas || "Advocate", profileDetails.city].filter(Boolean).join(" · ");
  useEffect(() => {
    if (!userRole) return;
    try {
      setIncomingShareNotifications(
        getSharedPostNotifications({ name: userName, role: userRole, focus: roleHeadline }),
      );
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `Shared post notifications could not be loaded: ${error.message}`
          : "Shared post notifications could not be loaded.",
      );
    }
  }, [roleHeadline, userName, userRole]);
  const visiblePosts = feedView === "NETWORK"
    ? posts.filter((post) => post.role !== userRole && post.role !== "COMMUNITY")
    : posts;
  const knownMembers = new Map<string, ProfessionalContact>();
  [
    ...SUGGESTED_MEMBERS,
    ...posts
      .filter((post): post is FeedPost & { role: ProfessionalRole } => post.role !== "COMMUNITY")
      .map((post) => ({
        id: `${post.role}:${post.author.toLowerCase()}`,
        name: post.author,
        role: post.role,
        focus: "Active in the legal community",
      })),
  ].forEach((member) => {
    const id = `${member.role}:${member.name.trim().toLowerCase()}`;
    if (id !== memberKey && !knownMembers.has(id)) {
      knownMembers.set(id, {
        name: member.name,
        role: member.role,
        focus: member.focus,
      });
    }
  });
  const discoverableMembers = [...knownMembers.values()];
  const filteredMembers = discoverableMembers.filter((member) =>
    `${member.name} ${member.role} ${member.focus}`
      .toLowerCase()
      .includes(networkSearch.trim().toLowerCase()),
  );
  const connectionStorageKey = `lex-supermus-connections:${userRole}:${userName.toLowerCase()}`;
  const notifications = useMemo<FeedNotification[]>(
    () => posts.flatMap((post) => {
      if (post.author.toLowerCase() !== userName.toLowerCase()) return [];
      const likes: FeedNotification[] = post.likedBy
        .filter((member) => member !== memberKey)
        .map((member) => ({
          id: `${post.id}-like-${member}`,
          title: `${member.split(":").slice(1).join(":") || "A member"} liked your post`,
          detail: post.text,
          createdAt: post.createdAt,
        }));
      const comments: FeedNotification[] = post.comments
        .filter((comment) => comment.author.toLowerCase() !== userName.toLowerCase())
        .map((comment) => ({
          id: comment.id,
          title: `${comment.author} commented on your post`,
          detail: comment.text,
          createdAt: comment.createdAt,
        }));
      const shares: FeedNotification[] = (post.shares ?? [])
        .filter((share) =>
          share.memberKey !== memberKey && !share.recipientKeys.includes(memberKey),
        )
        .map((share) => ({
          id: share.id,
          title: `${share.memberKey.split(":").slice(1).join(":") || "A member"} shared your post`,
          detail: post.text,
          createdAt: share.createdAt,
        }));
      return [...likes, ...comments, ...shares];
    }).concat(incomingShareNotifications)
      .sort((first, second) => second.createdAt - first.createdAt),
    [incomingShareNotifications, memberKey, posts, userName],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      syncProfessionalNotifications(notifications.map(({ id }) => id));
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `Notification status could not be saved: ${error.message}`
          : "Notification status could not be saved.",
      );
    }
  }, [isAuthenticated, notifications]);

  useEffect(() => {
    if (!isAuthenticated || activePage !== "NOTIFICATIONS") return;
    try {
      markProfessionalNotificationsRead();
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `Notifications could not be marked as read: ${error.message}`
          : "Notifications could not be marked as read.",
      );
    }
  }, [activePage, isAuthenticated, notifications]);

  function navigateFeedPage(page: FeedPage) {
    setActivePage(page);
    setFeedView(page === "NETWORK" ? "NETWORK" : "FOR_YOU");
    const hash = page.toLowerCase();
    if (window.location.hash !== `#${hash}`) {
      window.location.hash = hash;
    }
  }

  function savePosts(nextPosts: FeedPost[]) {
    try {
      window.localStorage.setItem(PROFESSIONAL_FEED_STORAGE_KEY, JSON.stringify(nextPosts));
      setPosts(nextPosts);
      setFeedError("");
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `Your update could not be saved: ${error.message}`
          : "Your update could not be saved in this browser.",
      );
    }
  }

  function publishPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = postText.trim();
    if (!text || !userRole) return;

    savePosts([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: userName,
        role: userRole,
        text,
        tags: [],
        createdAt: Date.now(),
        likedBy: [],
        comments: [],
        shares: [],
      },
      ...posts,
    ]);
    setPostText("");
  }

  function toggleLike(post: FeedPost) {
    const alreadyLiked = post.likedBy.includes(memberKey);
    const nextPosts = posts.map((item) =>
      item.id === post.id
        ? {
            ...item,
            likedBy: alreadyLiked
              ? item.likedBy.filter((member) => member !== memberKey)
              : [...item.likedBy, memberKey],
          }
        : item,
    );
    savePosts(nextPosts);
  }

  function toggleConnection(memberId: string) {
    const member = discoverableMembers.find((item) =>
      `${item.role}:${item.name.trim().toLowerCase()}` === memberId,
    );
    const legacyId = member
      ? SUGGESTED_MEMBERS.find((suggestion) =>
          suggestion.role === member.role &&
          suggestion.name.toLowerCase() === member.name.toLowerCase(),
        )?.id
      : undefined;
    const matchingIds = legacyId ? [memberId, legacyId] : [memberId];
    const alreadyConnected = matchingIds.some((id) => connectedMembers.includes(id));
    const nextConnections = alreadyConnected
      ? connectedMembers.filter((id) => !matchingIds.includes(id))
      : [...connectedMembers, memberId];
    try {
      window.localStorage.setItem(connectionStorageKey, JSON.stringify(nextConnections));
      setConnectedMembers(nextConnections);
      setFeedError("");
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? `Your connection could not be saved: ${error.message}`
          : "Your connection could not be saved in this browser.",
      );
    }
  }

  function addComment(event: FormEvent<HTMLFormElement>, post: FeedPost) {
    event.preventDefault();
    const text = (commentDrafts[post.id] ?? "").trim();
    if (!text || !userRole) return;

    const comment: FeedComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: userName,
      role: userRole,
      text,
      createdAt: Date.now(),
    };
    savePosts(posts.map((item) =>
      item.id === post.id ? { ...item, comments: [...item.comments, comment] } : item,
    ));
    setCommentDrafts((drafts) => ({ ...drafts, [post.id]: "" }));
  }

  function openShareDialog(post: FeedPost) {
    setSharingPost(post);
    setShareRecipientKeys([]);
    setShareNote("");
    setShareError("");
  }

  function toggleShareRecipient(member: ProfessionalContact) {
    const key = `${member.role}:${member.name.trim().toLowerCase()}`;
    setShareRecipientKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function sendPostShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sharingPost || !userRole) return;
    const recipients = discoverableMembers.filter((member) =>
      shareRecipientKeys.includes(`${member.role}:${member.name.trim().toLowerCase()}`),
    );
    if (recipients.length === 0) {
      setShareError("Choose at least one forum member.");
      return;
    }

    const sharedPost: SharedPost = {
      id: sharingPost.id,
      author: sharingPost.author,
      role: sharingPost.role,
      text: sharingPost.text,
      url: `/feed#post-${encodeURIComponent(sharingPost.id)}`,
    };
    try {
      sharePostWithContacts(
        { name: userName, role: userRole, focus: roleHeadline },
        recipients,
        sharedPost,
        shareNote.trim(),
      );
    } catch (error) {
      setShareError(
        error instanceof Error
          ? `This post could not be sent: ${error.message}`
          : "This post could not be sent.",
      );
      return;
    }

    const shareRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      memberKey,
      recipientKeys: recipients.map((recipient) =>
        `${recipient.role}:${recipient.name.trim().toLowerCase()}`,
      ),
      createdAt: Date.now(),
    };
    savePosts(posts.map((post) =>
      post.id === sharingPost.id
        ? { ...post, shares: [...(post.shares ?? []), shareRecord] }
        : post,
    ));
    setSharingPost(null);
    setShareRecipientKeys([]);
    setShareNote("");
    setShareError("");
    setSelectedMessageMember(recipients[0]);
    navigateFeedPage("MESSAGING");
  }

  function startConversation(member: ProfessionalContact) {
    setSelectedMessageMember(member);
    navigateFeedPage("MESSAGING");
  }

  if (!isAuthenticated || !userRole) return null;

  return (
    <div className="professional-feed">
      <div className="feedHead" id="home">
        <p className="feed-eyebrow">LEX SUPERMUS · PROFESSIONAL NETWORK</p>
        <h1>Your legal community</h1>
        <p className="sub">One shared space for law students and advocates to learn, connect, and grow.</p>
      </div>

      {feedError && <p className="feed-error" role="alert">{feedError}</p>}

      <div className={`liGrid${activePage === "HOME" ? "" : " liGrid--workspace"}`}>
        <aside>
          <section className="liCard feed-profile-card">
            <div className="liCover" />
            <Link href={portalHref} className="feed-profile-avatar-link" aria-label="Open your profile">
              <ProfileAvatar
                name={userName}
                image={profilePhoto}
                completion={100}
                size="large"
                className="feed-profile-avatar"
              />
            </Link>
            <h2>{userName}</h2>
            <p className="liMuted">{roleHeadline}</p>
            <p className="feed-profile-location">{profileDetails.city || "India"} · {formatRole(userRole)}</p>
            <div className="liDivider" />
            <div className="feed-profile-stat"><span>Your posts</span><b>{posts.filter((post) => post.author.toLowerCase() === userName.toLowerCase()).length}</b></div>
            <div className="feed-profile-stat"><span>Connections</span><b>{connectedMembers.length}</b></div>
          </section>
          <section className="liCard">
            <h3>Your workspace</h3>
            <Link className="feed-list-link" href={portalHref}>Open my profile &amp; portal</Link>
          </section>
        </aside>

        <section aria-label="Community feed" className="feed-stream">
          {(activePage === "HOME" || activePage === "NETWORK") && (
            <nav className="feed-navigation" aria-label="Professional network views">
              <button
                type="button"
                className={activePage === "HOME" ? "active" : ""}
                aria-current={activePage === "HOME" ? "page" : undefined}
                onClick={() => navigateFeedPage("HOME")}
              >
                Home
              </button>
              <button
                type="button"
                className={activePage === "NETWORK" ? "active" : ""}
                aria-current={activePage === "NETWORK" ? "page" : undefined}
                onClick={() => navigateFeedPage("NETWORK")}
              >
                Network
              </button>
            </nav>
          )}

          {activePage === "NETWORK" && (
            <section className="liCard feed-suggestions" id="network">
              <div className="feed-suggestions-heading">
                <div>
                  <h2>Find students and advocates</h2>
                  <p>Search people who are part of the legal community.</p>
                </div>
                <span>{filteredMembers.length} people</span>
              </div>
              <label className="feed-member-search">
                <span className="sr-only">Search legal professionals</span>
                <input
                  type="search"
                  value={networkSearch}
                  onChange={(event) => setNetworkSearch(event.currentTarget.value)}
                  placeholder="Search by name, role, or focus area"
                />
              </label>
              <div className="feed-suggestion-grid">
                {filteredMembers.map((member) => {
                  const memberId = `${member.role}:${member.name.trim().toLowerCase()}`;
                  const connected = connectedMembers.includes(memberId) ||
                    connectedMembers.includes(
                      SUGGESTED_MEMBERS.find((suggestion) =>
                        suggestion.name.toLowerCase() === member.name.toLowerCase() &&
                        suggestion.role === member.role
                      )?.id ?? "",
                    );
                  return (
                    <article className="feed-suggestion" key={memberId}>
                      <ProfileAvatar name={member.name} completion={100} />
                      <div>
                        <b>{member.name}</b>
                        <span>{formatRole(member.role)}</span>
                        <small>{member.focus}</small>
                      </div>
                      <div className="feed-suggestion-actions">
                        <button
                          type="button"
                          className="feed-connect-button"
                          aria-pressed={connected}
                          onClick={() => toggleConnection(memberId)}
                        >
                          {connected ? "✓ Connected" : "+ Connect"}
                        </button>
                        <button
                          type="button"
                          className="feed-message-button"
                          onClick={() => startConversation(member)}
                        >
                          Message
                        </button>
                      </div>
                    </article>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <p className="feed-empty">No people matched that search. Try another name or role.</p>
                )}
              </div>
            </section>
          )}

          {activePage === "HOME" && (
            <form className="liCard feed-composer" onSubmit={publishPost}>
              <div className="liRow">
                <Link href={portalHref} aria-label="Open your profile">
                  <ProfileAvatar name={userName} image={profilePhoto} completion={100} />
                </Link>
                <label className="feed-composer-label" htmlFor="feed-post">
                  {userRole === "STUDENT"
                    ? "What are you learning or researching?"
                    : "Share a practice insight or professional update"}
                </label>
              </div>
              <textarea
                id="feed-post"
                className="feed-composer-input"
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder="Share a legal insight, question, or career update…"
                rows={3}
              />
              <div className="feed-composer-footer">
                <span className="liMuted">Keep it professional and constructive.</span>
                <button className="primary" type="submit" disabled={!postText.trim()}>
                  Share with the community
                </button>
              </div>
            </form>
          )}

          {activePage === "MESSAGING" && (
            <ProfessionalMessaging
              currentUser={{ name: userName, role: userRole, focus: roleHeadline }}
              members={discoverableMembers}
              initialRecipient={selectedMessageMember}
            />
          )}

          {activePage === "NOTIFICATIONS" && (
            <section className="liCard feed-notifications" id="notifications">
              <div className="feed-notifications-heading">
                <h1>Notifications</h1>
                <p>Likes, comments, and posts shared with you.</p>
              </div>
              {notifications.length === 0 ? (
                <p className="feed-empty">You don’t have any notifications yet. Likes, comments, and shared posts will appear here.</p>
              ) : (
                notifications.map((notification) => (
                  <article className="feed-notification" key={notification.id}>
                    <span aria-hidden="true">
                      {notification.title.includes("shared")
                        ? "↗"
                        : notification.title.includes("liked")
                          ? "♥"
                          : "◯"}
                    </span>
                    <div>
                      <b>{notification.title}</b>
                      <p>{notification.detail}</p>
                      <small>{formatPostTime(notification.createdAt)}</small>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}

          {(activePage === "HOME" || activePage === "NETWORK") && (
            <>
              <div className="liSort">
                <span>{feedView === "NETWORK" ? "Posts from the other role" : "Community posts"}</span>
                <span className="feed-sort-label">Latest</span>
              </div>
              {visiblePosts.length === 0 && !feedError && (
                <div className="liCard feed-empty">
                  {feedView === "NETWORK"
                    ? "There are no posts from the other professional role yet. Check back as your network grows."
                    : "There are no posts yet. Start the conversation with your community."}
                </div>
              )}
              {visiblePosts.map((post) => {
                const liked = post.likedBy.includes(memberKey);
                return (
                  <article className="liCard feed-post" id={`post-${post.id}`} key={post.id}>
                    <div className="postHead">
                      {post.role === "COMMUNITY" ? (
                        <div className="liAvatar">LS</div>
                      ) : post.author.toLowerCase() === userName.toLowerCase() ? (
                        <Link href={portalHref} aria-label="Open your profile">
                          <ProfileAvatar name={post.author} image={profilePhoto} completion={100} />
                        </Link>
                      ) : (
                        <ProfileAvatar name={post.author} completion={100} />
                      )}
                      <div className="feed-post-author">
                        <b>{post.author}</b>
                        <div className="postMeta">{formatRole(post.role)} · {formatPostTime(post.createdAt)}</div>
                      </div>
                    </div>
                    <p className="feed-post-text">{post.text}</p>
                    {post.image && (
                      <img className="feed-post-image" src={post.image} alt="Image attached to this professional update" />
                    )}
                    {post.tags.length > 0 && (
                      <div className="tagRow">{post.tags.map((tag) => <span className="feed-tag" key={tag}>{tag}</span>)}</div>
                    )}
                    {(post.likedBy.length > 0 || post.comments.length > 0) && (
                      <div className="feed-post-summary">
                        <span>{post.likedBy.length > 0 ? `♥ ${post.likedBy.length}` : ""}</span>
                        <span>{post.comments.length > 0 ? `${post.comments.length} ${post.comments.length === 1 ? "comment" : "comments"}` : ""}</span>
                      </div>
                    )}
                    <div className="liActions feed-post-actions">
                      <button type="button" className={liked ? "feed-action is-liked" : "feed-action"} aria-pressed={liked} onClick={() => toggleLike(post)}>
                        {liked ? "♥ Liked" : "♡ Like"}
                      </button>
                      <button
                        type="button"
                        className="feed-action"
                        aria-expanded={openComments === post.id}
                        onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                      >
                        ◯ Comment
                      </button>
                      <button type="button" className="feed-action" onClick={() => openShareDialog(post)}>
                        ↗ Share
                      </button>
                    </div>
                    {openComments === post.id && (
                      <div className="feed-comments">
                        {post.comments.map((comment) => (
                          <div className="feed-comment" key={comment.id}>
                            <b>{comment.author}</b>
                            <span className="postMeta">{formatRole(comment.role)} · {formatPostTime(comment.createdAt)}</span>
                            <p>{comment.text}</p>
                          </div>
                        ))}
                        <form className="feed-comment-form" onSubmit={(event) => addComment(event, post)}>
                          <label className="sr-only" htmlFor={`comment-${post.id}`}>Write a comment</label>
                          <input
                            id={`comment-${post.id}`}
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: event.target.value }))}
                            placeholder="Add to the conversation…"
                          />
                          <button className="primary" type="submit" disabled={!(commentDrafts[post.id] ?? "").trim()}>
                            Comment
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}
        </section>

        {activePage === "HOME" && <aside>
          <section className="liCard">
            <h3>{userRole === "STUDENT" ? "For law students" : "For advocates"}</h3>
            {userRole === "STUDENT" ? (
              <>
                <div className="feed-highlight"><b>Build your legal profile</b><span>Showcase your education, interests, and experience.</span></div>
                <div className="feed-highlight"><b>Learn from practitioners</b><span>Follow discussions and ask thoughtful questions.</span></div>
                <div className="feed-highlight"><b>Explore opportunities</b><span>Share your career goals with the community.</span></div>
              </>
            ) : (
              <>
                <div className="feed-highlight"><b>Share practice insights</b><span>Offer a perspective on research and advocacy.</span></div>
                <div className="feed-highlight"><b>Support future lawyers</b><span>Connect with students and share guidance.</span></div>
                <div className="feed-highlight"><b>Grow your network</b><span>Meet peers across practice areas.</span></div>
              </>
            )}
          </section>
          <section className="liCard feed-community-note">
            <b>A shared network</b>
            <p>Posts and interactions are shared between student and advocate accounts in this browser demo.</p>
          </section>
          <section className="liCard">
            <h3>Topics to explore</h3>
            <div className="feed-topic-list">
              <span>#LegalResearch</span>
              <span>#IndianLaw</span>
              <span>#MootCourt</span>
              <span>#PracticeInsights</span>
            </div>
          </section>
        </aside>}
      </div>

      {sharingPost && (
        <div className="feed-share-overlay">
          <section
            className="feed-share-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feed-share-heading"
          >
            <div className="feed-share-heading">
              <div>
                <h2 id="feed-share-heading">Share this post</h2>
                <p>Choose people in the legal forum to receive it in Messages.</p>
              </div>
              <button
                type="button"
                className="feed-share-close"
                aria-label="Close share dialog"
                onClick={() => setSharingPost(null)}
              >
                ×
              </button>
            </div>
            <div className="feed-share-preview">
              <b>{sharingPost.author}</b>
              <p>{sharingPost.text}</p>
            </div>
            <form onSubmit={sendPostShare}>
              <fieldset className="feed-share-recipients">
                <legend>Forum members</legend>
                {discoverableMembers.map((member) => {
                  const key = `${member.role}:${member.name.trim().toLowerCase()}`;
                  return (
                    <label className="feed-share-recipient" key={key}>
                      <input
                        type="checkbox"
                        checked={shareRecipientKeys.includes(key)}
                        onChange={() => toggleShareRecipient(member)}
                      />
                      <ProfileAvatar name={member.name} completion={100} />
                      <span>
                        <b>{member.name}</b>
                        <small>{formatRole(member.role)}</small>
                      </span>
                    </label>
                  );
                })}
                {discoverableMembers.length === 0 && (
                  <p className="feed-empty">No other forum members are available yet.</p>
                )}
              </fieldset>
              <label className="feed-share-note">
                <span>Add a message (optional)</span>
                <textarea
                  value={shareNote}
                  onChange={(event) => setShareNote(event.currentTarget.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Add a thought for the people you choose…"
                />
              </label>
              {shareError && <p className="feed-error" role="alert">{shareError}</p>}
              <div className="feed-share-actions">
                <button type="button" className="feed-share-cancel" onClick={() => setSharingPost(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={shareRecipientKeys.length === 0}>
                  Share in message{shareRecipientKeys.length > 1 ? "s" : ""}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
