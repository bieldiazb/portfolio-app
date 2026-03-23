import { useState, useEffect } from 'react'

const STORAGE_KEY = 'portfolio_v1'

const DEFAULT_STATE = {
  investments: [
    { id: 1, name: 'Flexible Cash Funds', ticker: '', type: 'efectiu', initialValue: 1368, currentPrice: 1368, note: '1.81% APY' },
    { id: 2, name: 'Instant Access Savings', ticker: '', type: 'estalvi', initialValue: 2686, currentPrice: 2686, note: '1.5% NIR' },
    { id: 3, name: 'iShares Core MSCI World ETF', ticker: 'IWDA.AS', type: 'etf', initialValue: 1100, currentPrice: null },
    { id: 4, name: 'Vanguard S&P 500 ETF', ticker: 'VUSA.AS', type: 'etf', initialValue: 651, currentPrice: null },
    { id: 5, name: 'iShares Emerging Markets ETF', ticker: 'EIMI.AS', type: 'etf', initialValue: 438, currentPrice: null },
    { id: 6, name: 'Lockheed Martin', ticker: 'LMT', type: 'stock', initialValue: 364, currentPrice: null },
    { id: 7, name: 'Revolut Robo Advisor', ticker: '', type: 'robo', initialValue: 220, currentPrice: 220, note: '6.5% esperat' },
  ],
  savings: [],
  lastUpdated: null,
}

export function usePortfolioStore() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_STATE
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const addInvestment = (inv) => {
    setState(prev => ({
      ...prev,
      investments: [...prev.investments, { ...inv, id: Date.now() }]
    }))
  }

  const removeInvestment = (id) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id)
    }))
  }

  const updatePrice = (id, price) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.map(i => i.id === id ? { ...i, currentPrice: price } : i),
      lastUpdated: new Date().toISOString()
    }))
  }

  const addSavings = (s) => {
    setState(prev => ({
      ...prev,
      savings: [...prev.savings, { ...s, id: Date.now() }]
    }))
  }

  const removeSavings = (id) => {
    setState(prev => ({
      ...prev,
      savings: prev.savings.filter(s => s.id !== id)
    }))
  }

  return { state, addInvestment, removeInvestment, updatePrice, addSavings, removeSavings }
}
