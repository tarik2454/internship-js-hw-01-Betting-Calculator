import { useEffect, useMemo, useRef, useState } from "react";

type BetHistory = {
  amount: number;
  odds: number;
  game: string;
  win: number;
  ts: number;
};

const STORAGE_KEY = "betsHistory";

function formatMoney(value: number) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function readHistory(): BetHistory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeHistory(history: BetHistory[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 5)));
}

function validate(amount: number, odds: number) {
  const errs: string[] = [];
  if (Number.isNaN(amount) || amount <= 0) errs.push("Сума повинна бути > 0.");
  if (Number.isNaN(odds) || odds <= 0)
    errs.push("Коефіцієнт повинен бути > 0.");
  return errs;
}

export default function App() {
  const [amount, setAmount] = useState("");
  const [odds, setOdds] = useState("");
  const [game, setGame] = useState("slots");
  const [statusMessage, setStatusMessage] = useState("");
  const [history, setHistory] = useState<BetHistory[]>(() => readHistory());

  const [touched, setTouched] = useState(false);

  const messageTimeoutRef = useRef<number | null>(null);

  const calculation = useMemo(() => {
    const amountValue = parseFloat(amount);
    const oddsValue = parseFloat(odds);

    const errs = validate(amountValue, oddsValue);

    if (errs.length) {
      const errText = errs.join(" ");
      return {
        ok: false,
        potential: "—",
        details: errText,
        message: errText,
      };
    }

    const win = amountValue * oddsValue;

    return {
      ok: true,
      potential: `${formatMoney(win)} UAH`,
      details: `${formatMoney(amountValue)} × ${oddsValue} = ${formatMoney(
        win
      )}`,
      message: "",
      amountValue,
      oddsValue,
      win,
    };
  }, [amount, odds]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (
      !calculation.ok ||
      calculation.amountValue === undefined ||
      calculation.oddsValue === undefined ||
      calculation.win === undefined
    ) {
      setStatusMessage(calculation.message);
      return;
    }

    const entry: BetHistory = {
      amount: calculation.amountValue,
      odds: calculation.oddsValue,
      win: calculation.win,
      game,
      ts: Date.now(),
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 5);
      writeHistory(updated);
      return updated;
    });

    setStatusMessage("Збережено!");

    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(
      () => setStatusMessage(""),
      1200
    );
  };

  const handleRemove = (idx: number) => {
    setHistory((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      writeHistory(copy);
      return copy;
    });
  };

  return (
    <main className="card-wrapper">
      <div className="card">
        <h1>Betting Calculator</h1>
        <p className="lead">
          Введи сумму ставки, коефіцієнт і тип гри. Розрахунок в реальному часі.
        </p>

        <div className="grid">
          <section>
            <form id="betForm" noValidate>
              {/* Amount */}
              <label htmlFor="amount">Сума ставки (UAH)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Наприклад, 100"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setTouched(true);
                  setStatusMessage("");
                }}
              />

              {/* Odds */}
              <label htmlFor="odds">Коефіцієнт</label>
              <input
                id="odds"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Наприклад, 1.75"
                required
                value={odds}
                onChange={(e) => {
                  setOdds(e.target.value);
                  setTouched(true);
                  setStatusMessage("");
                }}
              />

              <label htmlFor="game">Тип гри</label>
              <select
                id="game"
                value={game}
                onChange={(e) => {
                  setGame(e.target.value);
                  setStatusMessage("");
                }}
              >
                <option value="slots">Слоти</option>
                <option value="poker">Покер</option>
                <option value="football">Футбол</option>
                <option value="casino">Казино</option>
                <option value="other">Інше</option>
              </select>

              <div className="row">
                <button id="saveBtn" type="button" onClick={handleSave}>
                  Зберегти ставку
                </button>
              </div>

              <div className="errors" id="errors">
                {touched ? statusMessage || calculation.message : ""}
              </div>
            </form>
          </section>

          <aside>
            <div className="result">
              <div>Потенційний виграш:</div>
              <div className="big" id="potential">
                {calculation.potential}
              </div>
              <div className="muted" id="details">
                {calculation.details}
              </div>
            </div>

            <h3 className="history-title">Історія останніх 5 ставок</h3>
            <div className="history" id="historyList">
              {history.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  Немає збережених ставок.
                </div>
              ) : (
                history.map((h, idx) => (
                  <div className="hist-item" key={`${h.ts}-${idx}`}>
                    <div className="hist-left">
                      <div>
                        <strong>{formatMoney(h.amount)} UAH</strong> — {h.odds}×
                        ({h.game})
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        {new Date(h.ts).toLocaleString()}
                      </div>
                    </div>

                    <div className="hist-right">
                      <div>{formatMoney(h.win)} UAH</div>
                      <button
                        className="small-btn"
                        type="button"
                        onClick={() => handleRemove(idx)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
