import { useState, useEffect } from "react";

const WAKE_KEY = "rise-wake-v2";
const SLEEP_KEY = "rise-sleep-v2";
const CONFIG_KEY = "rise-config-v2";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["S","M","T","W","T","F","S"];

function parseTime(str) {
  if (!str) return 0;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function dateKey(y, mo, d) {
  return `${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function getColor(targetMin, loggedMin, isSleep) {
  let adjusted = loggedMin;
  // For sleep: if target is evening (e.g. 23:00) and logged time looks like early morning (e.g. 01:00), treat it as past midnight
  if (isSleep && targetMin > 12 * 60 && loggedMin < 6 * 60) {
    adjusted = loggedMin + 24 * 60;
  }
  const diff = adjusted - targetMin;
  if (diff <= 0)   return { bg: "#FFFFFF", text: "#000", label: diff === 0 ? "On time" : `${Math.abs(diff)}m early` };
  if (diff <= 30)  return { bg: "#DCDCDC", text: "#111", label: `+${diff}m late` };
  if (diff <= 60)  return { bg: "#ABABAB", text: "#111", label: `+${diff}m late` };
  if (diff <= 90)  return { bg: "#777777", text: "#fff", label: `+${diff}m late` };
  if (diff <= 120) return { bg: "#444444", text: "#fff", label: `+${diff}m late` };
  return               { bg: "#111111", text: "#fff", label: `+${Math.round(diff/60*10)/10}h late` };
}

function ConfigModal({ wakeTarget, sleepTarget, onSave, onClose }) {
  const [localWake, setLocalWake] = useState(wakeTarget);
  const [localSleep, setLocalSleep] = useState(sleepTarget);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 4 }}>Configuration</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 22, letterSpacing: "0.05em" }}>
          SET YOUR TARGET TIMES
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 7 }}>☀ TARGET WAKE-UP TIME</div>
          <input type="time" className="time-input" value={localWake} onChange={e => setLocalWake(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 7 }}>☽ TARGET BEDTIME</div>
          <input type="time" className="time-input" value={localSleep} onChange={e => setLocalSleep(e.target.value)} />
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.9, marginBottom: 20 }}>
          <span style={{color:"rgba(255,255,255,0.5)"}}>⬜</span> On time / early &nbsp;·&nbsp;
          <span style={{color:"#CCC"}}>░</span> 30m late &nbsp;·&nbsp;
          <span style={{color:"#999"}}>▒</span> 1h &nbsp;·&nbsp;
          <span style={{color:"#666"}}>▓</span> 1.5h &nbsp;·&nbsp;
          <span style={{color:"#333"}}>▓</span> 2h &nbsp;·&nbsp;
          <span style={{color:"rgba(255,255,255,0.4)"}}>⬛</span> 2h+
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }}
          onClick={() => { onSave(localWake, localSleep); onClose(); }}>
          Save
        </button>
      </div>
    </div>
  );
}

function LogModal({ day, month, year, mode, existing, targetTime, onSave, onDelete, onClose }) {
  const isWake = mode === "wake";
  const [logTime, setLogTime] = useState(existing || targetTime);
  const targetMin = parseTime(targetTime);
  const wMin = parseTime(logTime);
  const color = getColor(targetMin, wMin, !isWake);
  let adjusted = wMin;
  if (!isWake && targetMin > 12*60 && wMin < 6*60) adjusted = wMin + 24*60;
  const diff = adjusted - targetMin;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, marginBottom: 4 }}>
          {isWake ? "☀ Log Wake-Up" : "☽ Log Bedtime"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20, letterSpacing: "0.05em" }}>
          {MONTHS[month]} {day}, {year}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.08em" }}>
            {isWake ? "WAKE-UP TIME" : "SLEEP TIME"}
          </div>
          <input type="time" className="time-input" value={logTime} onChange={e => setLogTime(e.target.value)} />
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: color.bg, color: color.text,
            borderRadius: 8, fontSize: 12, textAlign: "center",
            fontFamily: "'DM Mono', monospace", transition: "background 0.2s",
          }}>
            {diff <= 0
              ? `✓ ${Math.abs(diff) === 0 ? "exactly on time" : `${Math.abs(diff)}m ${isWake ? "early" : "early to bed"}`}`
              : color.label}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(logTime)}>Save</button>
          {existing && <button className="btn btn-danger" onClick={onDelete}>Delete</button>}
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const [mode, setMode] = useState("wake");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [wakeRecords, setWakeRecords] = useState({});
  const [sleepRecords, setSleepRecords] = useState({});
  const [wakeTarget, setWakeTarget] = useState("07:00");
  const [sleepTarget, setSleepTarget] = useState("23:00");
  const [showConfig, setShowConfig] = useState(false);
  const [logDay, setLogDay] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(WAKE_KEY); if (r) setWakeRecords(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get(SLEEP_KEY); if (r) setSleepRecords(JSON.parse(r.value)); } catch {}
      try {
        const c = await window.storage.get(CONFIG_KEY);
        if (c) { const cfg = JSON.parse(c.value); setWakeTarget(cfg.wt || "07:00"); setSleepTarget(cfg.st || "23:00"); }
      } catch {}
    })();
  }, []);

  const saveWake = async (r) => { setWakeRecords(r); try { await window.storage.set(WAKE_KEY, JSON.stringify(r)); } catch {} };
  const saveSleep = async (r) => { setSleepRecords(r); try { await window.storage.set(SLEEP_KEY, JSON.stringify(r)); } catch {} };
  const handleSaveConfig = async (wt, st) => {
    setWakeTarget(wt); setSleepTarget(st);
    try { await window.storage.set(CONFIG_KEY, JSON.stringify({ wt, st })); } catch {}
  };

  const isWake = mode === "wake";
  const records = isWake ? wakeRecords : sleepRecords;
  const targetTime = isWake ? wakeTarget : sleepTarget;
  const targetMin = parseTime(targetTime);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];

  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isFuture = (d) => new Date(viewYear, viewMonth, d) > new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const monthKeys = Array.from({length: daysInMonth}, (_,i) => dateKey(viewYear, viewMonth, i+1));
  const logged = monthKeys.filter(k => records[k]);
  const onTime = logged.filter(k => getColor(targetMin, parseTime(records[k]), !isWake).bg === "#FFFFFF");
  const avgDiff = logged.length > 0
    ? Math.round(logged.reduce((sum, k) => {
        let wMin = parseTime(records[k]);
        if (!isWake && targetMin > 12*60 && wMin < 6*60) wMin += 24*60;
        return sum + Math.max(0, wMin - targetMin);
      }, 0) / logged.length)
    : null;

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Mono','Courier New',monospace", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        .tile {
          width: 38px; height: 38px; border-radius: 6px; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 500;
          position: relative; border: 1px solid rgba(255,255,255,0.07);
        }
        .tile:hover { transform: scale(1.13); box-shadow: 0 0 0 2px rgba(255,255,255,0.28); z-index: 10; }
        .tile-empty { width: 38px; height: 38px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(5px); }
        .modal { background: #161616; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 28px 32px; min-width: 280px; }
        .btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 12px; transition: background 0.15s; }
        .btn:hover { background: rgba(255,255,255,0.13); }
        .btn-primary { background: #fff; color: #000; border: none; }
        .btn-primary:hover { background: #ddd; }
        .btn-danger { background: rgba(255,60,60,0.1); border-color: rgba(255,60,60,0.3); color: #ff6b6b; }
        .btn-danger:hover { background: rgba(255,60,60,0.2); }
        .time-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 8px 12px; font-family: 'DM Mono', monospace; font-size: 15px; outline: none; width: 100%; }
        .time-input:focus { border-color: rgba(255,255,255,0.4); }
        .tooltip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #1e1e1e; color: #fff; font-size: 10px; padding: 4px 9px; border-radius: 5px; white-space: nowrap; pointer-events: none; border: 1px solid rgba(255,255,255,0.12); z-index: 20; }
        .nav-btn { background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.45); border-radius: 6px; padding: 4px 11px; cursor: pointer; font-size: 14px; transition: all 0.15s; }
        .nav-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 360, marginBottom: 24 }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, letterSpacing: "-0.5px", lineHeight: 1 }}>Rise</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: "0.08em" }}>SLEEP & WAKE TRACKER</div>
          </div>
          <button className="btn" onClick={() => setShowConfig(true)} style={{ fontSize: 11, letterSpacing: "0.04em" }}>⚙ Configure</button>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "center", margin: "24px 0 18px" }}>
          <div style={{
            display: "flex", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
            padding: 3, gap: 3, cursor: "pointer",
          }}>
            {[["wake","☀  WAKE"], ["sleep","☽  SLEEP"]].map(([m, label]) => (
              <div key={m} onClick={() => setMode(m)} style={{
                padding: "7px 22px", borderRadius: 7, fontSize: 11, letterSpacing: "0.07em",
                fontWeight: mode === m ? 500 : 400,
                background: mode === m ? "rgba(255,255,255,0.13)" : "transparent",
                color: mode === m ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "all 0.2s", userSelect: "none",
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Target chip */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em" }}>
            TARGET {isWake ? "WAKE-UP" : "BEDTIME"}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginLeft: 8 }}>{targetTime}</span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {[
            { val: logged.length, label: "LOGGED" },
            { val: onTime.length, label: "ON TIME" },
            { val: avgDiff !== null ? (avgDiff === 0 ? "0m" : `+${avgDiff}m`) : "—", label: "AVG LATE" },
          ].map(({ val, label }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 300 }}>{val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <div style={{ fontSize: 13, letterSpacing: "0.12em", color: "rgba(255,255,255,0.65)" }}>
            {MONTHS[viewMonth].toUpperCase()} {viewYear}
          </div>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 38px)", gap: 5, marginBottom: 8, justifyContent: "center" }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ width: 38, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 38px)", gap: 5, justifyContent: "center" }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="tile-empty" />;
            const key = dateKey(viewYear, viewMonth, d);
            const loggedTime = records[key];
            const future = isFuture(d);
            const todayCell = isToday(d);

            let bg = "rgba(255,255,255,0.04)";
            let textColor = "rgba(255,255,255,0.18)";
            let tooltipText = null;

            if (loggedTime) {
              const c = getColor(targetMin, parseTime(loggedTime), !isWake);
              bg = c.bg; textColor = c.text;
              tooltipText = `${loggedTime} — ${c.label}`;
            }

            return (
              <div key={i} className="tile"
                style={{
                  background: bg, color: textColor,
                  outline: todayCell ? "2px solid rgba(255,255,255,0.38)" : "none",
                  outlineOffset: "2px", opacity: future ? 0.28 : 1,
                  cursor: future ? "default" : "pointer",
                }}
                onClick={() => { if (!future) setLogDay(d); }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {hoveredIdx === i && tooltipText && <div className="tooltip">{tooltipText}</div>}
                {d}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          {[["#FFFFFF","#000","On time"], ["#ABABAB","#000","1h late"], ["#555","#fff","2h late"], ["#111","#fff","Very late"]].map(([bg, text, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: bg === "#111" ? "1px solid rgba(255,255,255,0.12)" : "none" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.27)", letterSpacing: "0.04em" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log Modal */}
      {logDay !== null && (
        <LogModal
          day={logDay} month={viewMonth} year={viewYear}
          mode={mode}
          existing={records[dateKey(viewYear, viewMonth, logDay)]}
          targetTime={targetTime}
          onSave={(time) => {
            const key = dateKey(viewYear, viewMonth, logDay);
            if (isWake) saveWake({ ...wakeRecords, [key]: time });
            else saveSleep({ ...sleepRecords, [key]: time });
            setLogDay(null);
          }}
          onDelete={() => {
            const key = dateKey(viewYear, viewMonth, logDay);
            if (isWake) { const r = {...wakeRecords}; delete r[key]; saveWake(r); }
            else { const r = {...sleepRecords}; delete r[key]; saveSleep(r); }
            setLogDay(null);
          }}
          onClose={() => setLogDay(null)}
        />
      )}

      {/* Config Modal */}
      {showConfig && (
        <ConfigModal
          wakeTarget={wakeTarget} sleepTarget={sleepTarget}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
