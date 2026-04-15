import { useState, useRef, useEffect, useCallback } from 'react'
import { COLORS, FONTS } from './design-tokens'
import { fmtEur } from '../utils/format'

function buildPortfolioContext({ investments, savings, cryptos, commodities, totalAll, totalCost, pg, pgPct }) {
  const lines = ['=== PORTFOLI DE L\'USUARI ===\n']
  lines.push(`Valor total: ${fmtEur(totalAll)}`)
  lines.push(`Capital invertit: ${fmtEur(totalCost)}`)
  lines.push(`P&G total: ${fmtEur(pg)} (${pgPct.toFixed(2)}%)\n`)
  if (investments?.length) {
    lines.push('--- INVERSIONS ---')
    investments.forEach(inv => {
      const qty = inv.totalQty||inv.qty||0
      const val = qty>0&&inv.currentPrice?qty*inv.currentPrice:inv.totalCost||0
      lines.push(`• ${inv.name} (${inv.ticker||inv.type?.toUpperCase()}) | Valor: ${fmtEur(val)} | Cost: ${fmtEur(inv.totalCost||0)} | P&G: ${fmtEur(val-(inv.totalCost||0))} | Tipus: ${inv.type}`)
    })
    lines.push('')
  }
  if (cryptos?.length) {
    lines.push('--- CRIPTOMONEDES ---')
    cryptos.forEach(c => {
      const qty=c.totalQty??c.qty??0
      const val=qty>0&&c.currentPrice?qty*c.currentPrice:c.totalCost||0
      lines.push(`• ${c.name} (${c.symbol}) | Qty: ${qty.toFixed(6)} | Valor: ${fmtEur(val)} | Cost: ${fmtEur(c.totalCost||0)}`)
    })
    lines.push('')
  }
  if (commodities?.length) {
    lines.push('--- MATÈRIES PRIMERES ---')
    commodities.forEach(c => lines.push(`• ${c.name} (${c.symbol}) | Qty: ${c.totalQty||0} ${c.unit} | Cost: ${fmtEur(c.totalCost||0)}`))
    lines.push('')
  }
  if (savings?.length) {
    lines.push('--- ESTALVIS ---')
    savings.forEach(s => lines.push(`• ${s.name} | Saldo: ${fmtEur(s.amount||s.balance||0)}`))
  }
  return lines.join('\n')
}

const QUICK_PROMPTS = [
  { icon:'🔍', label:'Analitza el portfoli',     prompt:'Fes una anàlisi completa del meu portfoli: riscos, diversificació, punts forts i febles. Dona recomanacions concretes per millorar-lo.' },
  { icon:'⚖️', label:'Diversificació',            prompt:'Analitza la diversificació del meu portfoli. Estic massa concentrat en algun actiu o sector? Quins ETFs podria afegir?' },
  { icon:'📈', label:'Alternatives millors',      prompt:'Compara els meus actius amb alternatives similars però amb millors comissions o rendiment.' },
  { icon:'⚠️', label:'Riscos',                    prompt:'Quins són els principals riscos del meu portfoli? Considera volatilitat, concentració geogràfica i sectorial.' },
  { icon:'💡', label:'Explica els actius',        prompt:'Explica breument cadascun dels meus actius: què fan, quins índexs repliquen i per a quin perfil inversor.' },
  { icon:'🎯', label:'Estratègia a llarg termini',prompt:'Basant-te en el meu portfoli, quina estratègia a llarg termini recomanaries? DCA, rebalanceig o canvis?' },
]

const SYSTEM_PROMPT = `Ets un assessor financer expert i analista de portfolis. Parles en català de manera clara, directa i professional.
Tens accés a les dades reals del portfoli de l'usuari. Quan analitzis:
- Sigues concret i específic, referència els actius reals de l'usuari
- Dona recomanacions accionables, no generals
- Explica els riscos amb claredat però sense alarmar innecessàriament
- Usa emojis amb moderació per estructurar la resposta
- Limita les respostes a 400 paraules màxim per ser concis
IMPORTANT: No ets un assessor financer regulat. Recorda que les teves anàlisis són informatives i no constitueixen assessorament financer professional.`

function formatResponse(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, `<code style="font-family:'Geist Mono',monospace;font-size:11px;background:var(--c-surface);padding:1px 4px;border-radius:2px">$1</code>`)
    .replace(/^#{1,3}\s+(.+)$/gm, `<strong style="display:block;margin-top:8px">$1</strong>`)
    .replace(/^[-•]\s+(.+)$/gm, `<div style="display:flex;gap:6px;margin-top:3px"><span style="color:var(--c-green);flex-shrink:0">•</span><span>$1</span></div>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const styles = `
  /* ── FAB ── */
  .ai-fab {
    position: fixed;
    bottom: calc(64px + 12px + 12px + env(safe-area-inset-bottom));
    right: 16px;
    width: 50px; height: 50px; border-radius: 50%;
    background: ${COLORS.neonPurple}; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(123,97,255,0.50);
    z-index: 45;
    transition: transform 150ms, box-shadow 150ms, background 150ms, opacity 150ms;
    -webkit-tap-highlight-color: transparent;
  }
  @media (max-width: 1023px) {
    .ai-fab.open { opacity: 0; pointer-events: none; }
  }
  @media (min-width: 1024px) {
    .ai-fab { bottom: 28px; right: 28px; width: 52px; height: 52px; }
    .ai-fab.open { opacity: 1; pointer-events: auto; }
  }
  .ai-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(123,97,255,0.65); }
  .ai-fab:active { transform: scale(0.95); }
  .ai-fab.open { background: var(--c-elevated); border: 1px solid var(--c-border-mid); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

  .ai-fab-pulse {
    position: absolute; inset: -4px; border-radius: 50%;
    background: ${COLORS.neonPurple};
    animation: aiFabPulse 2.5s ease-out infinite; opacity: 0; z-index: -1;
  }
  @keyframes aiFabPulse {
    0%   { transform: scale(1); opacity: 0.35; }
    100% { transform: scale(1.7); opacity: 0; }
  }

  /* ── Panel ── */
  .ai-panel {
    position: fixed;
    top: max(env(safe-area-inset-top), 8px);
    left: 8px; right: 8px;
    bottom: calc(64px + 12px + 8px + env(safe-area-inset-bottom));
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 16px;
    display: flex; flex-direction: column;
    z-index: 44;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.30);
    animation: aiPanelIn 200ms cubic-bezier(0.34,1.2,0.64,1);
    transition: background-color 220ms ease;
  }
  @media (min-width: 1024px) {
    .ai-panel {
      top: auto; left: auto;
      bottom: 100px; right: 28px;
      width: 420px;
      height: min(640px, calc(100dvh - 130px));
      border-radius: 14px;
    }
  }
  @keyframes aiPanelIn {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── Header ── */
  .ai-hdr {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--c-border);
    flex-shrink: 0;
    background: var(--c-bg);
    transition: background-color 220ms ease;
  }
  .ai-hdr-icon {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--c-bg-purple); border: 1px solid var(--c-border-purple);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ai-hdr-info { flex: 1; min-width: 0; }
  .ai-hdr-title { font-family: ${FONTS.sans}; font-size: 14px; font-weight: 600; color: var(--c-text-primary); }
  .ai-hdr-sub   { font-family: ${FONTS.sans}; font-size: 10px; color: var(--c-text-muted); margin-top: 1px; }
  .ai-hdr-close {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--c-elevated);
    border: 1px solid var(--c-border);
    color: var(--c-text-secondary); font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 100ms; flex-shrink: 0;
    margin-left: 4px;
  }
  .ai-hdr-close:hover { background: var(--c-bg-red); border-color: var(--c-border-red); color: ${COLORS.neonRed}; }

  /* ── Missatges ── */
  .ai-msgs {
    flex: 1; overflow-y: auto; padding: 14px 14px 8px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .ai-msgs::-webkit-scrollbar { width: 3px; }
  .ai-msgs::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

  .ai-msg { display: flex; gap: 9px; animation: aiMsgIn 200ms ease; }
  @keyframes aiMsgIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  .ai-msg-av {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; font-family: ${FONTS.mono};
  }
  .ai-msg-av.user { background: var(--c-bg-purple); color: var(--c-purple); }
  .ai-msg-av.ai   { background: var(--c-bg-green);  color: var(--c-green);  }

  .ai-msg-body { flex: 1; min-width: 0; }
  .ai-msg-name {
    font-size: 9px; font-weight: 600; color: var(--c-text-muted);
    margin-bottom: 5px; font-family: ${FONTS.sans}; text-transform: uppercase; letter-spacing: 0.10em;
  }
  .ai-bubble {
    font-family: ${FONTS.sans}; font-size: 13px; line-height: 1.65;
    color: var(--c-text-secondary); padding: 11px 13px;
    border-radius: 10px; background: var(--c-elevated);
    border: 1px solid var(--c-border);
  }
  .ai-bubble.user {
    background: var(--c-bg-purple);
    border-color: var(--c-border-purple);
    color: var(--c-text-primary);
  }
  .ai-bubble strong { color: var(--c-text-primary); font-weight: 600; }
  .ai-bubble em { color: var(--c-green); font-style: normal; }

  /* Typing dots */
  .ai-typing { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
  .ai-typing span {
    width: 5px; height: 5px; border-radius: 50%; background: var(--c-purple);
    animation: aiDot 1.2s ease-in-out infinite;
  }
  .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
  .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes aiDot { 0%,80%,100% { opacity:0.2; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }

  /* ── Quick prompts ── */
  .ai-quick { padding: 8px 14px 10px; border-top: 1px solid var(--c-border); flex-shrink: 0; }
  .ai-quick-title { font-size: 9px; font-weight: 600; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; font-family: ${FONTS.sans}; }
  .ai-quick-chips { display: flex; gap: 5px; flex-wrap: wrap; }
  .ai-quick-chip {
    display: flex; align-items: center; gap: 4px;
    font-family: ${FONTS.sans}; font-size: 11px; font-weight: 500;
    color: var(--c-text-secondary); background: var(--c-elevated);
    border: 1px solid var(--c-border); border-radius: 20px;
    padding: 5px 10px; cursor: pointer; transition: all 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .ai-quick-chip:hover { border-color: var(--c-border-purple); color: var(--c-purple); background: var(--c-bg-purple); }
  .ai-quick-chip:active { transform: scale(0.97); }

  /* ── Input row ── */
  .ai-input-row {
    display: flex; align-items: flex-end; gap: 8px;
    padding: 10px 14px 14px;
    border-top: 1px solid var(--c-border);
    flex-shrink: 0;
    background: var(--c-bg);
    transition: background-color 220ms ease;
  }
  .ai-input {
    flex: 1; background: var(--c-elevated);
    border: 1px solid var(--c-border);
    border-radius: 12px; padding: 10px 14px;
    font-family: ${FONTS.sans}; font-size: 14px; color: var(--c-text-primary);
    outline: none; resize: none;
    min-height: 42px; max-height: 100px;
    line-height: 1.45; transition: border-color 120ms;
    overflow-y: auto;
  }
  .ai-input:focus { border-color: var(--c-border-purple); }
  .ai-input::placeholder { color: var(--c-text-disabled); }

  .ai-send {
    width: 42px; height: 42px; border-radius: 12px; border: none;
    background: ${COLORS.neonPurple}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 100ms; flex-shrink: 0;
  }
  .ai-send:hover { opacity: 0.85; transform: scale(1.04); }
  .ai-send:active { transform: scale(0.97); }
  .ai-send:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }

  .ai-error { font-size: 11px; color: ${COLORS.neonRed}; background: var(--c-bg-red); border: 1px solid var(--c-border-red); border-radius: 8px; padding: 8px 12px; margin: 0 14px 8px; }

  /* Welcome screen */
  .ai-welcome { text-align: center; padding: 28px 20px; }
  .ai-welcome-icon { font-size: 36px; margin-bottom: 12px; }
  .ai-welcome-title { font-size: 15px; font-weight: 600; color: var(--c-text-primary); margin-bottom: 8px; font-family: ${FONTS.sans}; }
  .ai-welcome-sub { font-size: 13px; color: var(--c-text-muted); line-height: 1.65; font-family: ${FONTS.sans}; }
`

export default function AIAnalyst({ investments=[], savings=[], cryptos=[], commodities=[], totalAll=0, totalCost=0, pg=0, pgPct=0 }) {
  const [open, setOpen]          = useState(false)
  const [msgs, setMsgs]          = useState([])
  const [input, setInput]        = useState('')
  const [loading, setLoading]    = useState(false)
  const [error, setError]        = useState('')
  const [hasGreeted, setGreeted] = useState(false)
  const msgsEndRef = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, loading])

  const portfolioContext = buildPortfolioContext({ investments, savings, cryptos, commodities, totalAll, totalCost, pg, pgPct })

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    setError('')
    const userMsg = { role:'user', content:text.trim() }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `${SYSTEM_PROMPT}\n\n${portfolioContext}`,
          messages: newMsgs,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(err?.error?.message || `Error ${res.status}`)
      }
      const data  = await res.json()
      const reply = data.content?.find(b=>b.type==='text')?.text || ''
      setMsgs(prev => [...prev, { role:'assistant', content:reply }])
    } catch(err) {
      setError(`Error: ${err.message}`)
    }
    setLoading(false)
  }, [msgs, loading, portfolioContext])

  const handleOpen = () => {
    setOpen(true)
    if (!hasGreeted) {
      setGreeted(true)
      setTimeout(() => {
        setMsgs([{ role:'assistant', content:`Hola! Soc el teu assessor financer IA. Tinc accés al teu portfoli (${fmtEur(totalAll)} en total) i puc ajudar-te a analitzar-lo, identificar riscos, comparar alternatives i respondre qualsevol pregunta sobre inversions.\n\nPer on vols començar? Pots usar les opcions ràpides o fer-me qualsevol pregunta.` }])
      }, 200)
    }
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleInput = e => {
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px'
    setInput(ta.value)
  }

  return (
    <>
      <style>{styles}</style>

      {open && (
        <div className="ai-panel">
          <div className="ai-hdr">
            <div className="ai-hdr-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="ai-hdr-info">
              <p className="ai-hdr-title">Assessor AI</p>
              <p className="ai-hdr-sub">Powered by Claude · {fmtEur(totalAll)}</p>
            </div>
            <button className="ai-hdr-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="ai-msgs">
            {msgs.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>
                <p className="ai-welcome-title">El teu assessor financer personal</p>
                <p className="ai-welcome-sub">Analitzo el teu portfoli en temps real i respono qualsevol pregunta sobre inversions en català.</p>
              </div>
            )}
            {msgs.map((m,i) => (
              <div key={i} className="ai-msg">
                <div className={`ai-msg-av ${m.role==='user'?'user':'ai'}`}>
                  {m.role==='user'?'Tu':'AI'}
                </div>
                <div className="ai-msg-body">
                  <p className="ai-msg-name">{m.role==='user'?'Tu':'Claude'}</p>
                  <div className={`ai-bubble${m.role==='user'?' user':''}`}
                    dangerouslySetInnerHTML={{__html:formatResponse(m.content)}}/>
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg">
                <div className="ai-msg-av ai">AI</div>
                <div className="ai-msg-body">
                  <p className="ai-msg-name">Claude</p>
                  <div className="ai-bubble">
                    <div className="ai-typing"><span/><span/><span/></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={msgsEndRef}/>
          </div>

          {error && <p className="ai-error">{error}</p>}

          {msgs.length <= 1 && (
            <div className="ai-quick">
              <p className="ai-quick-title">Suggeriments ràpids</p>
              <div className="ai-quick-chips">
                {QUICK_PROMPTS.map((q,i) => (
                  <button key={i} className="ai-quick-chip" onClick={()=>sendMessage(q.prompt)}>
                    {q.icon} {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-input-row">
            <textarea
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder="Pregunta'm sobre el teu portfoli..."
              rows={1}
            />
            <button
              className="ai-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button className={`ai-fab${open?' open':''}`} onClick={open?()=>setOpen(false):handleOpen}>
        {!open && <div className="ai-fab-pulse"/>}
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-secondary)" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
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