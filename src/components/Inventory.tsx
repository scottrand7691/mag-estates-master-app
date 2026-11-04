import React, { useState } from 'react'
import { useStore } from '../store'

const SECTIONS = {
  'AC Parts': ['Motor', 'Contactor', 'Breaker', 'Fan Blade', 'Capacitor 65', 'Capacitor 60', 'Capacitor 55', 'Capacitor 50', 'Capacitor 45', 'Capacitor 40', 'Capacitor 35', 'Capacitor 30', 'Capacitor 25', 'Capacitor 20', 'Capacitor 15', 'Capacitor 12.5', 'Capacitor 10', 'Capacitor 7.5', 'Capacitor 5', 'Universal Tester Capacitor (in stock / out)'],
  'Plumbing': ['Coupler', 'Elbow', 'Pipe', 'Glue', 'Termination Bar', 'Light Bulb', 'Sink Faucet', 'Bathroom Faucet', 'Kitchen Faucet', 'Toilet', 'Toilet Seat', 'Toilet Handle', 'Flusher Kit', 'Flapper Kit', 'Toilet Chain Kit', 'Wax Ring', 'Drain Snake', 'Bladder', 'P-Trap', 'Shower Head', 'Tub Spout'],
  'Wood Repair': ['2x4', '2x6', '4x4', 'Screws'],
  'Roofing': ['Peel and Stick', 'Shingles', 'Blackjack Tar', 'Rubber Roof'],
  'Paint Supplies': ['Roller', 'Brush', 'Paint', 'Tray', 'Cover-Up Spray'],
  'Handyman Gear': ['Pressure Washer', 'Step Ladder', 'Extension Ladder', 'Extension Cords', 'Door Hardware', 'Window Screens', 'Caulk', 'Expanding Foam', 'Smoke Detector', 'Gaskets', 'O-Rings', 'Zip Ties', 'Duct Tape', 'Electrical Tape', 'Wire Nuts', 'PVC Primer', 'PVC Cement', 'GFI Outlet', 'Receptacle', 'Batteries AA', 'Batteries AAA', 'Batteries 9V'],
  'Mowing Equipment': ['Mower (Cub Cadet 36in, 5 gal)', 'Edger', 'Blower', 'Weed Eater', 'Hedge Trimmer', 'Oil', 'Hydraulic Fluid', 'Tire Pressure', 'Weed-Eater Wire', 'Mixed Gas', 'Regular Gas'],
  'Treatment Plant Spares': ['Blower Belt', 'Spare Pump', 'Blower Motor', 'Chlorine Pump'],
}

export default function Inventory() {
  const store = useStore()
  const items = store.inventory ?? []
  const [section, setSection] = useState<keyof typeof SECTIONS>(Object.keys(SECTIONS)[0] as keyof typeof SECTIONS)

  const getQty = (name: string) => items.find(i => i.name === name)?.qty ?? 0
  const getThreshold = (name: string) => items.find(i => i.name === name)?.threshold ?? 0
  const setQty = (name: string, qty: number) => store.setInventoryItem(name, qty, getThreshold(name))
  const setThreshold = (name: string, threshold: number) => store.setInventoryItem(name, getQty(name), threshold)

  return (
    <div className="inventory">
      <div className="inventory-sections">
        {Object.keys(SECTIONS).map(s => <button key={s} className={section === s ? 'active' : ''} onClick={() => setSection(s as keyof typeof SECTIONS)}>{s}</button>)}
      </div>
      <div className="inventory-list">
        {SECTIONS[section].map(name => {
          const qty = getQty(name)
          const threshold = getThreshold(name)
          const low = threshold > 0 && qty <= threshold
          return (
            <div key={name} className={`inventory-row ${low ? 'low-stock' : ''}`}
            >
              <span className="inv-name">{name}</span>
              <input type="number" value={qty} onChange={e => setQty(name, Number(e.target.value))} min={0} />
              <input type="number" placeholder="Reorder at" value={threshold} onChange={e => setThreshold(name, Number(e.target.value))} min={0} />
              {low && <span className="low-flag">LOW</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
