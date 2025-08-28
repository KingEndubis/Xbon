"use client"
// Updated: Testing GitHub Actions deployment
import { useEffect, useMemo, useState } from "react"
import SignIn, { User } from "../components/SignIn"

type DealStatus =
  | "initiated"
  | "kYC"
  | "contracted"
  | "inspection"
  | "payment"
  | "shipped"
  | "closed"
  | "cancelled"

type Agent = { id: string; name: string; parentAgentId?: string }

type Commodity = "gold" | "silver" | "oil" | "diamond"

type Exclusivity = "standard" | "exclusive" | "premier"

interface Document {
  id: string
  name: string
  type: string
  category?: 'mandate' | 'contract' | 'certificate' | 'proof_of_funds' | 'other'
  uploadedAt: string
  uploadedBy: string
  aiVerificationStatus?: 'pending' | 'verified' | 'rejected' | 'redacted'
  redactedContent?: string
  originalPrincipalInfo?: string
}

interface Deal {
  id: string
  title: string
  commodity: Commodity
  exclusivity: Exclusivity
  quantityKg: number
  pricePerKg: number
  location: string
  encryptedDetails?: string
  iv?: string
  chain: string[]
  status: DealStatus
  history: { status: DealStatus; at: string }[]
  documents: Document[]
  inviteLink?: string
  createdAt: string
  createdBy: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const statuses: DealStatus[] = [
  "initiated",
  "kYC",
  "contracted",
  "inspection",
  "payment",
  "shipped",
  "closed",
  "cancelled",
]

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)

  // Agent form state
  const [agentName, setAgentName] = useState("")
  const [parentAgentId, setParentAgentId] = useState<string>("")

  // Deal form state
  const [title, setTitle] = useState("")
  const [commodity, setCommodity] = useState<Commodity>("gold")
  const [exclusivity, setExclusivity] = useState<Exclusivity>("exclusive")
  const [quantityKg, setQuantityKg] = useState<number>(0)
  const [pricePerKg, setPricePerKg] = useState<number>(0)
  const [location, setLocation] = useState("")
  const [details, setDetails] = useState("")
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [chain, setChain] = useState<string[]>([])

  // Document upload state
  const [selectedDealId, setSelectedDealId] = useState('')
  const [documentCategory, setDocumentCategory] = useState<'mandate' | 'contract' | 'certificate' | 'proof_of_funds' | 'other'>('mandate')
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller'>('broker')
  const [inviteDealId, setInviteDealId] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  const chainAgents = useMemo(
    () => chain.map((id) => agents.find((a) => a.id === id)?.name || id),
    [chain, agents]
  )

  const totals = useMemo(() => {
    const count = deals.length
    const volume = deals.reduce((s, d) => s + (d.quantityKg || 0), 0)
    const value = deals.reduce(
      (s, d) => s + ((d.quantityKg || 0) * (d.pricePerKg || 0)),
      0
    )
    const byStatus = statuses.reduce((acc, s) => {
      acc[s] = deals.filter((d) => d.status === s).length
      return acc
    }, {} as Record<DealStatus, number>)
    return { count, volume, value, byStatus }
  }, [deals])

  async function fetchAgents() {
    const res = await fetch(`${API_URL}/agents`)
    const data = await res.json()
    setAgents(data)
  }

  async function fetchDeals() {
    const res = await fetch(`${API_URL}/deals`)
    const data = await res.json()
    setDeals(data)
  }

  useEffect(() => {
    // bootstrap auth
    const t = localStorage.getItem("auth_token")
    const u = localStorage.getItem("auth_user")
    if (t && u) {
      try {
        setUser(JSON.parse(u))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([fetchAgents(), fetchDeals()])
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [user])

  function handleSignedIn(u: { id: string; name: string; email: string }, t: string) {
    setUser(u)
    localStorage.setItem("auth_token", t)
    localStorage.setItem("auth_user", JSON.stringify(u))
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, parentAgentId: parentAgentId || undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAgentName("")
      setParentAgentId("")
      await fetchAgents()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create agent")
    }
  }

  function addToChain() {
    if (!selectedAgentId) return
    setChain((prev) => [...prev, selectedAgentId])
    setSelectedAgentId("")
  }
  function removeFromChain(idx: number) {
    setChain((prev) => prev.filter((_, i) => i !== idx))
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(`${API_URL}/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          commodity,
          exclusivity,
          quantityKg: Number(quantityKg),
          pricePerKg: Number(pricePerKg),
          location,
          details,
          participants: chain,
          createdBy: user?.email || 'Unknown User',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setTitle("")
      setQuantityKg(0)
      setPricePerKg(0)
      setLocation("")
      setDetails("")
      setChain([])
      setCommodity("gold")
      setExclusivity("exclusive")
      await fetchDeals()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create deal")
    }
  }

  async function updateStatus(id: string, status: DealStatus) {
    try {
      const res = await fetch(`${API_URL}/deals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await res.text())
      await fetchDeals()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  async function uploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDealId) return
    
    const fileInput = document.getElementById('document-file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploadingDoc(true)
    setError('')

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const res = await fetch(`${API_URL}/deals/${selectedDealId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          category: documentCategory,
          content: base64.split(',')[1], // Remove data:type;base64, prefix
          uploadedBy: user?.name || 'Unknown User'
        })
      })

      if (!res.ok) throw new Error('Failed to upload document')
      
      // Reset form
      fileInput.value = ''
      setSelectedDealId('')
      await fetchDeals()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload document')
    } finally {
      setUploadingDoc(false)
    }
  }

  async function sendInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return

    setSendingInvite(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          dealId: inviteDealId || undefined,
          invitedBy: 'king-endubis-id', // Current user ID
          invitedByName: 'King Endubis'
        })
      })

      if (!res.ok) throw new Error('Failed to send invitation')
      
      // Reset form
      setInviteEmail('')
      setInviteRole('agent')
      setInviteDealId('')
      alert('Invitation sent successfully!')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  function copyInviteLink(link: string) {
    navigator.clipboard.writeText(link)
    alert('Invitation link copied to clipboard!')
  }

  const brandAccent = useMemo(() => {
    switch (commodity) {
      case "gold":
        return "from-black via-gray-900 to-amber-600"
      case "silver":
        return "from-black via-gray-900 to-slate-400"
      case "oil":
        return "from-black via-gray-900 to-emerald-600"
      case "diamond":
        return "from-black via-gray-900 to-cyan-500"
      default:
        return "from-black via-gray-900 to-amber-600"
    }
  }, [commodity])

  if (!user) {
    return <SignIn onSignIn={handleSignedIn} />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className={`sticky top-0 z-10 bg-gradient-to-r ${brandAccent} text-white border-b border-black/10 shadow`}>
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <defs>
                <linearGradient id="lux" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f59e0b"/>
                  <stop offset="1" stopColor="#fde68a"/>
                </linearGradient>
              </defs>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="url(#lux)"/>
            </svg>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">X Bon</h1>
              {/* Removed tagline for discretion */}
              {/* <div className="text-[11px] opacity-75 -mt-0.5">Luxury Commodities Exchange</div> */}
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#dashboard" className="hover:underline underline-offset-4">Dashboard</a>
            <a href="#agents" className="hover:underline underline-offset-4">Agents</a>
            <a href="#create-deal" className="hover:underline underline-offset-4">Create Deal</a>
            <a href="#deals" className="hover:underline underline-offset-4">Active Deals</a>
            <a href="#documents" className="hover:underline underline-offset-4">Documents</a>
            <a href="#invitations" className="hover:underline underline-offset-4">Invitations</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-8">
        <section className="text-center py-16">
          <div className="mb-6">
            <div className="text-6xl mb-4">💎</div>
            <h1 className="text-4xl font-bold mb-4">X Bon</h1>
            <p className="text-xl text-gray-600 mb-4">Exclusive Commodities Exchange</p>
            <div className="text-sm text-gray-500 mb-8">
              <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                🔒 Members Only • 🤝 Verified Network • 🌍 Global Reach
              </span>
            </div>
            <div className="text-xs text-gray-400 max-w-md mx-auto">
              Access granted exclusively through verified member invitations. 
              Join a discreet network of commodity professionals worldwide.
            </div>
          </div>
        </section>

        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <section id="dashboard" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm hover:shadow transition-shadow">
            <div className="text-xs uppercase text-gray-500">Total Deals</div>
            <div className="mt-1 text-2xl font-semibold">{totals.count}</div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm hover:shadow transition-shadow">
            <div className="text-xs uppercase text-gray-500">Volume</div>
            <div className="mt-1 text-2xl font-semibold">{totals.volume.toLocaleString()} kg</div>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm hover:shadow transition-shadow">
            <div className="text-xs uppercase text-gray-500">Value</div>
            <div className="mt-1 text-2xl font-semibold">${totals.value.toLocaleString()}</div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Pipeline</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {statuses.map((s) => (
              <div key={s} className="rounded border p-2 text-center">
                <div className="text-[11px] uppercase text-gray-500">{s}</div>
                <div className="text-lg font-semibold">{totals.byStatus[s]}</div>
              </div>
            ))}
          </div>
        </section>
        {/* replaced by wrapper: opening card div now inside wrapper section */}
        {/* Wrap Create Agent + Create Deal cards */}
        <section className="rounded-lg p-0 grid grid-cols-1 sm:grid-cols-2 gap-4 border-0">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-medium text-lg mb-3">Create Agent</h2>
            <form onSubmit={createAgent} className="grid gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
              <select
                className="border rounded px-3 py-2"
                value={parentAgentId}
                onChange={(e) => setParentAgentId(e.target.value)}
              >
                <option value="">No parent (principal)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    Parent: {a.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800"
              >
                Add Agent
              </button>
            </form>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="font-medium text-lg mb-3">Create Deal</h2>
            <form onSubmit={createDeal} className="grid gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Title (e.g., Ghana dore bars)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Quantity (kg)"
                  type="number"
                  min={0}
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  required
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Price per kg (USD)"
                  type="number"
                  min={0}
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(Number(e.target.value))}
                  required
                />
              </div>
              <input
                className="border rounded px-3 py-2"
                placeholder="Location (city, country)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <textarea
                className="border rounded px-3 py-2"
                placeholder="Private details (encrypted at rest)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
              <div className="grid gap-2">
                <div className="text-sm text-gray-600">Broker chain (ordered)</div>
                <div className="flex gap-2">
                  <select
                    className="border rounded px-3 py-2 flex-1"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                  >
                    <option value="">Select agent to add</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addToChain}
                    className="border rounded px-3 py-2 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                {chain.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chainAgents.map((name, idx) => (
                      <span
                        key={`${name}-${idx}`}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm"
                      >
                        <span className="font-medium">{idx + 1}.</span> {name}
                        <button
                          type="button"
                          className="text-gray-500 hover:text-black"
                          onClick={() => removeFromChain(idx)}
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800"
                disabled={chain.length === 0}
                title={chain.length === 0 ? "Add at least one participant" : ""}
              >
                Create Deal
              </button>
            </form>
          </div>
        </section>

        {/* Document Upload Section */}
        <section id="documents" className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-medium text-lg mb-3">📄 Upload Document</h2>
          <form onSubmit={uploadDocument} className="grid gap-3">
            <select
              className="border rounded px-3 py-2"
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              required
            >
              <option value="">Select deal...</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={documentCategory}
              onChange={(e) => setDocumentCategory(e.target.value as 'mandate' | 'contract' | 'certificate' | 'proof_of_funds' | 'other')}
            >
              <option value="mandate">Mandate</option>
              <option value="contract">Contract</option>
              <option value="certificate">Certificate</option>
              <option value="proof_of_funds">Proof of Funds</option>
              <option value="other">Other</option>
            </select>
            <input
              id="document-file"
              type="file"
              className="border rounded px-3 py-2"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
            />
            <button
              type="submit"
              disabled={uploadingDoc || !selectedDealId}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploadingDoc ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </section>

        {/* Invitation Section */}
        <section id="invitations" className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="font-medium text-lg mb-3">💎 Invite New Member</h2>
          <form onSubmit={sendInvitation} className="grid gap-3">
            <input
              type="email"
              className="border rounded px-3 py-2"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className="border rounded px-3 py-2"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller')}
            >
              <option value="introducer">Introducer</option>
              <option value="broker">Broker</option>
              <option value="mandate">Mandate</option>
              <option value="principal_buyer">Principal Buyer</option>
              <option value="principal_seller">Principal Seller</option>
            </select>
            <select
              className="border rounded px-3 py-2"
              value={inviteDealId}
              onChange={(e) => setInviteDealId(e.target.value)}
            >
              <option value="">General invitation (no specific deal)</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  Invite for: {d.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={sendingInvite}
              className="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700 disabled:bg-gray-400"
            >
              {sendingInvite ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
          <div className="mt-3 text-xs text-gray-500">
            💎 Exclusive access - Only verified members can invite others
          </div>
        </section>
        <section id="deals" className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-lg">Deals</h2>
            <button
              onClick={() => fetchDeals()}
              className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
          {deals.length === 0 ? (
            <div className="text-sm text-gray-600">No deals yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Commodity</th>
                    <th className="py-2 pr-4">Exclusivity</th>
                    <th className="py-2 pr-4">Qty (kg)</th>
                    <th className="py-2 pr-4">Price/kg</th>
                    <th className="py-2 pr-4">Location</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Chain</th>
                    <th className="py-2 pr-4">Documents</th>
                    <th className="py-2 pr-4">Invite Link</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id} className="border-b align-top">
                      <td className="py-2 pr-4 font-medium">
                        {d.title}
                        <div className="text-[11px] text-gray-500 mt-1">
                          Created by {d.createdBy} • {new Date(d.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-2 pr-4 capitalize">{d.commodity}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          d.exclusivity === 'premier' ? 'bg-purple-100 text-purple-800' :
                          d.exclusivity === 'exclusive' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {d.exclusivity}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{d.quantityKg.toLocaleString()}</td>
                      <td className="py-2 pr-4">${d.pricePerKg.toLocaleString()}</td>
                      <td className="py-2 pr-4">{d.location}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          d.status === 'closed' ? 'bg-green-100 text-green-800' :
                          d.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          d.status === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {d.status}
                        </span>
                        <div className="mt-1 text-[11px] text-gray-500">updated {new Date(d.history.at(-1)?.at || d.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <ol className="list-decimal ml-4">
                          {d.chain.map((id, idx) => (
                            <li key={id + idx} className="text-gray-700 text-xs">
                              {agents.find((a) => a.id === id)?.name || id}
                            </li>
                          ))}
                        </ol>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{d.documents?.length || 0}</span>
                          <span className="text-xs text-gray-500">docs</span>
                        </div>
                        {d.documents && d.documents.length > 0 && (
                          <div className="mt-1">
                            {d.documents.slice(0, 2).map((doc) => (
                              <div key={doc.id} className="text-[10px] text-gray-600 truncate">
                                📄 {doc.name}
                              </div>
                            ))}
                            {d.documents.length > 2 && (
                              <div className="text-[10px] text-gray-500">+{d.documents.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {d.inviteLink ? (
                          <button
                            onClick={() => copyInviteLink(d.inviteLink!)}
                            className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded transition-colors"
                            title="Copy invitation link"
                          >
                            🔗 Copy Link
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No link</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-col gap-1">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            defaultValue={d.status}
                            onChange={(e) => updateStatus(d.id, e.target.value as DealStatus)}
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-gray-500">
        <div className="mb-4">
          <a 
            href="https://xbon-gold-exchange.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-700 hover:to-amber-600 transition-all"
          >
            🌐 Visit Live Website
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        Built for secure, transparent broker chains across gold mines and refineries worldwide.
      </footer>
    </div>
  )
}

// Deployment trigger: 2025-08-28T09:54:11.586Z
// Deployment trigger: 2025-08-28T23:12:06.694Z