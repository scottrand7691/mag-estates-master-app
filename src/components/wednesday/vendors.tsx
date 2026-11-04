import { useEffect, useState } from "react";
import { logAudit } from "./audit";

type Doc = { uploaded?: string; expires?: string; provider?: string; number?: string; fileName?: string; file?: string };
type Vendor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  trade: string;
  notes: string;
  liability: Doc;
  license: Doc;
  workersComp: Doc;
};

const KEY = "magnolia-vendors";
const YEAR = 365 * 86400000;

function load(): Vendor[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Vendor[];
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* use the starter vendor */
  }
  return [{
    id: "cool-cat-pat",
    name: "Cool Cat Pat AC Repair",
    phone: "",
    email: "",
    trade: "AC",
    notes: "Default AC vendor",
    liability: {},
    license: {},
    workersComp: {},
  }];
}

export function vendorList() {
  return load();
}

function stamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function expires(uploaded?: string) {
  if (!uploaded) return "";
  return new Date(new Date(uploaded).getTime() + YEAR).toISOString().slice(0, 10);
}

function status(doc: Doc) {
  if (!doc.uploaded && !doc.fileName) return "missing";
  const end = doc.expires || expires(doc.uploaded);
  const left = (new Date(end).getTime() - Date.now()) / 86400000;
  if (left < 0) return "expired";
  if (left <= 30) return "expiring";
  return "current";
}

const DOC_LABEL = { liability: "Liability", license: "License", workersComp: "Workers Comp" } as const;

export function vendorTodoItems() {
  return load().flatMap((vendor) =>
    (["liability", "license", "workersComp"] as const).flatMap((key) => {
      if (status(vendor[key]) !== "missing") return [];
      return [{
        id: `vendor-${vendor.id}-${key}`,
        lot: "",
        address: "",
        street: "",
        name: vendor.name || "Vendor",
        notes: "Vendor document",
        text: `Upload ${DOC_LABEL[key]} for ${vendor.name || "vendor"}`,
        date: stamp(),
      }];
    }),
  );
}

export function VendorDirectory() {
  const [vendors, setVendors] = useState<Vendor[]>(load);
  const [approvedOnly, setApprovedOnly] = useState(false);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(vendors));
  }, [vendors]);
  const approved = (vendor: Vendor) => status(vendor.liability) === "current" && status(vendor.license) === "current" && status(vendor.workersComp) === "current";
  const shown = approvedOnly ? vendors.filter(approved) : vendors;
  function add() {
    logAudit("Website", "Added a vendor");
    setVendors((current) => [{ id: crypto.randomUUID(), name: "New vendor", phone: "", email: "", trade: "", notes: "", liability: {}, license: {}, workersComp: {} }, ...current]);
  }
  function patch(id: string, next: Partial<Vendor>) {
    setVendors((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }
  function upload(id: string, key: "liability" | "license" | "workersComp", file: File) {
    const vendor = vendors.find((item) => item.id === id);
    const doc = vendor?.[key] ?? {};
    const uploaded = stamp();
    const reader = new FileReader();
    reader.onload = () => {
      logAudit("Website", `Uploaded ${DOC_LABEL[key]} for ${vendor.name}`);
      patch(id, { [key]: { ...doc, uploaded, expires: expires(uploaded), fileName: file.name, file: String(reader.result ?? "") } });
    };
    reader.onerror = () => {
      patch(id, { [key]: { ...doc, uploaded, expires: expires(uploaded), fileName: file.name } });
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="vendor-board">
      <header className="home-head">
        <div>
          <p className="eyebrow">COMPLIANCE</p>
          <h2>Approved vendors</h2>
        </div>
        <div className="business-heading-actions">
          <button type="button" className="business-secondary" onClick={() => setApprovedOnly((on) => !on)}>{approvedOnly ? "Show all" : "Approved only"}</button>
          <button type="button" className="business-primary" onClick={add}>+ Vendor</button>
        </div>
      </header>
      <p className="quiet">Liability, business license, and workers' comp are good for one year from the upload date.</p>
      <div className="vendor-list">
        {shown.map((vendor) => (
          <article key={vendor.id} className={approved(vendor) ? "vendor-card is-approved" : "vendor-card"}>
            <input value={vendor.name} onChange={(e) => patch(vendor.id, { name: e.target.value })} />
            <div className="vendor-meta">
              <input value={vendor.trade} placeholder="Trade" onChange={(e) => patch(vendor.id, { trade: e.target.value })} />
              <input value={vendor.phone} placeholder="Phone" onChange={(e) => patch(vendor.id, { phone: e.target.value })} />
              <input value={vendor.email} placeholder="Email" onChange={(e) => patch(vendor.id, { email: e.target.value })} />
            </div>
            {(["liability", "license", "workersComp"] as const).map((key) => {
              const label = DOC_LABEL[key];
              const doc = vendor[key];
              return (
                <div key={key} className={`vendor-doc is-${status(doc)}`}>
                  <span>{label}</span>
                  <label className="business-secondary vendor-file">
                    {doc.fileName ? "Replace" : "Upload"}
                    <input
                      hidden
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) upload(vendor.id, key, file);
                      }}
                    />
                  </label>
                  {doc.file ? (
                    <a href={doc.file} download={doc.fileName || label}>{doc.fileName}</a>
                  ) : doc.fileName ? (
                    <small>{doc.fileName}</small>
                  ) : (
                    <small>Missing · added to To-Do</small>
                  )}
                  <small>{doc.expires ? `Expires ${doc.expires}` : status(doc)}</small>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </div>
  );
}

export function VendorPortal({ vendorId }: { vendorId: string }) {
  const [vendors, setVendors] = useState<Vendor[]>(load);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(vendors));
  }, [vendors]);
  const vendor = vendors.find((item) => item.id === vendorId);
  function upload(key: "liability" | "license" | "workersComp", file: File) {
    if (!vendor) return;
    const doc = vendor[key] ?? {};
    const uploaded = stamp();
    const reader = new FileReader();
    reader.onload = () => {
      logAudit("Website", `Uploaded ${label} for ${vendor.name}`);
      setVendors((current) => current.map((item) => (item.id === vendor.id ? { ...item, [key]: { ...doc, uploaded, expires: expires(uploaded), fileName: file.name, file: String(reader.result ?? "") } } : item)));
    };
    reader.readAsDataURL(file);
  }
  if (!vendor) return <p className="quiet">This vendor sign-in is no longer on file.</p>;
  return (
    <div className="vendor-board">
      <header className="home-head">
        <div>
          <p className="eyebrow">VENDOR</p>
          <h2>{vendor.name}</h2>
        </div>
      </header>
      <p className="quiet">Upload and view liability, license, and workers comp only.</p>
      <article className="vendor-card">
        {(["liability", "license", "workersComp"] as const).map((key) => {
          const label = DOC_LABEL[key];
          const doc = vendor[key];
          return (
            <div key={key} className={`vendor-doc is-${status(doc)}`}>
              <span>{label}</span>
              <label className="business-secondary vendor-file">
                {doc.fileName ? "Replace" : "Upload"}
                <input
                  hidden
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) upload(key, file);
                  }}
                />
              </label>
              {doc.file ? <a href={doc.file} download={doc.fileName || label}>{doc.fileName}</a> : <small>{doc.fileName || "Nothing uploaded yet"}</small>}
              <small>{doc.expires ? `Expires ${doc.expires}` : status(doc)}</small>
            </div>
          );
        })}
      </article>
    </div>
  );
}
