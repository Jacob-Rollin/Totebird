"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FeedbackButton } from "@/components/feedback-button";
import { TotebirdLogo } from "@/components/logo";
import { SoftBoundary } from "@/components/soft-boundary";
import type { SessionUser } from "@/lib/auth";
import { hasClerkPublishable } from "@/lib/env-public";

const linkClass =
  "hover:text-[color:var(--tb-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tb-orange)]";

const menuItemClass =
  "block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[color:var(--tb-slate-soft)] hover:bg-[color:var(--tb-mist)] hover:text-[color:var(--tb-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tb-orange)]";

function LogOutControl({
  className,
  onAfterClick,
}: {
  className?: string;
  onAfterClick?: () => void;
}) {
  const button = (
    <button type="button" className={className} onClick={onAfterClick}>
      Log out
    </button>
  );

  if (!hasClerkPublishable()) {
    return (
      <Link href="/" className={className} onClick={onAfterClick}>
        Log out
      </Link>
    );
  }

  return (
    <SoftBoundary
      fallback={
        <Link href="/" className={className} onClick={onAfterClick}>
          Log out
        </Link>
      }
    >
      <SignOutButton redirectUrl="/">
        {button}
      </SignOutButton>
    </SoftBoundary>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-[color:var(--tb-slate)]"
    >
      {open ? (
        <>
          <path
            d="M4 4l12 12M16 4L4 16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function AppNav({
  user,
  section = "app",
}: {
  user: SessionUser;
  section?: "app" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, section, close]);

  useEffect(() => {
    if (!open) return;

    function dialogOpen() {
      return Boolean(document.querySelector("dialog[open]"));
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Let an open feedback dialog handle Escape first.
      if (dialogOpen()) return;
      e.preventDefault();
      close();
      buttonRef.current?.focus();
    }

    function onPointerDown(e: PointerEvent) {
      if (dialogOpen()) return;
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const appLinks = (
    <>
      <Link href="/app" className={linkClass}>
        Links
      </Link>
      <Link href="/app/links/new" className={linkClass}>
        New
      </Link>
      <Link href="/app/billing" className={linkClass}>
        Billing
      </Link>
      <Link href="/app/settings" className={linkClass}>
        Settings
      </Link>
      <Link href="/changelog" className={linkClass}>
        Changelog
      </Link>
    </>
  );

  const adminLinks = (
    <>
      <Link href="/admin" className={linkClass}>
        Overview
      </Link>
      <Link href="/admin/users" className={linkClass}>
        Users
      </Link>
      <Link href="/admin/links" className={linkClass}>
        Links
      </Link>
      <Link href="/admin/invoices" className={linkClass}>
        Invoices
      </Link>
      <Link href="/admin/feedback" className={linkClass}>
        Feedback
      </Link>
    </>
  );

  const mobileAppItems: ReactNode = (
    <>
      <Link href="/app" className={menuItemClass} onClick={close}>
        Links
      </Link>
      <Link href="/app/links/new" className={menuItemClass} onClick={close}>
        New
      </Link>
      <Link href="/app/billing" className={menuItemClass} onClick={close}>
        Billing
      </Link>
      <Link href="/app/settings" className={menuItemClass} onClick={close}>
        Settings
      </Link>
      <Link href="/changelog" className={menuItemClass} onClick={close}>
        Changelog
      </Link>
      {user.isAdmin && (
        <Link
          href="/admin"
          className={`${menuItemClass} text-[color:var(--tb-orange-deep)]`}
          onClick={close}
        >
          Admin
        </Link>
      )}
    </>
  );

  const mobileAdminItems: ReactNode = (
    <>
      <Link href="/admin" className={menuItemClass} onClick={close}>
        Overview
      </Link>
      <Link href="/admin/users" className={menuItemClass} onClick={close}>
        Users
      </Link>
      <Link href="/admin/links" className={menuItemClass} onClick={close}>
        Links
      </Link>
      <Link href="/admin/invoices" className={menuItemClass} onClick={close}>
        Invoices
      </Link>
      <Link href="/admin/feedback" className={menuItemClass} onClick={close}>
        Feedback
      </Link>
      <Link href="/app" className={menuItemClass} onClick={close}>
        Dashboard
      </Link>
    </>
  );

  return (
    <header
      ref={rootRef}
      className="relative border-b border-[color:var(--tb-line)] bg-white"
    >
      <div className="tb-shell flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <TotebirdLogo
            size="sm"
            variant="header"
            href={section === "admin" ? "/admin" : "/app"}
          />
          <nav
            className="hidden items-center gap-4 text-sm font-medium text-[color:var(--tb-slate-soft)] md:flex"
            aria-label={section === "admin" ? "Admin" : "App"}
          >
            {section === "app" ? appLinks : adminLinks}
          </nav>
        </div>

        <div className="hidden items-center gap-3 text-sm md:flex">
          {section === "app" && <FeedbackButton />}
          {user.isAdmin && section === "app" && (
            <Link
              href="/admin"
              className="font-medium text-[color:var(--tb-orange-deep)]"
            >
              Admin
            </Link>
          )}
          {section === "admin" && (
            <Link
              href="/app"
              className="font-medium text-[color:var(--tb-slate-soft)]"
            >
              Dashboard
            </Link>
          )}
          <span className="max-w-[180px] truncate text-[color:var(--tb-slate-soft)]">
            {user.email}
          </span>
          <LogOutControl className="font-medium text-[color:var(--tb-slate-soft)] hover:text-[color:var(--tb-ink)]" />
        </div>

        <button
          ref={buttonRef}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[color:var(--tb-slate)] hover:bg-[color:var(--tb-mist)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tb-orange)] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <HamburgerIcon open={open} />
        </button>
      </div>

      {open ? (
        <nav
          id={menuId}
          aria-label="Mobile"
          className="absolute inset-x-0 top-full z-40 border-b border-[color:var(--tb-line)] bg-white md:hidden"
        >
          <div className="tb-shell flex flex-col gap-0.5 py-2 pb-3">
            <p className="truncate px-3 pb-1 pt-1 text-xs text-[color:var(--tb-slate-soft)]">
              {user.email}
            </p>
            {section === "app" ? mobileAppItems : mobileAdminItems}
            {section === "app" && (
              <FeedbackButton className={menuItemClass} />
            )}
            <div className="my-1 border-t border-[color:var(--tb-line)]" />
            <LogOutControl
              className={`${menuItemClass} text-[color:var(--tb-ink)]`}
              onAfterClick={close}
            />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
