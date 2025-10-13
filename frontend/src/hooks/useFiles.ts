// src/hooks/useFiles.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { listMyFiles } from "../api/filesApi";

type Params = {
  page: number;
  limit: number;
  sort?: string; // e.g. "createdAt:desc"
  q?: string;
  type?: string; // "image" | "video" | "audio" | "doc" | undefined
};

export function useFiles(initial?: Partial<Params>) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, _setPage] = useState(initial?.page ?? 1);
  const [limit, setLimit] = useState(initial?.limit ?? 10);
  const [sort, setSort] = useState(initial?.sort ?? "createdAt:desc");
  const [q, _setQuery] = useState(initial?.q ?? "");
  const [type, _setType] = useState(initial?.type ?? undefined);

  // guards
  const inflight = useRef(false);
  const mounted = useRef(false);

  const params: Params = useMemo(
    () => ({ page, limit, sort, q, type }),
    [page, limit, sort, q, type]
  );

  const fetchOnce = async (p: Params) => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const res = await listMyFiles(p);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  };

  const refresh = () => fetchOnce(params);

  // mount + react to param changes
  useEffect(() => {
    mounted.current = true;
    fetchOnce(params);
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sort, q, type]);

  // listen to global refresh event (e.g., after upload)
  useEffect(() => {
    const onRefresh = () => {
      if (!mounted.current) return;
      refresh();
    };
    window.addEventListener("files:refresh", onRefresh);
    return () => window.removeEventListener("files:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // public setters (stable)
  const setQuery = (nextQ: string) => {
    _setQuery(nextQ);
    _setPage(1);
  };
  const setType = (nextType?: string) => {
    _setType(nextType || undefined);
    _setPage(1);
  };
  const setPage = (next: number) => _setPage(Math.max(1, next));

  // derived
  const pageCount = Math.max(1, Math.ceil((total || 0) / (limit || 1)));

  return {
    // data
    files: items,          // 👈 alias for consumers that expect `files`
    items,                 // (keep original too, in case you need it elsewhere)
    total,
    loading,

    // params
    page,
    limit,
    sort,
    q,
    type,

    // derived
    pageCount,

    // setters
    setQuery,
    setType,
    setPage,
    setLimit,
    setSort,

    // actions
    refresh,
  };
}