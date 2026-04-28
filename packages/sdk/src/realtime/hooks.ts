"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface HotspotStatus {
  hotspotId: string;
  isOnline: boolean;
  uptimePercent: number;
  activeSubscriptions: number;
  bandwidthMbps: number;
  lastSeen: Date;
}

export interface OperatorNotification {
  id: string;
  type: "REWARD" | "DOWNTIME" | "NEW_SUBSCRIBER" | "DISPUTE" | "SYSTEM";
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export interface NetworkStats {
  totalHotspots: number;
  activeHotspots: number;
  totalSubscribers: number;
  totalEnergyKwh: number;
  totalHBARStaked: number;
  avgUptimePercent: number;
}

export interface TradeStatus {
  tradeId: string;
  status: "PENDING" | "CONFIRMED" | "DISPUTED" | "RESOLVED" | "CANCELLED";
  updatedAt: Date;
}

// -----------------------------------------------------------------------
// useHotspotStatus
// -----------------------------------------------------------------------

/**
 * Polls the API for a hotspot's live status.
 * @param hotspotId ID to poll. Pass null to disable.
 * @param intervalMs Polling interval. Defaults to 10 s.
 */
export function useHotspotStatus(
  hotspotId: string | null,
  intervalMs = 10_000,
): { data: HotspotStatus | null; isLoading: boolean; error: string | null } {
  const [data, setData] = useState<HotspotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchStatus = useCallback(async () => {
    if (!hotspotId) return;
    try {
      const res = await fetch(`/api/hotspots/${hotspotId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: HotspotStatus };
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [hotspotId]);

  useEffect(() => {
    if (!hotspotId) return;
    setIsLoading(true);
    void fetchStatus();
    timerRef.current = setInterval(fetchStatus, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [hotspotId, intervalMs, fetchStatus]);

  return { data, isLoading, error };
}

// -----------------------------------------------------------------------
// useOperatorNotifications
// -----------------------------------------------------------------------

/**
 * Polls the API for operator notifications.
 */
export function useOperatorNotifications(operatorId: string | null): {
  notifications: OperatorNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
} {
  const [notifications, setNotifications] = useState<OperatorNotification[]>([]);

  useEffect(() => {
    if (!operatorId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/operators/${operatorId}/notifications`);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { data: OperatorNotification[] };
        setNotifications(json.data);
      } catch {
        // silently ignore polling errors
      }
    };

    void poll();
    const timer = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [operatorId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, markAsRead };
}

// -----------------------------------------------------------------------
// useNetworkStats
// -----------------------------------------------------------------------

/** Fetches and caches global network statistics. */
export function useNetworkStats(refreshInterval = 60_000): {
  stats: NetworkStats | null;
  isLoading: boolean;
} {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetch_ = async () => {
      try {
        const res = await fetch("/api/network/stats");
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { data: NetworkStats };
        setStats(json.data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetch_();
    const timer = setInterval(fetch_, refreshInterval);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshInterval]);

  return { stats, isLoading };
}

// -----------------------------------------------------------------------
// useTradeStatus
// -----------------------------------------------------------------------

/** Polls a trade's status until it reaches a terminal state. */
export function useTradeStatus(tradeId: string | null): {
  status: TradeStatus | null;
  isLoading: boolean;
} {
  const [status, setStatus] = useState<TradeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    let cancelled = false;

    const TERMINAL = new Set(["CONFIRMED", "RESOLVED", "CANCELLED"]);

    const poll = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/energy/trade/${tradeId}`);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { data: TradeStatus };
        setStatus(json.data);
        if (TERMINAL.has(json.data.status)) {
          clearInterval(timer);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void poll();
    const timer = setInterval(poll, 5_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tradeId]);

  return { status, isLoading };
}
