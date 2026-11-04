import { useEffect, useRef, useState } from "react";
import { logAudit } from "./audit";

const KEY = "magnolia-treatment-plant";
const CAMERA_KEY = "magnolia-camera-plant";
const ALARM_KEY = "magnolia-alarm-on";
const PARK = { latitude: 28.6292, longitude: -81.4418 };

type Stamp = { id: string; date: string; note?: string; fileName?: string; file?: string };
type Supply = { id: string; gallons: string; date: string };
type Plant = {
  sampleDate: string;
  samples: Stamp[];
  chlorinePump: boolean;
  chlorineGallons: string;
  chlorineSupply: Supply[];
  pumpReplaced: string;
  pumpReplacedHistory: Stamp[];
  generatorOn: boolean;
  generatorLast: string;
  pump1: boolean;
  pump2: boolean;
  clogPump: string;
  clogDate: string;
  clogs: Stamp[];
  alarmOn: boolean;
  bothOffSince: number | null;
  cameraLink: string;
  reportDate: string;
  reports: Stamp[];
};

const empty: Plant = {
  sampleDate: "",
  samples: [],
  chlorinePump: true,
  chlorineGallons: "",
  chlorineSupply: [],
  pumpReplaced: "",
  pumpReplacedHistory: [],
  generatorOn: false,
  generatorLast: "",
  pump1: true,
  pump2: true,
  clogPump: "1",
  clogDate: "",
  clogs: [],
  alarmOn: false,
  bothOffSince: null,
  cameraLink: "",
  reportDate: "",
  reports: [],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function load(): Plant {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Plant>;
    let cameraLink = saved.cameraLink ?? "";
    try {
      cameraLink = cameraLink || localStorage.getItem(CAMERA_KEY) || "";
    } catch {
      /* keep the saved link */
    }
    return {
      ...empty,
      ...saved,
      samples: Array.isArray(saved.samples) ? saved.samples : [],
      chlorineSupply: Array.isArray(saved.chlorineSupply) ? saved.chlorineSupply : [],
      pumpReplacedHistory: Array.isArray(saved.pumpReplacedHistory) ? saved.pumpReplacedHistory : [],
      clogs: Array.isArray(saved.clogs) ? saved.clogs : [],
      reports: Array.isArray(saved.reports) ? saved.reports : [],
      cameraLink,
    };
  } catch {
    return empty;
  }
}

function rainTone(inches: number | null) {
  if (inches === null) return "";
  return inches > 5 ? "tone-orange" : "tone-green";
}

function windTone(mph: number | null) {
  if (mph === null) return "";
  if (mph > 50) return "tone-red";
  if (mph >= 10) return "tone-orange";
  return "tone-green";
}

function notifyAlarm() {
  const body = "Pump 1 and Pump 2 have both been off for more than 15 minutes.";
  try {
    localStorage.setItem(ALARM_KEY, "Yes");
  } catch {
    /* the on-screen alarm still shows */
  }
  window.dispatchEvent(new CustomEvent("magnolia-alarm", { detail: { on: true, message: body } }));
  if (typeof Notification === "undefined") return;
  const send = () => new Notification("Treatment plant alarm", { body });
  if (Notification.permission === "granted") send();
  else if (Notification.permission !== "denied") void Notification.requestPermission().then((ok) => { if (ok === "granted") send(); });
}

function clearAlarmFlag() {
  try {
    localStorage.setItem(ALARM_KEY, "No");
  } catch {
    /* the pumps are back on */
  }
  window.dispatchEvent(new CustomEvent("magnolia-alarm", { detail: { on: false } }));
}

export function TreatmentPlant() {
  const [plant, setPlant] = useState<Plant>(load);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [weather, setWeather] = useState<{ rain: number | null; wind: number | null }>({ rain: null, wind: null });

  const plantReady = useRef(false);
  useEffect(() => {
    if (!plantReady.current) {
      plantReady.current = true;
    } else {
      logAudit("Website", "Updated the treatment plant");
    }
    localStorage.setItem(KEY, JSON.stringify(plant));
    try {
      if (plant.cameraLink) localStorage.setItem(CAMERA_KEY, plant.cameraLink);
    } catch {
      /* the plant copy still has the link */
    }
  }, [plant]);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${PARK.latitude}&longitude=${PARK.longitude}&current=wind_speed_10m&daily=precipitation_sum&precipitation_unit=inch&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=1`;
        const data = await fetch(url).then((res) => res.json());
        if (stop) return;
        const rain = Number(data?.daily?.precipitation_sum?.[0]);
        const wind = Number(data?.current?.wind_speed_10m);
        setWeather({ rain: Number.isFinite(rain) ? rain : null, wind: Number.isFinite(wind) ? wind : null });
      } catch {
        if (!stop) setWeather({ rain: null, wind: null });
      }
    }
    void pull();
    const timer = window.setInterval(pull, 10 * 60 * 1000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  function patch(next: Partial<Plant>) {
    setPlant((current) => ({ ...current, ...next }));
  }

  function setPump(which: "pump1" | "pump2", on: boolean) {
    setPlant((current) => {
      const next = { ...current, [which]: on };
      const bothOff = !next.pump1 && !next.pump2;
      if (bothOff) {
        if (!current.bothOffSince) next.bothOffSince = Date.now();
      } else {
        next.bothOffSince = null;
        if (current.alarmOn) {
          next.alarmOn = false;
          queueMicrotask(clearAlarmFlag);
        }
      }
      return next;
    });
  }

  useEffect(() => {
    const bothOff = !plant.pump1 && !plant.pump2;
    if (!bothOff || !plant.bothOffSince || plant.alarmOn) return;
    const limit = 15 * 60 * 1000;
    const wait = plant.bothOffSince + limit - Date.now();
    const fire = () => {
      setPlant((current) => {
        if (current.pump1 || current.pump2 || !current.bothOffSince) return current;
        if (Date.now() - current.bothOffSince <= limit) return current;
        if (!current.alarmOn) queueMicrotask(notifyAlarm);
        return { ...current, alarmOn: true };
      });
    };
    if (wait <= 0) {
      fire();
      return;
    }
    const timer = window.setTimeout(fire, wait + 50);
    return () => window.clearTimeout(timer);
  }, [plant.pump1, plant.pump2, plant.bothOffSince, plant.alarmOn]);

  function addSample() {
    if (!plant.sampleDate) return;
    patch({
      samples: [{ id: crypto.randomUUID(), date: plant.sampleDate }, ...plant.samples],
      sampleDate: "",
    });
  }

  function addGallons() {
    const gallons = plant.chlorineGallons.trim();
    if (!gallons) return;
    patch({
      chlorineSupply: [{ id: crypto.randomUUID(), gallons, date: today() }, ...plant.chlorineSupply],
      chlorineGallons: "",
    });
  }

  function addClog() {
    if (!plant.clogDate) return;
    patch({
      clogs: [{ id: crypto.randomUUID(), date: plant.clogDate, note: `Pump ${plant.clogPump}` }, ...plant.clogs],
      clogDate: "",
    });
  }

  function addPumpDate() {
    if (!plant.pumpReplaced) return;
    patch({
      pumpReplacedHistory: [{ id: crypto.randomUUID(), date: plant.pumpReplaced }, ...plant.pumpReplacedHistory],
      pumpReplaced: "",
    });
  }

  function addReport(file?: { fileName: string; file: string }) {
    if (!plant.reportDate && !file) return;
    patch({
      reports: [{ id: crypto.randomUUID(), date: plant.reportDate || today(), fileName: file?.fileName, file: file?.file }, ...plant.reports],
      reportDate: "",
    });
  }

  function readReport(file: File) {
    const reader = new FileReader();
    reader.onload = () => addReport({ fileName: file.name, file: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  }

  return (
    <div className="plant-board">
      <header className="home-head">
        <div>
          <p className="eyebrow">TREATMENT PLANT</p>
          <h2>Today</h2>
        </div>
        <span className={plant.alarmOn ? "plant-alarm-pill on" : "plant-alarm-pill"}>Alarm {plant.alarmOn ? "on" : "off"}</span>
      </header>
      {plant.alarmOn ? <p className="plant-alarm">Both pumps have been off for more than 15 minutes. Alarm is on.</p> : null}

      <div className="plant-tiles">
        <section className="plant-tile plant-span">
          <button
            type="button"
            className="plant-cam"
            onClick={() => {
              if (plant.cameraLink) {
                setCameraOpen(true);
                return;
              }
              const next = window.prompt("Paste the camera link");
              if (next === null) return;
              patch({ cameraLink: next.trim() });
            }}
          >
            {plant.cameraLink ? <iframe title="Treatment plant camera" src={plant.cameraLink} /> : <span>Add a camera link</span>}
          </button>
        </section>

        <section className="plant-tile">
          <h3>Pumps</h3>
          <div className="plant-split">
            <div className="plant-row">
              <div className="plant-pump">
                <span>Pump 1</span>
                <Toggle on={plant.pump1} onLabel="On" offLabel="Off" onTone="green" offTone="gray" onChange={(on) => setPump("pump1", on)} />
              </div>
              <div className="plant-pump">
                <span>Pump 2</span>
                <Toggle on={plant.pump2} onLabel="On" offLabel="Off" onTone="green" offTone="gray" onChange={(on) => setPump("pump2", on)} />
              </div>
            </div>
            <div>
              <h3>Last pump clog</h3>
              <div className="plant-row">
                <label>Pump
                  <select value={plant.clogPump} onChange={(e) => patch({ clogPump: e.target.value })}>
                    <option value="1">Pump 1</option>
                    <option value="2">Pump 2</option>
                  </select>
                </label>
                <label>Date<input type="date" value={plant.clogDate} onChange={(e) => patch({ clogDate: e.target.value })} /></label>
                <button type="button" className="business-primary" onClick={addClog}>Add</button>
              </div>
              <History rows={plant.clogs} empty="No clogs yet." />
            </div>
          </div>
        </section>

        <section className="plant-tile">
          <h3>Samples</h3>
          <div className="plant-row">
            <label>Date completed<input type="date" value={plant.sampleDate} onChange={(e) => patch({ sampleDate: e.target.value })} /></label>
            <button type="button" className="business-primary" onClick={addSample}>Add</button>
          </div>
          <History rows={plant.samples} empty="No samples yet." />
        </section>

        <section className="plant-tile">
          <h3>Chlorine pump</h3>
          <Toggle on={plant.chlorinePump} onLabel="On" offLabel="Off" onTone="green" offTone="red" onChange={(on) => patch({ chlorinePump: on })} />
          <div className="plant-row">
            <label>Supply
              <input list="chlorine-gallons" inputMode="decimal" value={plant.chlorineGallons} placeholder="Gallons" onChange={(e) => patch({ chlorineGallons: e.target.value })} />
            </label>
            <datalist id="chlorine-gallons">
              {["5", "10", "15", "20", "25", "30", "40", "50"].map((n) => <option key={n} value={n} />)}
            </datalist>
            <button type="button" className="business-primary" onClick={addGallons}>Add</button>
          </div>
          <ul className="plant-history">
            {plant.chlorineSupply.length === 0 ? <li>No gallons added yet.</li> : plant.chlorineSupply.map((row) => <li key={row.id}>{row.date} · {row.gallons} gal</li>)}
          </ul>
          <div className="plant-row">
            <label>Last replaced pump<input type="date" value={plant.pumpReplaced} onChange={(e) => patch({ pumpReplaced: e.target.value })} /></label>
            <button type="button" className="business-secondary" onClick={addPumpDate}>Save date</button>
          </div>
          <History rows={plant.pumpReplacedHistory} empty="No replacement dates yet." />
        </section>

        <section className="plant-tile">
          <h3>Weather gauge</h3>
          <p className="plant-metric">Rain <strong className={rainTone(weather.rain)}>{weather.rain === null ? "—" : `${weather.rain.toFixed(2)} in`}</strong></p>
          <p className="plant-metric">Wind <strong className={windTone(weather.wind)}>{weather.wind === null ? "—" : `${Math.round(weather.wind)} mph`}</strong></p>
          <small>Dr Love Rd · under 5 in green, over 5 in orange. Wind under 10 green, over orange, over 50 red.</small>
        </section>

        <section className="plant-tile">
          <h3>Treatment report</h3>
          <div className="plant-row">
            <label>Date completed<input type="date" value={plant.reportDate} onChange={(e) => patch({ reportDate: e.target.value })} /></label>
            <button type="button" className="business-primary" onClick={() => addReport()}>Add</button>
            <label className="business-secondary vendor-file">
              Upload
              <input
                hidden
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) readReport(file);
                }}
              />
            </label>
          </div>
          <ul className="plant-history">
            {plant.reports.length === 0 ? <li>No reports yet.</li> : plant.reports.map((row) => (
              <li key={row.id}>
                {row.date || "No date"}
                {row.file ? <> · <a href={row.file} download={row.fileName || "treatment-report"}>{row.fileName || "Document"}</a></> : null}
              </li>
            ))}
          </ul>
        </section>
        <section className="plant-tile">
          <h3>Generator</h3>
          <Toggle on={plant.generatorOn} onLabel="On" offLabel="Off" onTone="green" offTone="gray" onChange={(on) => patch({ generatorOn: on })} />
          <label className="plant-under">Quarterly test<input type="date" value={plant.generatorLast} onChange={(e) => patch({ generatorLast: e.target.value })} /></label>
        </section>
      </div>

      {cameraOpen && plant.cameraLink ? (
        <div className="plant-cam-large" role="dialog" aria-label="Treatment plant camera">
          <button type="button" onClick={() => setCameraOpen(false)}>Close</button>
          <iframe title="Treatment plant camera large" src={plant.cameraLink} />
        </div>
      ) : null}
    </div>
  );
}

function History({ rows, empty }: { rows: Stamp[]; empty: string }) {
  return (
    <ul className="plant-history">
      {rows.length === 0 ? <li>{empty}</li> : rows.map((row) => <li key={row.id}>{row.date}{row.note ? ` · ${row.note}` : ""}</li>)}
    </ul>
  );
}

function Toggle({
  on,
  onLabel,
  offLabel,
  onTone,
  offTone,
  onChange,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  onTone: "green" | "red" | "gray";
  offTone: "green" | "red" | "gray";
  onChange: (on: boolean) => void;
}) {
  const tone = on ? onTone : offTone;
  return (
    <button type="button" className={`plant-toggle tone-${tone}`} aria-pressed={on} onClick={() => onChange(!on)}>
      <i className={`plant-dot tone-${tone}`} />
      {on ? onLabel : offLabel}
    </button>
  );
}
