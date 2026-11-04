import React from 'react'
import { useStore } from '../store'

const CARDS = [
  { key: 'overdueRent', label: 'Overdue Rent', tab: 'financial', filter: 'overdue' },
  { key: 'rentDueSoon', label: 'Rent Due Soon', tab: 'financial', filter: 'dueSoon' },
  { key: 'unmowed', label: 'Unmowed', tab: 'mow', filter: 'unmowed' },
  { key: 'oweMow', label: 'Owe-Mow', tab: 'mow', filter: 'oweMow' },
  { key: 'openTodos', label: 'Open To-Dos', tab: 'todo', filter: 'open' },
  { key: 'stickies', label: 'Sticky Notes', tab: 'meeting', filter: 'stickies' },
  { key: 'needsRoof', label: 'Needs Roof', tab: 'map', filter: 'needsRoof' },
  { key: 'needsWash', label: 'Needs Wash', tab: 'map', filter: 'needsWash' },
  { key: 'emptyLots', label: 'Empty Lots', tab: 'map', filter: 'empty' },
  { key: 'rentRoll', label: 'Monthly Rent Roll', tab: 'financial', filter: 'rentRoll' },
]

export default function Home() {
  const store = useStore()
  const counts = store.getHomeCounts?.() ?? CARDS.map(c => ({ ...c, count: 0 }))

  return (
    <div className="home-grid">
      {counts.map(card => (
        <button
          key={card.key}
          className="home-card"
          onClick={() => store.openTab(card.tab, card.filter)}
        >
          <span className="home-card-label">{card.label}</span>
          <span className="home-card-count">{card.count}</span>
        </button>
      ))}
    </div>
  )
}
