import React, { useState, useEffect } from 'react';
import './TreatmentPlant.css';

interface CheckEntry {
  id: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  item: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  time?: string;
}

interface PumpClog {
  id: string;
  date: string;
  pump: 1 | 2;
  cleared: boolean;
  clearedDate?: string;
}

interface PumpOut {
  id: string;
  date: string;
  hauler: string;
  cost: number;
  gallons?: number;
}

interface Sample {
  id: string;
  month: string;
  dueDate: string;
  submitted: boolean;
  photoUrl?: string;
}

interface SparePart {
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  category: string;
}

interface GeneratorTest {
  id: string;
  date: string;
  result: 'pass' | 'fail';
  notes: string;
}

const TreatmentPlant: React.FC = () => {
  const [checks, setChecks] = useState<CheckEntry[]>(() => {
    const saved = localStorage.getItem('treatmentPlantChecks');
    return saved ? JSON.parse(saved) : [];
  });
  const [pumpClogs, setPumpClogs] = useState<PumpClog[]>(() => {
    const saved = localStorage.getItem('treatmentPlantPumpClogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [pumpOuts, setPumpOuts] = useState<PumpOut[]>(() => {
    const saved = localStorage.getItem('treatmentPlantPumpOuts');
    return saved ? JSON.parse(saved) : [];
  });
  const [samples, setSamples] = useState<Sample[]>(() => {
    const saved = localStorage.getItem('treatmentPlantSamples');
    return saved ? JSON.parse(saved) : [];
  });
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const saved = localStorage.getItem('treatmentPlantSpareParts');
    return saved ? JSON.parse(saved) : getDefaultSpareParts();
  });
  const [generatorTests, setGeneratorTests] = useState<GeneratorTest[]>(() => {
    const saved = localStorage.getItem('treatmentPlantGeneratorTests');
    return saved ? JSON.parse(saved) : [];
  });
  const [chlorineDrumLevel, setChlorineDrumLevel] = useState<string>(() => {
    return localStorage.getItem('treatmentPlantChlorineLevel') || 'full';
  });
  const [alarmOn, setAlarmOn] = useState<boolean>(() => {
    const saved = localStorage.getItem('treatmentPlantAlarmOn');
    return saved ? JSON.parse(saved) : true;
  });
  const [cameraLink, setCameraLink] = useState<string>(() => {
    return localStorage.getItem('treatmentPlantCameraLink') || '';
  });
  const [weatherLink, setWeatherLink] = useState<string>(() => {
    return localStorage.getItem('treatmentPlantWeatherLink') || '';
  });
  const [aeratorHours, setAeratorHours] = useState<number>(() => {
    const saved = localStorage.getItem('treatmentPlantAeratorHours');
    return saved ? parseFloat(saved) : 0;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checks' | 'samples' | 'pumpouts' | 'parts' | 'generator'>('dashboard');

  useEffect(() => {
    localStorage.setItem('treatmentPlantChecks', JSON.stringify(checks));
  }, [checks]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantPumpClogs', JSON.stringify(pumpClogs));
  }, [pumpClogs]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantPumpOuts', JSON.stringify(pumpOuts));
  }, [pumpOuts]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantSamples', JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantSpareParts', JSON.stringify(spareParts));
  }, [spareParts]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantGeneratorTests', JSON.stringify(generatorTests));
  }, [generatorTests]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantChlorineLevel', chlorineDrumLevel);
  }, [chlorineDrumLevel]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantAlarmOn', JSON.stringify(alarmOn));
  }, [alarmOn]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantCameraLink', cameraLink);
  }, [cameraLink]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantWeatherLink', weatherLink);
  }, [weatherLink]);

  useEffect(() => {
    localStorage.setItem('treatmentPlantAeratorHours', aeratorHours.toString());
  }, [aeratorHours]);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const addCheck = (type: CheckEntry['type'], item: string) => {
    const newCheck: CheckEntry = {
      id: Date.now().toString(),
      date: today,
      type,
      item,
      status: 'pending',
      notes: '',
      time: new Date().toLocaleTimeString(),
    };
    setChecks([...checks, newCheck]);
  };

  const updateCheck = (id: string, status: 'pass' | 'fail', notes: string) => {
    setChecks(checks.map(c => c.id === id ? { ...c, status, notes } : c));
  };

  const addPumpClog = (pump: 1 | 2) => {
    const newClog: PumpClog = {
      id: Date.now().toString(),
      date: today,
      pump,
      cleared: false,
    };
    setPumpClogs([...pumpClogs, newClog]);
  };

  const clearPumpClog = (id: string) => {
    setPumpClogs(pumpClogs.map(c => c.id === id ? { ...c, cleared: true, clearedDate: today } : c));
  };

  const addPumpOut = (hauler: string, cost: number, gallons?: number) => {
    const newPumpOut: PumpOut = {
      id: Date.now().toString(),
      date: today,
      hauler,
      cost,
      gallons,
    };
    setPumpOuts([...pumpOuts, newPumpOut]);
  };

  const lastPumpOut = pumpOuts.length > 0 ? pumpOuts[pumpOuts.length - 1] : null;
  const daysSincePumpOut = lastPumpOut ? Math.floor((new Date().getTime() - new Date(lastPumpOut.date).getTime()) / (1000 * 60 * 60 * 24)) : null;

  const currentMonthSample = samples.find(s => s.month === currentMonth);
  const sampleDue = currentMonthSample ? new Date(currentMonthSample.dueDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 15);
  const samplePastDue = new Date() > sampleDue && (!currentMonthSample || !currentMonthSample.submitted);

  const lowStockParts = spareParts.filter(p => p.quantity <= p.reorderPoint);

  const lastGeneratorTest = generatorTests.length > 0 ? generatorTests[generatorTests.length - 1] : null;
  const generatorTestDue = lastGeneratorTest ? new Date(lastGeneratorTest.date) : new Date(0);
  generatorTestDue.setMonth(generatorTestDue.getMonth() + 3);
  const generatorOverdue = new Date() > generatorTestDue;

  const dailyChecks = ['Pump breaker on (morning)', 'Pump breaker on (evening)', 'Pump breaker on (night)', 'Chlorine level', 'Rain gauge reading'];
  const weeklyChecks = ['Pump functionality', 'Mesh panel cleaning', 'Chlorine drum visual check'];
  const monthlyChecks = ['Chlorine pump', 'Blower motors', 'Sludge depth', 'Monthly sample'];

  const todaysChecks = checks.filter(c => c.date === today);

  return (
    <div className="treatment-plant">
      <div className="tp-header">
        <h2>Treatment Plant</h2>
        <div className="tp-alarm">
          <span className={alarmOn ? 'alarm-on' : 'alarm-off'}>🔔 {alarmOn ? 'ON' : 'OFF'}</span>
          <button onClick={() => setAlarmOn(!alarmOn)}>{alarmOn ? 'Turn Off' : 'Turn On'}</button>
        </div>
      </div>

      <div className="tp-tabs">
        {(['dashboard', 'checks', 'samples', 'pumpouts', 'parts', 'generator'] as const).map(tab => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="tp-dashboard">
          <div className="tp-status-grid">
            <div className="tp-card">
              <h3>Pump Status</h3>
              <p>Active clogs: {pumpClogs.filter(c => !c.cleared).length}</p>
              <button onClick={() => addPumpClog(1)}>+ Pump 1 Clog</button>
              <button onClick={() => addPumpClog(2)}>+ Pump 2 Clog</button>
            </div>
            <div className="tp-card">
              <h3>Last Pump-Out</h3>
              <p>{lastPumpOut ? `${daysSincePumpOut} days ago (${lastPumpOut.date})` : 'No pump-out logged'}</p>
              {daysSincePumpOut !== null && daysSincePumpOut > 90 && <span className="alert-red">Overdue for pump-out</span>}
            </div>
            <div className="tp-card">
              <h3>Monthly Sample</h3>
              <p>Due: {sampleDue.toLocaleDateString()}</p>
              {samplePastDue && <span className="alert-red">PAST DUE</span>}
              {currentMonthSample?.submitted && <span className="alert-green">Submitted</span>}
            </div>
            <div className="tp-card">
              <h3>Chlorine Drum (50 gal)</h3>
              <select value={chlorineDrumLevel} onChange={e => setChlorineDrumLevel(e.target.value)}>
                <option value="full">Full</option>
                <option value="half">Half</option>
                <option value="low">Low</option>
                <option value="empty">Empty</option>
              </select>
              {chlorineDrumLevel === 'low' && <span className="alert-yellow">Order soon</span>}
              {chlorineDrumLevel === 'empty' && <span className="alert-red">EMPTY</span>}
            </div>
            <div className="tp-card">
              <h3>Low Stock Parts</h3>
              {lowStockParts.length === 0 ? <p>All stocked</p> : lowStockParts.map(p => <p key={p.id} className="alert-red">{p.name}: {p.quantity}</p>)}
            </div>
            <div className="tp-card">
              <h3>Generator Test</h3>
              <p>{lastGeneratorTest ? `Last: ${lastGeneratorTest.date} (${lastGeneratorTest.result})` : 'Never tested'}</p>
              {generatorOverdue && <span className="alert-red">QUARTERLY TEST DUE</span>}
            </div>
          </div>
          <div className="tp-links">
            <div>
              <label>Camera Link:</label>
              <input type="text" value={cameraLink} onChange={e => setCameraLink(e.target.value)} placeholder="Blue Iris URL" />
              {cameraLink && <a href={cameraLink} target="_blank" rel="noreferrer">Open Camera</a>}
            </div>
            <div>
              <label>Weather Link:</label>
              <input type="text" value={weatherLink} onChange={e => setWeatherLink(e.target.value)} placeholder="Weather station URL" />
              {weatherLink && <a href={weatherLink} target="_blank" rel="noreferrer">Open Weather</a>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checks' && (
        <div className="tp-checks">
          <div className="tp-check-section">
            <h3>Daily Checks</h3>
            {dailyChecks.map(item => {
              const existing = todaysChecks.find(c => c.item === item && c.type === 'daily');
              return (
                <div key={item} className="tp-check-row">
                  <span>{item}</span>
                  {existing ? (
                    <span className={existing.status === 'pass' ? 'pass' : existing.status === 'fail' ? 'fail' : 'pending'}>
                      {existing.status.toUpperCase()} {existing.time}
                    </span>
                  ) : (
                    <button onClick={() => addCheck('daily', item)}>+ Check</button>
                  )}
                  {existing && existing.status === 'pending' && (
                    <div>
                      <button onClick={() => updateCheck(existing.id, 'pass', '')}>Pass</button>
                      <button onClick={() => updateCheck(existing.id, 'fail', '')}>Fail</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="tp-check-section">
            <h3>Weekly Checks</h3>
            {weeklyChecks.map(item => {
              const existing = todaysChecks.find(c => c.item === item && c.type === 'weekly');
              return (
                <div key={item} className="tp-check-row">
                  <span>{item}</span>
                  {existing ? (
                    <span className={existing.status === 'pass' ? 'pass' : existing.status === 'fail' ? 'fail' : 'pending'}>
                      {existing.status.toUpperCase()}
                    </span>
                  ) : (
                    <button onClick={() => addCheck('weekly', item)}>+ Check</button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="tp-check-section">
            <h3>Monthly Checks</h3>
            {monthlyChecks.map(item => {
              const existing = todaysChecks.find(c => c.item === item && c.type === 'monthly');
              return (
                <div key={item} className="tp-check-row">
                  <span>{item}</span>
                  {existing ? (
                    <span className={existing.status === 'pass' ? 'pass' : existing.status === 'fail' ? 'fail' : 'pending'}>
                      {existing.status.toUpperCase()}
                    </span>
                  ) : (
                    <button onClick={() => addCheck('monthly', item)}>+ Check</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'samples' && (
        <div className="tp-samples">
          <h3>Monthly Samples (Due 15th)</h3>
          <div className={samplePastDue ? 'sample-overdue' : ''}>
            <p>Current month: {currentMonth}</p>
            <p>Due: {sampleDue.toLocaleDateString()}</p>
            {samplePastDue && <p className="alert-red">PAST DUE — RED</p>}
            {currentMonthSample?.submitted ? (
              <p className="alert-green">✓ Submitted</p>
            ) : (
              <button onClick={() => setSamples([...samples, { id: Date.now().toString(), month: currentMonth, dueDate: sampleDue.toISOString().split('T')[0], submitted: true }])}>
                Mark Submitted
              </button>
            )}
          </div>
          <div className="tp-sample-history">
            <h4>History</h4>
            {samples.slice().reverse().map(s => (
              <div key={s.id} className="sample-entry">
                <span>{s.month}</span>
                <span>{s.submitted ? '✓' : '✗'}</span>
                {s.photoUrl && <a href={s.photoUrl} target="_blank" rel="noreferrer">Photo</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pumpouts' && (
        <div className="tp-pumpouts">
          <h3>Pump-Out Log</h3>
          <div className="tp-pumpout-form">
            <input type="text" placeholder="Hauler" id="hauler" />
            <input type="number" placeholder="Cost" id="cost" />
            <input type="number" placeholder="Gallons" id="gallons" />
            <button onClick={() => {
              const hauler = (document.getElementById('hauler') as HTMLInputElement).value;
              const cost = parseFloat((document.getElementById('cost') as HTMLInputElement).value);
              const gallons = parseFloat((document.getElementById('gallons') as HTMLInputElement).value);
              if (hauler && !isNaN(cost)) addPumpOut(hauler, cost, isNaN(gallons) ? undefined : gallons);
            }}>+ Log Pump-Out</button>
          </div>
          <div className="tp-pumpout-list">
            {pumpOuts.slice().reverse().map(po => (
              <div key={po.id} className="pumpout-entry">
                <span>{po.date}</span>
                <span>{po.hauler}</span>
                <span>${po.cost.toFixed(2)}</span>
                {po.gallons && <span>{po.gallons} gal</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'parts' && (
        <div className="tp-parts">
          <h3>Spare Parts</h3>
          {spareParts.map(part => (
            <div key={part.id} className={part.quantity <= part.reorderPoint ? 'low-stock' : ''}>
              <span>{part.name}</span>
              <span>Qty: {part.quantity}</span>
              <button onClick={() => setSpareParts(spareParts.map(p => p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p))}>+</button>
              <button onClick={() => setSpareParts(spareParts.map(p => p.id === part.id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p))}>−</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="tp-generator">
          <h3>Generator Test Log (Quarterly)</h3>
          <button onClick={() => setGeneratorTests([...generatorTests, { id: Date.now().toString(), date: today, result: 'pass', notes: '' }])}>
            + Log Test (Pass)
          </button>
          <button onClick={() => setGeneratorTests([...generatorTests, { id: Date.now().toString(), date: today, result: 'fail', notes: '' }])}>
            + Log Test (Fail)
          </button>
          <div className="tp-generator-list">
            {generatorTests.slice().reverse().map(gt => (
              <div key={gt.id} className={gt.result === 'pass' ? 'pass' : 'fail'}>
                <span>{gt.date}</span>
                <span>{gt.result.toUpperCase()}</span>
              </div>
            ))}
          </div>
          <div className="tp-aerator">
            <h4>Aerator Runtime</h4>
            <input type="number" value={aeratorHours} onChange={e => setAeratorHours(parseFloat(e.target.value) || 0)} />
            <span>hours</span>
          </div>
        </div>
      )}

      <div className="tp-active-clogs">
        <h3>Active Pump Clogs</h3>
        {pumpClogs.filter(c => !c.cleared).length === 0 ? (
          <p>No active clogs</p>
        ) : (
          pumpClogs.filter(c => !c.cleared).map(c => (
            <div key={c.id} className="clog-entry">
              <span>Pump {c.pump} — {c.date}</span>
              <button onClick={() => clearPumpClog(c.id)}>✓ Cleared</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  function getDefaultSpareParts(): SparePart[] {
    return [
      { id: '1', name: 'Blower Belts', quantity: 2, reorderPoint: 1, category: 'Blower' },
      { id: '2', name: 'Spare Pumps', quantity: 1, reorderPoint: 1, category: 'Pump' },
      { id: '3', name: 'Blower Motors', quantity: 1, reorderPoint: 1, category: 'Blower' },
      { id: '4', name: 'Chlorine Pump', quantity: 1, reorderPoint: 1, category: 'Chlorine' },
      { id: '5', name: 'Fuses', quantity: 10, reorderPoint: 3, category: 'Electrical' },
      { id: '6', name: 'Impellers', quantity: 2, reorderPoint: 1, category: 'Pump' },
    ];
  }

  return null;
};

export default TreatmentPlant;