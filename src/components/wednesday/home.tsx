import { useEffect, useState } from "react";
import { buildTodo, type Lot } from "@/data/lots";

type Choice = { id: string; page: string; title: string; view: string };

const CHOICES: Choice[] = [
  { id: "map", page: "Maps", title: "Maps", view: "map" },
  { id: "meeting", page: "Meeting", title: "Meeting notes", view: "meeting" },
  { id: "todo", page: "To-Do", title: "Open to-dos", view: "todo" },
  { id: "mow", page: "Mow", title: "Mow list", view: "mow" },
  { id: "owe-mow", page: "Mow", title: "Owe-Mow", view: "mow" },
  { id: "business", page: "Business", title: "Business tasks", view: "business" },
  { id: "heat", page: "Financial", title: "Monthly rent", view: "heat" },
  { id: "work", page: "Maintenance", title: "Work orders", view: "handyman" },
  { id: "inv-ac", page: "Maintenance", title: "AC parts", view: "handyman" },
  { id: "inv-plumbing", page: "Maintenance", title: "Plumbing", view: "handyman" },
  { id: "inv-wood", page: "Maintenance", title: "Wood", view: "handyman" },
  { id: "inv-roofing", page: "Maintenance", title: "Roofing", view: "handyman" },
  { id: "inv-paint", page: "Maintenance", title: "Paint", view: "handyman" },
  { id: "inv-handyman", page: "Maintenance", title: "Handyman supplies", view: "handyman" },
  { id: "inv-mowing", page: "Maintenance", title: "Mowing supplies", view: "handyman" },
  { id: "plant-pumps", page: "Treatment Plant", title: "Pumps", view: "plant" },
  { id: "plant-samples", page: "Treatment Plant", title: "Samples", view: "plant" },
  { id: "plant-chlorine", page: "Treatment Plant", title: "Chlorine pump", view: "plant" },
  { id: "plant-weather", page: "Treatment Plant", title: "Weather gauge", view: "plant" },
  { id: "plant-camera", page: "Treatment Plant", title: "Camera", view: "plant" },
  { id: "plant-report", page: "Treatment Plant", title: "Treatment report", view: "plant" },
  { id: "plant-generator", page: "Treatment Plant", title: "Generator", view: "plant" },
  { id: "plant-clog", page: "Treatment Plant", title: "Last pump clog", view: "plant" },
  { id: "vendors", page: "Vendors", title: "Vendor documents", view: "vendors" },
  { id: "register", page: "Register", title: "Lot register", view: "register" },
  { id: "audit", page: "Audit", title: "Audit log", view: "audit" },
];

const SLOT_KEY = "magnolia-home-slots";
const PAGES = [...new Set(CHOICES.map((choice) => choice.page))];

function loadSlots(): (string | null)[] {
  try {
    const saved = JSON.parse(localStorage.getItem(SLOT_KEY) ?? "null");
    if (Array.isArray(saved) && saved.length >= 4) {
      return saved.map((id) => (typeof id === "string" && CHOICES.some((choice) => choice.id === id) ? id : null));
    }
  } catch {
    /* start empty */
  }
  return [null, null, null, null];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

export function HomeBoard({ lots, onOpen }: { lots: Lot[]; onOpen: (id: string) => void }) {
  const [slots, setSlots] = useState<(string | null)[]>(loadSlots);

  useEffect(() => {
    localStorage.setItem(SLOT_KEY, JSON.stringify(slots));
  }, [slots]);

  function setSlot(index: number, id: string | null) {
    setSlots((current) => current.map((slot, i) => (i === index ? id : slot)));
  }

  return (
    <div className="home-board">
      <header className="home-head">
        <div>
          <p className="eyebrow">HOME</p>
          <h2>Magnolia Estates</h2>
        </div>
      </header>
      <div className="home-grid home-slots">
        {slots.map((id, index) => {
          const choice = CHOICES.find((item) => item.id === id);
          return (
            <article key={index} className={choice ? "home-slot is-filled" : "home-slot"}>
              {choice ? (
                <>
                  <div className="home-slot-head">
                    <div>
                      <small>{choice.page}</small>
                      <strong>{choice.title}</strong>
                    </div>
                    <button type="button" className="business-secondary" onClick={() => setSlot(index, null)}>
                      Remove
                    </button>
                  </div>
                  <TileBody id={choice.id} lots={lots} />
                  <button type="button" className="business-primary" onClick={() => onOpen(choice.view)}>
                    Open {choice.page}
                  </button>
                </>
              ) : (
                <label className="home-slot-add">
                  Add a tile
                  <select value="" onChange={(e) => setSlot(index, e.target.value || null)}>
                    <option value="">Choose from a page</option>
                    {PAGES.map((page) => (
                      <optgroup key={page} label={page}>
                        {CHOICES.filter((item) => item.page === page).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}
            </article>
          );
        })}
      </div>
      <button type="button" className="home-add-tile" onClick={() => setSlots((current) => [...current, null])}>
        Add tile
      </button>
    </div>
  );
}

function TileBody({ id, lots }: { id: string; lots: Lot[] }) {
  const plant = readJson<Record<string, unknown>>("magnolia-treatment-plant", {});
  const stock = readJson<Record<string, { name: string; qty: string; inStock?: boolean }[]>>("magnolia-inventory", {});
  if (id === "map") return <p className="home-slot-copy">Main map, Jaleen/Denise, Denise/Leon, and Michelle/Kirkwood.</p>;
  if (id === "meeting") {
    const notes = readJson<{ text?: string; kind?: string }[]>("magnolia-meeting-board", []);
    const latest = notes.find((note) => note.text?.trim());
    return <p className="home-slot-copy">{latest?.text || "No meeting notes yet."}</p>;
  }
  if (id === "todo") return <p className="home-slot-copy">{buildTodo(lots).length} open to-dos</p>;
  if (id === "mow") {
    const unmowed = lots.filter((lot) => lot.noMow === "Unmowed").length;
    const yes = lots.filter((lot) => lot.noMow === "Yes").length;
    return <p className="home-slot-copy">{yes} set to mow · {unmowed} unmowed</p>;
  }
  if (id === "owe-mow") {
    const owed = lots.filter((lot) => lot.noMow === "Owe-Mow" || lot.noMow === "Owe" || /^no-owe$/i.test(lot.noMow));
    return <p className="home-slot-copy">{owed.length} Owe-Mow{owed.length ? ` · ${owed.slice(0, 4).map((lot) => lot.lot).join(", ")}` : ""}</p>;
  }
  if (id === "business") {
    const tasks = readJson<{ status?: string; title?: string }[]>("magnolia-business-tasks", []);
    const open = tasks.filter((task) => task.status !== "Completed");
    return <p className="home-slot-copy">{open.length} open tasks{open[0]?.title ? ` · ${open[0].title}` : ""}</p>;
  }
  if (id === "heat") {
    const sum = lots.filter((lot) => lot.status === "Occupied").reduce((total, lot) => total + (Number((lot.rent ?? "").replace(/[$,\s]/g, "")) || 0), 0);
    return <p className="home-slot-copy">${sum.toLocaleString()} monthly rent</p>;
  }
  if (id === "work") {
    const open = lots.reduce((total, lot) => total + (lot.maintLog ?? []).filter((job) => job.done !== "Yes").length, 0);
    return <p className="home-slot-copy">{open} open work orders</p>;
  }
  if (id.startsWith("inv-")) {
    const title = CHOICES.find((choice) => choice.id === id)?.title ?? "";
    const section = title === "Handyman supplies" ? "Handyman" : title === "Mowing supplies" ? "Mowing" : title;
    const items = stock[section] ?? [];
    const inStock = items.filter((item) => item.inStock || item.qty?.trim()).length;
    return <p className="home-slot-copy">{inStock} of {items.length || "—"} in stock</p>;
  }
  if (id === "plant-pumps") return <p className="home-slot-copy">Pump 1 {plant.pump1 === false ? "off" : "on"} · Pump 2 {plant.pump2 === false ? "off" : "on"}</p>;
  if (id === "plant-samples") {
    const samples = Array.isArray(plant.samples) ? plant.samples : [];
    return <p className="home-slot-copy">{samples.length} samples logged</p>;
  }
  if (id === "plant-chlorine") return <p className="home-slot-copy">Chlorine pump {plant.chlorinePump === false ? "off" : "on"}</p>;
  if (id === "plant-weather") return <WeatherLine />;
  if (id === "plant-camera") return <p className="home-slot-copy">{plant.cameraLink ? "Camera link saved" : "No camera link yet"}</p>;
  if (id === "plant-report") {
    const reports = Array.isArray(plant.reports) ? (plant.reports as { date?: string }[]) : [];
    return <p className="home-slot-copy">{reports[0]?.date ? `Last report ${reports[0].date}` : "No reports yet"}</p>;
  }
  if (id === "plant-generator") return <p className="home-slot-copy">Generator {plant.generatorOn ? "on" : "off"}{plant.generatorLast ? ` · tested ${String(plant.generatorLast)}` : ""}</p>;
  if (id === "plant-clog") {
    const clogs = Array.isArray(plant.clogs) ? (plant.clogs as { date?: string; note?: string }[]) : [];
    return <p className="home-slot-copy">{clogs[0] ? `${clogs[0].note ?? "Clog"} · ${clogs[0].date}` : "No clogs yet"}</p>;
  }
  if (id === "vendors") {
    const vendors = readJson<{ liability?: { uploaded?: string; fileName?: string }; license?: { uploaded?: string; fileName?: string }; workersComp?: { uploaded?: string; fileName?: string } }[]>("magnolia-vendors", []);
    const missing = vendors.reduce((total, vendor) => total + [vendor.liability, vendor.license, vendor.workersComp].filter((doc) => !doc?.uploaded && !doc?.fileName).length, 0);
    return <p className="home-slot-copy">{missing} missing documents</p>;
  }
  if (id === "register") {
    const occupied = lots.filter((lot) => lot.status === "Occupied").length;
    const empty = lots.filter((lot) => lot.status === "Empty").length;
    return <p className="home-slot-copy">{occupied} occupied · {empty} empty</p>;
  }
  if (id === "audit") {
    const rows = readJson<{ action?: string; detail?: string }[]>("magnolia-audit", []);
    return <p className="home-slot-copy">{rows[0] ? `${rows[0].action}: ${rows[0].detail}` : "No audit entries yet"}</p>;
  }
  return null;
}

function WeatherLine() {
  const [text, setText] = useState("Loading weather…");
  useEffect(() => {
    let stop = false;
    void fetch("https://api.open-meteo.com/v1/forecast?latitude=28.6292&longitude=-81.4418&current=wind_speed_10m&daily=precipitation_sum&precipitation_unit=inch&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1")
      .then((res) => res.json())
      .then((data) => {
        if (stop) return;
        const rain = Number(data?.daily?.precipitation_sum?.[0]);
        const wind = Number(data?.current?.wind_speed_10m);
        setText(`${Number.isFinite(rain) ? rain.toFixed(2) : "—"} in rain · ${Number.isFinite(wind) ? Math.round(wind) : "—"} mph wind`);
      })
      .catch(() => { if (!stop) setText("Weather unavailable"); });
    return () => { stop = true; };
  }, []);
  return <p className="home-slot-copy">{text}</p>;
}
