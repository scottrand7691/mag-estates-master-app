import React, { useState } from 'react'
import { useStore } from '../store'

const CATEGORIES = ['Plumbing', 'Electrical', 'Roof', 'AC', 'Appliance', 'General']
const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency']
const STATUSES = ['Open', 'In Progress', 'Done']

export default function Handyman() {
  const store = useStore()
  const jobs = store.maintJobs ?? []
  const [filter, setFilter] = useState('Open')
  const [newJob, setNewJob] = useState({ lot: '', category: 'General', description: '', priority: 'Medium' })

  const visible = jobs.filter(j => j.status === filter)

  const addJob = () => {
    if (!newJob.lot || !newJob.description) return
    store.addMaintJob({ ...newJob, id: Date.now().toString(), opened: new Date().toISOString(), status: 'Open' })
    setNewJob({ lot: '', category: 'General', description: '', priority: 'Medium' })
  }

  const startJob = (id: string) => store.updateMaintJob(id, { status: 'In Progress', started: new Date().toISOString() })
  const doneJob = (id: string) => store.updateMaintJob(id, { status: 'Done', finished: new Date().toISOString() })

  return (
    <div className="handyman">
      <div className="handyman-add">
        <input placeholder="Lot #" value={newJob.lot} onChange={e => setNewJob({ ...newJob, lot: e.target.value })} />
        <select value={newJob.category} onChange={e => setNewJob({ ...newJob, category: e.target.value })}
        >{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
        <input placeholder="Description" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} />
        <select value={newJob.priority} onChange={e => setNewJob({ ...newJob, priority: e.target.value })}
        >{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
        <button onClick={addJob}>Add Job</button>
      </div>
      <div className="handyman-filters">{STATUSES.map(s => <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>)}</div>
      <div className="handyman-board">
        {visible.map(job => (
          <div key={job.id} className={`job-card priority-${job.priority.toLowerCase()}`}
          >
            <div className="job-header"><strong>Lot {job.lot}</strong> <span>{job.category}</span> <span>{job.priority}</span></div>
            <p>{job.description}</p>
            <small>Opened {new Date(job.opened).toLocaleDateString()}</small>
            {job.status === 'Open' && <button onClick={() => startJob(job.id)} className="btn-start">Start</button>}
            {job.status === 'In Progress' && <button onClick={() => doneJob(job.id)} className="btn-done">Done</button>}
            {job.started && <small>Started {new Date(job.started).toLocaleString()}</small>}
            {job.finished && <small>Done {new Date(job.finished).toLocaleString()}</small>}
          </div>
        ))}
      </div>
    </div>
  )
}
