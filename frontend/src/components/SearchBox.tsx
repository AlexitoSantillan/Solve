import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useSearch } from "../hooks/useSearch";
import { placeSubtitle } from "../lib/format";
import type { Place } from "../types";

export function SearchBox({ onSelect }: { onSelect: (p: Place) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { results, loading, error, searched } = useSearch(query);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => setActive(-1), [results]);

  function choose(p: Place) {
    onSelect(p);
    setQuery("");
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const target = results[active >= 0 ? active : 0];
      if (target) choose(target);
    }
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div className="search" ref={wrapRef}>
      <label className="search-field">
        {loading ? <Loader2 size={18} className="spin" aria-hidden /> : <Search size={18} aria-hidden />}
        <input
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-results"
          aria-label="Buscar ciudad"
          placeholder="Buscar ciudad o localidad..."
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
      </label>
      {showList && (
        <ul className="search-results" id="search-results" role="listbox">
          {error && <li className="search-note">{error}</li>}
          {!error && searched && !loading && results.length === 0 && (
            <li className="search-note">Sin resultados para "{query.trim()}".</li>
          )}
          {results.map((p, i) => (
            <li key={`${p.latitude},${p.longitude},${i}`} role="option" aria-selected={i === active}>
              <button className={i === active ? "is-active" : ""} onClick={() => choose(p)} onMouseEnter={() => setActive(i)}>
                <MapPin size={15} aria-hidden />
                <span>
                  <strong>{p.name}</strong>
                  <small>{placeSubtitle(p) || `${p.latitude.toFixed(2)}°, ${p.longitude.toFixed(2)}°`}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
