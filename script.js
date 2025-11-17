const amountEl = document.getElementById("amount");
const oddsEl = document.getElementById("odds");
const gameEl = document.getElementById("game");
const calcBtn = document.getElementById("calcBtn");
const saveBtn = document.getElementById("saveBtn");
const potentialEl = document.getElementById("potential");
const detailsEl = document.getElementById("details");
const errorsEl = document.getElementById("errors");
const historyList = document.getElementById("historyList");

const STORAGE_KEY = "betsHistory";

function formatMoney(v) {
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function validate(amount, odds) {
  const errs = [];
  if (isNaN(amount) || amount <= 0) errs.push("Сума повинна бути > 0.");
  if (isNaN(odds) || odds <= 0) errs.push("Коефіцієнт повинен бути > 0.");
  return errs;
}

function compute(amount, odds) {
  return amount * odds;
}

function renderResult() {
  const amount = parseFloat(amountEl.value);
  const odds = parseFloat(oddsEl.value);

  const errs = validate(amount, odds);
  if (errs.length) {
    potentialEl.textContent = "—";
    detailsEl.textContent = errs.join(" ");
    errorsEl.textContent = errs.join(" ");
    return;
  }

  errorsEl.textContent = "";
  const win = compute(amount, odds);

  potentialEl.textContent = `${formatMoney(win)} UAH`;
  detailsEl.textContent = `${formatMoney(amount)} × ${odds} = ${formatMoney(
    win
  )}`;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeHistory(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 5)));
}

function pushHistory(entry) {
  const arr = readHistory();
  arr.unshift(entry);
  writeHistory(arr.slice(0, 5));
  renderHistory();
}

function removeHistoryIndex(i) {
  const arr = readHistory();
  arr.splice(i, 1);
  writeHistory(arr);
  renderHistory();
}

function renderHistory() {
  const arr = readHistory();

  if (!arr.length) {
    historyList.innerHTML =
      '<div style="color:#6b7280;font-size:13px">Немає збережених ставок.</div>';
    return;
  }

  historyList.innerHTML = "";

  arr.forEach((h, idx) => {
    const item = document.createElement("div");
    item.className = "hist-item";

    item.innerHTML = `
      <div class="hist-left">
        <div><strong>${formatMoney(h.amount)} UAH</strong> — ${h.odds}× (${
      h.game
    })</div>
        <div style="color:#6b7280;font-size:12px">${new Date(
          h.ts
        ).toLocaleString()}</div>
      </div>
      <div class="hist-right">
        <div>${formatMoney(h.win)} UAH</div>
        <button class="small-btn" data-i="${idx}">Видалити</button>
      </div>
    `;

    historyList.appendChild(item);
  });

  historyList.querySelectorAll(".small-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeHistoryIndex(Number(btn.dataset.i));
    });
  });
}

amountEl.addEventListener("input", renderResult);
oddsEl.addEventListener("input", renderResult);

calcBtn.addEventListener("click", renderResult);

saveBtn.addEventListener("click", () => {
  const amount = parseFloat(amountEl.value);
  const odds = parseFloat(oddsEl.value);
  const errs = validate(amount, odds);

  if (errs.length) {
    errorsEl.textContent = errs.join(" ");
    return;
  }

  const win = compute(amount, odds);
  pushHistory({
    amount,
    odds,
    game: gameEl.value,
    win,
    ts: Date.now(),
  });

  errorsEl.textContent = "Збережено!";
  setTimeout(() => (errorsEl.textContent = ""), 1200);
});

renderHistory();
renderResult();
