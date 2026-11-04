import { useEffect, useState } from "react";

const LIST_KEY = "magnolia-lowes-list";
const STOCK_KEY = "magnolia-inventory";

type Row = { id: string; name: string; qty: string };

function loadList(): Row[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]") as Row[];
    return Array.isArray(raw) ? raw.filter((row) => row && typeof row.name === "string") : [];
  } catch {
    return [];
  }
}

function missingStock(): string[] {
  try {
    const stock = JSON.parse(localStorage.getItem(STOCK_KEY) ?? "{}") as Record<string, { name?: string; qty?: string; inStock?: boolean }[]>;
    const names: string[] = [];
    for (const rows of Object.values(stock)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (row?.inStock === false && row.name) names.push(row.name);
      }
    }
    return names;
  } catch {
    return [];
  }
}

function shopUrl(term: string) {
  return `https://www.lowes.com/search?searchTerm=${encodeURIComponent(term.trim())}`;
}

export function LowesShop() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>(loadList);
  const [needed, setNeeded] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(LIST_KEY, JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    setNeeded(missingStock());
  }, []);

  function add(name: string) {
    const next = name.trim();
    if (!next) return;
    setRows((current) => [{ id: crypto.randomUUID(), name: next, qty: "1" }, ...current]);
    setQuery("");
  }

  return (
    <section className="lowes-widget" aria-label="Lowe's shopping">
      <header className="lowes-head">
        <div>
          <p className="eyebrow">LOWE'S</p>
          <h2>Shopping</h2>
        </div>
        <a className="business-secondary" href="https://www.lowes.com/" target="_blank" rel="noreferrer">
          Open Lowe's
        </a>
      </header>
      <form
        className="lowes-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!query.trim()) return;
          window.open(shopUrl(query), "_blank", "noopener,noreferrer");
        }}
      >
        <input value={query} placeholder="Search Lowe's" aria-label="Search Lowe's" onChange={(event) => setQuery(event.target.value)} />
        <button className="business-secondary" type="submit">Search</button>
        <button className="business-primary" type="button" onClick={() => add(query)}>Add</button>
      </form>
      {needed.length ? (
        <div className="lowes-needed">
          <span>Out of stock</span>
          {needed.map((name) => (
            <button key={name} type="button" onClick={() => add(name)}>{name}</button>
          ))}
        </div>
      ) : null}
      {rows.length ? (
        <ul className="lowes-list">
          {rows.map((row) => (
            <li key={row.id}>
              <input
                value={row.name}
                aria-label="Item"
                onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))}
              />
              <input
                className="lowes-qty"
                inputMode="numeric"
                value={row.qty}
                aria-label="Quantity"
                onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, qty: event.target.value } : item)))}
              />
              <a href={shopUrl(row.name)} target="_blank" rel="noreferrer">Find</a>
              <button type="button" className="doc-remove" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="quiet">Add a part, or search Lowe's and it opens in a new tab.</p>
      )}
    </section>
  );
}
