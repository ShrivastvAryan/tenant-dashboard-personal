"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const SEARCH_EVENT = "tenant-dashboard-search-change";

function readQueryFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

export function useDashboardSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setLocalQuery] = useState("");

  useEffect(() => {
    setLocalQuery(readQueryFromUrl());
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSearchChange = () => {
      setLocalQuery(readQueryFromUrl());
    };

    window.addEventListener(SEARCH_EVENT, handleSearchChange);
    window.addEventListener("popstate", handleSearchChange);

    return () => {
      window.removeEventListener(SEARCH_EVENT, handleSearchChange);
      window.removeEventListener("popstate", handleSearchChange);
    };
  }, []);

  const setQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setLocalQuery(trimmed);

      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SEARCH_EVENT));
      }
    },
    [pathname, router]
  );

  return { query, setQuery };
}
