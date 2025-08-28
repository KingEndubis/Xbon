'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Deal {
  id: string
  title: string
  commodity: string
  exclusivity: string
  quantityKg: number
  pricePerKg: number
  location: string
  createdBy: string
  createdAt: string
  inviteLink?: string
}

interface Agent {
  id: string
  name: string
  parentAgentId?: string
}

export default function JoinDealPage() {
  const params = useParams()
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  const inviteCode = params.code as string

  useEffect(() => {
    async function fetchDealAndAgents() {
      try {
        // Fetch deal by invite code
        const dealRes = await fetch(`${API_URL}/deals/invite/${inviteCode}`)
        if (!dealRes.ok) throw new Error('Invalid invitation link')
        const dealData = await dealRes.json()
        setDeal(dealData)

        // Fetch available agents
        const agentsRes = await fetch(`${API_URL}/agents`)
        const agentsData = await agentsRes.json()
        setAgents(agentsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load deal information')
      } finally {
        setLoading(false)
      }
    }

    if (inviteCode) {
      fetchDealAndAgents()
    }
  }, [inviteCode])

  async function handleJoinDeal() {
    if (!selectedAgent) {
      setError('Please select an agent')
      return
    }

    setJoining(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/deals/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          agentId: selectedAgent
        })
      })

      if (!res.ok) throw new Error('Failed to join deal')

      // Redirect to main dashboard
      router.push('/?joined=true')
    } catch (err: any) {
      setError(err.message || 'Failed to join deal')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading invitation...</div>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <h1 className="text-white text-xl font-semibold mb-4">Invalid Invitation</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🤝</div>
          <h1 className="text-white text-2xl font-bold mb-2">Exclusive Deal Invitation</h1>
          <p className="text-gray-300">You've been invited to join a premium commodity deal</p>
        </div>

        {deal && (
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <h2 className="text-white text-xl font-semibold mb-4">{deal.title}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Commodity:</span>
                <span className="text-white ml-2 capitalize">{deal.commodity}</span>
              </div>
              <div>
                <span className="text-gray-400">Exclusivity:</span>
                <span className="text-white ml-2 capitalize">{deal.exclusivity}</span>
              </div>
              <div>
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white ml-2">{deal.quantityKg.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-gray-400">Price:</span>
                <span className="text-white ml-2">${deal.pricePerKg.toLocaleString()}/kg</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Location:</span>
                <span className="text-white ml-2">{deal.location}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Select Your Agent Profile
          </label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} className="bg-slate-800">
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleJoinDeal}
            disabled={joining || !selectedAgent}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
          >
            {joining ? 'Joining...' : 'Join Deal'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            This is an exclusive invitation. By joining, you become part of a verified network of commodity professionals.
          </p>
        </div>
      </div>
    </div>
  )
}