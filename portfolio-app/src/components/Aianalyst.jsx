import { useState, useRef, useEffect, useCallback } from 'react'
import { COLORS, FONTS } from './design-tokens'
import { fmtEur } from '../utils/format'

// ── Construeix el context del portfoli per enviar a Claude ────────────────────
function buildPortfolioContext({ investments, savings, cryptos, commodities, totalAll, totalCost, pg, pgPct }) {
  const lines = ['=== PORTFOLI DE L\'USUARI ===\n']

  lines.push(`Valor total: ${fmtEur(totalAll)}`)
  lines.push(`Capital invertit: ${fmtEur(totalCost)}`)
  lines.push(`P&G total: ${fmtEur(pg)} (${pgPct.toFixed(2)}%)\n`)

  if (investments?.length) {
    lines.push('--- INVERSIONS (ETFs / Accions) ---')
    investments.forEach(inv => {
      const qty = inv.totalQty || inv.qty || 0
      const val = qty > 0 && inv.currentPrice ? qty * inv.currentPrice : inv.totalCost || 0
      const cost = inv.totalCost || 0
      const pg = val - cost
      lines.push(`• ${inv.name} (${inv.ticker || inv.type?.toUpperCase()}) | Valor: ${fmtEur(val)} | Cost: ${fmtEur(cost)} | P&G: ${fmtEur(pg)} | Tipus: ${inv.type}`)
    })
    lines.push('')
  }

  if (cryptos?.length) {
    lines.push('--- CRIPTOMONEDES ---')
    cryptos.forEach(c => {
      const qty = c.totalQty ?? c.qty ?? 0
      const val = qty > 0 && c.currentPrice ? qty * c.currentPrice : c.totalCost || 0
      lines.push(`• ${c.name} (${c.symbol}) | Qty: ${qty.toFixed(6)} | Valor: ${fmtEur(val)} | Cost: ${fmtEur(c.totalCost || 0)}`)
    })
    lines.push('')
  }

  if (commodities?.length) {
    lines.push('--- MATÈRIES PRIMERES ---')
    commodities.forEach(c => {
      lines.push(`• ${c.name} (${c.symbol}) | Qty: ${c.totalQty || 0} ${c.unit} | Cost: ${fmtEur(c.totalCost || 0)}`)
    })
    lines.push('')
  }

  if (savings?.length) {
    lines.push('--- ESTALVIS ---')
    savings.forEach(s => {
      lines.push(`• ${s.name} | Saldo: ${fmtEur(s.amount || s.balance || 0)}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

// Prompts predefinits
const QUICK_PROMPTS = [
  { icon: '🔍', label: 'Analitza el meu portfoli', prompt: 'Fes una anàlisi completa del meu portfoli: riscos, diversificació, punts forts i punts febles. Dona recomanacions concretes per millorar-lo.' },
  { icon: '⚖️', label: 'Diversificació', prompt: 'Analitza la diversificació del meu portfoli. Estic massa concentrat en algun actiu o sector? Quins ETFs o accions podria afegir per millorar-la?' },
  { icon: '📈', label: 'Alternatives millors', prompt: 'Compara els meus actius actuals amb alternatives. Hi ha ETFs o accions similars però amb millors comissions, rendiment o exposició?' },
  { icon: '⚠️', label: 'Riscos', prompt: 'Quins són els principals riscos del meu portfoli? Considera volatilitat, concentració geogràfica, sectorial i de divises.' },
  { icon: '💡', label: 'Explica els meus actius', prompt: 'Explica breument cadascun dels actius que tinc: què fan, a quins índexs repliquen, quines empreses inclouen i per a quin perfil d\'inversor són adequats.' },
  { icon: '🎯', label: 'Estratègia a llarg termini', prompt: 'Basant-te en el meu portfoli actual, quina estratègia a llarg termini recomanaries? Hauria de fer DCA, rebalanceig periòdic, o canviar algun actiu?' },
]

const styles = `
  /* Botó flotant */
  .ai-fab {
    position: fixed;
    bottom: 92px; right: 30px;
    width: 52px; height: 52px;
    border-radius: 50%;
    background: ${COLORS.neonPurple};
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(123,97,255,0.45);
    z-index: 40;
    transition: transform 150ms, box-shadow 150ms, background 150ms;
    -webkit-tap-highlight-color: transparent;
  }
  .ai-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(123,97,255,0.60); }
  .ai-fab:active { transform: scale(0.96); }
  .ai-fab.open { background: ${COLORS.elevated}; border: 1px solid ${COLORS.border}; box-shadow: none; }
  .ai-fab-pulse {
    position: absolute; inset: -4px; border-radius: 50%;
    background: ${COLORS.neonPurple};
    animation: aiFabPulse 2.5s ease-out infinite;
    opacity: 0; z-index: -1;
  }
  @keyframes aiFabPulse {
    0%   { transform: scale(1); opacity: 0.4; }
    100% { transform: scale(1.7); opacity: 0; }
  }

  /* Panel */
  .ai-panel {
    position: fixed;
    bottom: 88px; right: 24px;
    width: min(420px, calc(100vw - 48px));
    height: min(640px, calc(100dvh - 120px));
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    display: flex; flex-direction: column;
    z-index: 40;
    overflow: hidden;
    animation: aiPanelIn 180ms cubic-bezier(0.34,1.4,0.64,1);
    box-shadow: 0 16px 48px rgba(0,0,0,0.50);
  }
  @keyframes aiPanelIn {
    from { opacity: 0; transform: scale(0.94) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Header */
  .ai-hdr {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px; border-bottom: 1px solid ${COLORS.border};
    flex-shrink: 0;
  }
  .ai-hdr-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(123,97,255,0.15); border: 1px solid rgba(123,97,255,0.30);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ai-hdr-title { font-family: ${FONTS.sans}; font-size: 13px; font-weight: 600; color: ${COLORS.textPrimary}; flex: 1; }
  .ai-hdr-sub   { font-family: ${FONTS.sans}; font-size: 10px; color: ${COLORS.textMuted}; margin-top: 1px; }
  .ai-hdr-close {
    width: 24px; height: 24px; border-radius: 3px; background: transparent;
    border: 1px solid ${COLORS.border}; color: ${COLORS.textMuted}; font-size: 14px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all 100ms; flex-shrink: 0;
  }
  .ai-hdr-close:hover { border-color: ${COLORS.borderHi}; color: ${COLORS.textPrimary}; }

  /* Missatges */
  .ai-msgs {
    flex: 1; overflow-y: auto; padding: 14px 16px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .ai-msgs::-webkit-scrollbar { width: 4px; }
  .ai-msgs::-webkit-scrollbar-track { background: transparent; }
  .ai-msgs::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }

  .ai-msg { display: flex; gap: 8px; animation: aiMsgIn 200ms ease; }
  @keyframes aiMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .ai-msg-av {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
  }
  .ai-msg-av.user { background: rgba(123,97,255,0.20); color: ${COLORS.neonPurple}; }
  .ai-msg-av.ai   { background: rgba(0,255,136,0.12); color: ${COLORS.neonGreen}; }

  .ai-msg-body { flex: 1; min-width: 0; }
  .ai-msg-name { font-size: 10px; font-weight: 500; color: ${COLORS.textMuted}; margin-bottom: 4px; font-family: ${FONTS.sans}; text-transform: uppercase; letter-spacing: 0.08em; }

  .ai-bubble {
    font-family: ${FONTS.sans}; font-size: 12px; line-height: 1.65;
    color: ${COLORS.textSecondary}; padding: 10px 12px;
    border-radius: 4px; background: ${COLORS.elevated};
    border: 1px solid ${COLORS.border};
  }
  .ai-bubble.user { background: rgba(123,97,255,0.10); border-color: rgba(123,97,255,0.20); color: ${COLORS.textPrimary}; }
  .ai-bubble strong { color: ${COLORS.textPrimary}; font-weight: 600; }
  .ai-bubble em { color: ${COLORS.neonGreen}; font-style: normal; }

  /* Typing */
  .ai-typing { display: flex; align-items: center; gap: 3px; padding: 10px 12px; }
  .ai-typing span {
    width: 5px; height: 5px; border-radius: 50%; background: ${COLORS.neonPurple};
    animation: aiDot 1.2s ease-in-out infinite;
  }
  .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
  .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes aiDot { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

  /* Quick prompts */
  .ai-quick { padding: 8px 16px 10px; border-top: 1px solid ${COLORS.border}; flex-shrink: 0; }
  .ai-quick-title { font-size: 9px; font-weight: 500; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.10em; margin-bottom: 7px; font-family: ${FONTS.sans}; }
  .ai-quick-chips { display: flex; gap: 5px; flex-wrap: wrap; }
  .ai-quick-chip {
    display: flex; align-items: center; gap: 4px;
    font-family: ${FONTS.sans}; font-size: 10px; font-weight: 500;
    color: ${COLORS.textSecondary}; background: ${COLORS.elevated};
    border: 1px solid ${COLORS.border}; border-radius: 3px;
    padding: 4px 8px; cursor: pointer; transition: all 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .ai-quick-chip:hover { border-color: ${COLORS.neonPurple}; color: ${COLORS.neonPurple}; background: rgba(123,97,255,0.08); }

  /* Input */
  .ai-input-row {
    display: flex; gap: 8px; padding: 12px 16px;
    border-top: 1px solid ${COLORS.border}; flex-shrink: 0;
    background: ${COLORS.surface};
  }
  .ai-input {
    flex: 1; background: ${COLORS.bg}; border: 1px solid ${COLORS.border};
    border-radius: 5px; padding: 9px 12px;
    font-family: ${FONTS.sans}; font-size: 13px; color: ${COLORS.textPrimary};
    outline: none; resize: none; height: 38px; line-height: 1.4;
    transition: border-color 120ms; overflow: hidden;
  }
  .ai-input:focus { border-color: ${COLORS.neonPurple}; }
  .ai-input::placeholder { color: ${COLORS.textMuted}; }
  .ai-send {
    width: 38px; height: 38px; border-radius: 5px; border: none;
    background: ${COLORS.neonPurple}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: opacity 100ms; flex-shrink: 0;
  }
  .ai-send:hover { opacity: 0.85; }
  .ai-send:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Error */
  .ai-error { font-size: 11px; color: ${COLORS.neonRed}; background: ${COLORS.bgRed}; border: 1px solid ${COLORS.borderRed}; border-radius: 4px; padding: 8px 10px; margin: 0 16px 10px; }

  /* Welcome */
  .ai-welcome { text-align: center; padding: 20px 16px; }
  .ai-welcome-icon { font-size: 32px; margin-bottom: 10px; }
  .ai-welcome-title { font-size: 14px; font-weight: 600; color: ${COLORS.textPrimary}; margin-bottom: 6px; font-family: ${FONTS.sans}; }
  .ai-welcome-sub { font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.6; font-family: ${FONTS.sans}; }
`

// Formata la resposta de Claude (markdown bàsic)
function formatResponse(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, `<code style="font-family:${FONTS.mono};font-size:11px;background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:2px">$1</code>`)
    .replace(/^#{1,3}\s+(.+)$/gm, `<strong style="display:block;margin-top:8px;color:var(--text-primary)">$1</strong>`)
    .replace(/^[-•]\s+(.+)$/gm, `<div style="display:flex;gap:6px;margin-top:3px"><span style="color:#7b61ff;flex-shrink:0">•</span><span>$1</span></div>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const SYSTEM_PROMPT = `Ets un assessor financer expert i analista de portfolis. Parles en català de manera clara, directa i professional.

Tens accés a les dades reals del portfoli de l'usuari. Quan analitzis:
- Sigues concret i específic, referència els actius reals de l'usuari
- Dona recomanacions accionables, no generals
- Explica els riscos amb claredat però sense alarmar innecessàriament
- Si suggeresixes alternatives, explica per què serien millors
- Usa emojis amb moderació per estructurar la resposta
- Limita les respostes a 400 paraules màxim per ser concis

IMPORTANT: No ets un assessor financer regulat. Recorda sempre a l'usuari que les teves anàlisis són informatives i no constitueixen assessorament financer professional.`

export default function AIAnalyst({ investments = [], savings = [], cryptos = [], commodities = [], totalAll = 0, totalCost = 0, pg = 0, pgPct = 0 }) {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [hasGreeted, setHasGreeted] = useState(false)
  const msgsEndRef = useRef(null)
  const inputRef   = useRef(null)

  const scrollToBottom = () => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [msgs, loading])

  const portfolioContext = buildPortfolioContext({ investments, savings, cryptos, commodities, totalAll, totalCost, pg, pgPct })

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    setError('')

    const userMsg = { role: 'user', content: text.trim() }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `${SYSTEM_PROMPT}\n\n${portfolioContext}`,
          messages: newMsgs,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Error ${res.status}`)
      }

      const data = await res.json()
      const reply = data.content?.find(b => b.type === 'text')?.text || ''

      setMsgs(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
    setLoading(false)
  }, [msgs, loading, portfolioContext])

  const handleOpen = () => {
    setOpen(true)
    if (!hasGreeted) {
      setHasGreeted(true)
      setTimeout(() => {
        setMsgs([{
          role: 'assistant',
          content: `Hola! Soc el teu assessor financer IA. Tinc accés al teu portfoli (${fmtEur(totalAll)} en total) i puc ajudar-te a analitzar-lo, identificar riscos, comparar alternatives i respondre qualsevol pregunta sobre inversions.\n\nPer on vols començar? Pots usar les opcions ràpides o fer-me qualsevol pregunta.`,
        }])
      }, 300)
    }
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <>
      <style>{styles}</style>

      {/* Panel */}
      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-hdr">
            <div className="ai-hdr-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonPurple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <div>
              <p className="ai-hdr-title">Assessor AI</p>
              <p className="ai-hdr-sub">Powered by Claude · Portfoli de {fmtEur(totalAll)}</p>
            </div>
            <button className="ai-hdr-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {/* Missatges */}
          <div className="ai-msgs">
            {msgs.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>
                <p className="ai-welcome-title">El teu assessor financer personal</p>
                <p className="ai-welcome-sub">Analitzo el teu portfoli en temps real i respono qualsevol pregunta sobre inversions en català.</p>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className="ai-msg">
                <div className={`ai-msg-av ${m.role === 'user' ? 'user' : 'ai'}`}>
                  {m.role === 'user' ? 'Tu' : 'AI'}
                </div>
                <div className="ai-msg-body">
                  <p className="ai-msg-name">{m.role === 'user' ? 'Tu' : 'Claude'}</p>
                  <div className={`ai-bubble${m.role === 'user' ? ' user' : ''}`}
                    dangerouslySetInnerHTML={{ __html: formatResponse(m.content) }}/>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg">
                <div className="ai-msg-av ai">AI</div>
                <div className="ai-msg-body">
                  <p className="ai-msg-name">Claude</p>
                  <div className="ai-bubble">
                    <div className="ai-typing">
                      <span/><span/><span/>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={msgsEndRef}/>
          </div>

          {/* Error */}
          {error && <p className="ai-error">{error}</p>}

          {/* Quick prompts */}
          {msgs.length <= 1 && (
            <div className="ai-quick">
              <p className="ai-quick-title">Suggeriments</p>
              <div className="ai-quick-chips">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} className="ai-quick-chip" onClick={() => sendMessage(q.prompt)}>
                    {q.icon} {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="ai-input-row">
            <textarea ref={inputRef} className="ai-input" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pregunta'm qualsevol cosa sobre el teu portfoli..."
              rows={1}/>
            <button className="ai-send" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className={`ai-fab${open ? ' open' : ''}`} onClick={open ? () => setOpen(false) : handleOpen}>
        {!open && <div className="ai-fab-pulse"/>}
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h8M8 14h5"/>
          </svg>
        )}
      </button>
    </>
  )
}