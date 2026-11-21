"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { NAV_ITEMS } from "@/lib/navigation";
import { useProfessionalSession } from "@/components/ProfessionalSession";
import {
  getUnreadProfessionalNotificationCount,
  PROFESSIONAL_NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/professional-content";

type UserRole = "STUDENT" | "ADVOCATE" | "LAW_FIRM" | "ADMIN" | "CLIENT";

type SignedInProfile = {
  name: string;
  role: UserRole | "";
  avatar: string;
  completion: number;
};

function isUserRole(role: string): role is UserRole {
  return role === "STUDENT" || role === "ADVOCATE" || role === "LAW_FIRM" || role === "ADMIN" || role === "CLIENT";
}

type NetworkDestination =
  | "home"
  | "network"
  | "jobs"
  | "verification"
  | "appointments"
  | "messaging"
  | "notifications"
  | "me";

function NetworkIcon({ name }: { name: Exclude<NetworkDestination, "me"> | "search" }) {
  if (name === "home") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7M5 9v11h14V9m-9 11v-6h4v6" /></svg>;
  }
  if (name === "network") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0m.5-4a4.5 4.5 0 0 1 6 4" /></svg>;
  }
  if (name === "jobs") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2" /></svg>;
  }
  if (name === "messaging") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8m-8 3h5" /></svg>;
  }
  if (name === "notifications") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg>;
  }
  if (name === "verification") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 7 3v5c0 4.7-3 8-7 10-4-2-7-5.3-7-10V6z" /><path d="m9 11.5 2 2 4-4" /></svg>;
  }
  if (name === "appointments") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="15" rx="2" /><path d="M8 3v5m8-5v5M4 10h16m-11 4h2m3 0h2m-7 3h2" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<SignedInProfile>({
    name: "",
    role: "",
    avatar: "",
    completion: 0,
  });
  const [activeNetworkDestination, setActiveNetworkDestination] =
    useState<NetworkDestination>("home");
  const [feedSearch, setFeedSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  const isProfessionalNetworkPage =
    pathname.startsWith("/feed") || pathname === "/student" || pathname === "/advocate" || pathname === "/firm";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncProfile = () => {
      const savedRole = window.localStorage.getItem("lex-supermus-user-role") ?? "";
      const completion = Number(
        window.localStorage.getItem("lex-supermus-profile-completion") ?? "0"
      );
      setProfile({
        name: window.localStorage.getItem("lex-supermus-user-name") ?? "",
        role: isUserRole(savedRole) ? savedRole : "",
        avatar: window.localStorage.getItem("lex-supermus-user-avatar") ?? "",
        completion: Number.isFinite(completion) ? completion : 0,
      });
    };

    syncProfile();
    window.addEventListener("lex-auth-updated", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("lex-auth-updated", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  useEffect(() => {
    const syncNotifications = () => {
      try {
        setUnreadNotifications(getUnreadProfessionalNotificationCount());
        setNotificationError("");
      } catch (error) {
        setUnreadNotifications(0);
        setNotificationError(
          error instanceof Error ? error.message : "Notification status could not be loaded.",
        );
      }
    };

    syncNotifications();
    window.addEventListener(PROFESSIONAL_NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
    window.addEventListener("storage", syncNotifications);
    return () => {
      window.removeEventListener(PROFESSIONAL_NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  useEffect(() => {
    if (!isProfessionalNetworkPage) return;
    const syncDestination = () => {
      const hash = window.location.hash.slice(1);
      if (pathname === "/student" || pathname === "/advocate" || pathname === "/firm") {
        const destinationByHash: Record<string, NetworkDestination> = {
          jobs: "jobs",
          resume: "jobs",
          applications: "jobs",
          verification: "verification",
          appointments: "appointments",
        };
        setActiveNetworkDestination(destinationByHash[hash] ?? "me");
      } else {
        const validDestinations: NetworkDestination[] = [
          "home",
          "network",
          "messaging",
          "notifications",
        ];
        setActiveNetworkDestination(
          validDestinations.includes(hash as NetworkDestination)
            ? hash as NetworkDestination
            : "home",
        );
        setFeedSearch(new URLSearchParams(window.location.search).get("search") ?? "");
      }
    };

    syncDestination();
    window.addEventListener("hashchange", syncDestination);
    window.addEventListener("popstate", syncDestination);
    return () => {
      window.removeEventListener("hashchange", syncDestination);
      window.removeEventListener("popstate", syncDestination);
    };
  }, [isProfessionalNetworkPage, pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const profileHref = profile.role === "CLIENT"
    ? "/client"
    : profile.role === "STUDENT"
      ? "/student"
      : profile.role === "LAW_FIRM"
        ? "/firm"
        : profile.role === "ADMIN"
          ? "/admin"
          : "/advocate";

  function handleLogout() {
    [
      "lex-supermus-user-name",
      "lex-supermus-user-role",
      "lex-supermus-user-avatar",
      "lex-supermus-profile-completion",
    ].forEach((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event("lex-auth-updated"));
    router.push("/");
  }

  function submitFeedSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = feedSearch.trim();
    window.location.assign(query
      ? `/feed?search=${encodeURIComponent(query)}#network`
      : "/feed#network");
  }

  function navigateWithinFeed(
    event: MouseEvent<HTMLAnchorElement>,
    destination: NetworkDestination,
    href: string,
  ) {
    setMenuOpen(false);
    if (
      (pathname === "/student" || pathname === "/advocate") &&
      destination === "me"
    ) {
      event.preventDefault();
      if (window.location.hash) window.location.hash = "";
      setActiveNetworkDestination("me");
      return;
    }

    const isPortalDestination =
      destination === "jobs" ||
      (pathname === "/advocate" &&
        (destination === "verification" || destination === "appointments"));
    if ((pathname === "/student" || pathname === "/advocate") && isPortalDestination) {
      event.preventDefault();
      const hash = new URL(href, window.location.origin).hash;
      if (window.location.hash !== hash) window.location.hash = hash;
      setActiveNetworkDestination(destination);
      return;
    }

    const feedDestination =
      destination === "home" ||
      destination === "network" ||
      destination === "messaging" ||
      destination === "notifications";
    if (pathname !== "/feed" || !feedDestination) return;
    event.preventDefault();
    window.history.pushState(null, "", href);
    setActiveNetworkDestination(destination);
    window.dispatchEvent(
      new CustomEvent("professional-feed:navigate", { detail: destination.toUpperCase() }),
    );
  }

  function renderNetworkLink(
    destination: NetworkDestination,
    label: string,
    href: string,
  ) {
    const active = activeNetworkDestination === destination;
    const notificationLabel = notificationError
      ? `${label}. Status unavailable: ${notificationError}`
      : unreadNotifications > 0
        ? `${label}, ${unreadNotifications} unread`
        : label;
    return (
      <Link
        key={destination}
        href={href}
        className={`professional-nav-item${active ? " active" : ""}`}
        aria-current={active ? "page" : undefined}
        aria-label={destination === "notifications" ? notificationLabel : undefined}
        title={destination === "notifications" ? notificationLabel : undefined}
        onClick={(event) => navigateWithinFeed(event, destination, href)}
      >
        {destination !== "me" ? (
          <NetworkIcon name={destination} />
        ) : profile.name ? (
          <ProfileAvatar
            name={profile.name}
            image={profile.avatar}
            completion={profile.completion}
          />
        ) : (
          <span className="professional-nav-me-icon" aria-hidden="true">♙</span>
        )}
        <span>{label}</span>
        {destination === "notifications" && unreadNotifications > 0 && (
          <span className="professional-notification-badge" aria-hidden="true">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        )}
      </Link>
    );
  }

  return (
    <header
      className={`site-header${isProfessionalNetworkPage ? ` site-header--professional${profile.role === "ADVOCATE" ? " site-header--advocate" : ""}` : ""}${menuOpen ? " site-header--menu-open" : ""}`}
    >
      <Link href="/" className="brand" style={{ textDecoration: "none" }}>
        <span className="mark" aria-hidden="true">⚖</span>
        <div>
          <b>LEX SUPERMUS</b>
          <small>WHERE LAW MEETS INTELLIGENCE</small>
        </div>
      </Link>
      <button
        type="button"
        className="site-menu-toggle"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="site-header-navigation"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      {isProfessionalNetworkPage ? (
        <div
          id="site-header-navigation"
          className="site-header-navigation site-header-navigation--professional"
        >
          <form className="professional-header-search" role="search" onSubmit={submitFeedSearch}>
            <NetworkIcon name="search" />
            <input
              type="search"
              aria-label="Search people and posts"
              placeholder="Search people or posts"
              value={feedSearch}
              onChange={(event) => setFeedSearch(event.currentTarget.value)}
            />
          </form>
          <nav
            className={`professional-topnav${profile.role === "ADVOCATE" ? " professional-topnav--advocate" : ""}`}
            aria-label="Professional network"
          >
            {renderNetworkLink("home", "Home", "/feed#home")}
            {renderNetworkLink("network", "Network", "/feed#network")}
            {renderNetworkLink(
              "jobs",
              "Jobs",
              profile.role === "ADVOCATE"
                ? "/advocate#jobs"
                : profile.role === "LAW_FIRM"
                  ? "/firm#work"
                  : "/student#jobs",
            )}
            {profile.role === "ADVOCATE" && (
              <>
                {renderNetworkLink("verification", "Bar Council Verification", "/advocate#verification")}
                {renderNetworkLink("appointments", "Appointments", "/advocate#appointments")}
              </>
            )}
            {renderNetworkLink("messaging", "Messaging", "/feed#messaging")}
            {renderNetworkLink("notifications", "Notifications", "/feed#notifications")}
            {profile.name && profile.role
              ? renderNetworkLink("me", "Me", profileHref)
              : <Link className="professional-nav-login" href="/login">Sign in</Link>}
            {profile.name && profile.role && (
              <button
                type="button"
                className="professional-nav-logout"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      ) : (
        <nav
          id="site-header-navigation"
          className="site-header-navigation site-header-navigation--primary"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              className={`navbtn${isActive(item.href) ? " active" : ""}`}
              data-page={item.page}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {(profile.role === "STUDENT" || profile.role === "ADVOCATE" || profile.role === "LAW_FIRM") && (
            <Link
              href="/feed"
              className={`navbtn${isActive("/feed") ? " active" : ""}`}
              aria-current={isActive("/feed") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Professional feed
            </Link>
          )}

          {profile.name && profile.role ? (
            <>
              <Link
                href={profileHref}
                className="nav-profile-link"
                aria-label={`My profile: ${profile.name}, ${profile.role.toLowerCase()}, ${profile.completion}% complete`}
                title={`My profile · ${profile.completion}% complete`}
                onClick={() => setMenuOpen(false)}
              >
                <ProfileAvatar
                  name={profile.name}
                  image={profile.avatar}
                  completion={profile.completion}
                />
                <span className="nav-profile-label">My profile</span>
                <span className="nav-profile-percent">{profile.completion}%</span>
              </Link>
              <button type="button" className="navbtn nav-login-btn" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`navbtn nav-login-btn${pathname.startsWith("/login") ? " nav-login-btn--active" : ""}`}
              data-page="login"
              title="Student and advocate sign in or register"
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-login-label">Login</span>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
