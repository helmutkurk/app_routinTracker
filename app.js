const STORAGE_KEY = "ritmo-habits-v1";
const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DEFAULT_HINT = "Un paso a la vez";

const defaultHabits = [
  { id: "smoke-free", name: "Día sin fumar", icon: "♡", hint: "Cada día cuenta" },
  { id: "movement", name: "Mover el cuerpo", icon: "↗", hint: "Deporte y movimiento" },
  { id: "study", name: "Estudiar", icon: "◉", hint: "Un rato para aprender" },
  { id: "work", name: "Avanzar en el trabajo", icon: "✳", hint: "Con intención y enfoque" },
  { id: "meditate", name: "Meditar", icon: "☼", hint: "Un momento de calma" },
  { id: "healthy-food", name: "Comer saludable", icon: "❋", hint: "Cuidar lo que te nutre" },
];

const $ = (selector) => document.querySelector(selector);

let today = new Date();
let todayKey = dateKey(today);
let selectedDate = todayKey;
let weekOffset = 0;
let editingId = null;
let data = loadData();
let toastTimer;

function dateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function keyToDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidData(value) {
  return value && Array.isArray(value.habits) && value.logs && typeof value.logs === "object"
    && value.habits.every((habit) => habit && typeof habit.id === "string" && typeof habit.name === "string");
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValidData(saved)) return saved;
  } catch (error) {
    console.warn("No se pudieron cargar los hábitos guardados.", error);
  }
  return { habits: structuredClone(defaultHabits), logs: {} };
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("No se pudieron guardar los hábitos.", error);
    showToast("No se pudo guardar. Revisa el espacio del navegador.");
  }
}

function prettyDate(date, includeYear = false) {
  return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}${includeYear ? ` de ${date.getFullYear()}` : ""}`;
}

function plural(count, one, many) {
  return count === 1 ? one : many;
}

function renderHeader() {
  $("#today-label").textContent = `${DAY_NAMES[today.getDay()]}, ${prettyDate(today)}`;
  $("#footer-date").textContent = prettyDate(today, true);
}

function weekStart() {
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
  return start;
}

function renderWeek() {
  const strip = $("#week-strip");
  const start = weekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  $("#week-label").textContent = weekOffset === 0
    ? "Esta semana"
    : `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)}`;
  $("#week-next").disabled = weekOffset >= 0;

  strip.replaceChildren();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dateKey(date);
    const isFuture = key > todayKey;
    const doneCount = data.habits.filter((habit) => data.logs[key]?.includes(habit.id)).length;
    const button = document.createElement("button");
    button.className = `day-button${key === selectedDate ? " selected" : ""}${key === todayKey ? " today" : ""}`;
    button.type = "button";
    button.disabled = isFuture;
    button.setAttribute("aria-pressed", String(key === selectedDate));
    button.setAttribute("aria-label", `${DAY_NAMES[date.getDay()]} ${prettyDate(date)}, ${doneCount} de ${data.habits.length} completados`);
    const complete = data.habits.length && doneCount === data.habits.length;
    const partial = doneCount > 0 && !complete;
    button.innerHTML = `<span>${DAY_NAMES[date.getDay()]}</span><span class="day-number">${date.getDate()}</span><span class="day-dot${complete ? " full" : partial ? " partial" : ""}"></span>`;
    button.addEventListener("click", () => {
      selectedDate = key;
      render();
    });
    strip.append(button);
  }
}

function habitStreak(habitId) {
  let count = 0;
  const cursor = new Date(today);
  if (!data.logs[dateKey(cursor)]?.includes(habitId)) cursor.setDate(cursor.getDate() - 1);
  while (data.logs[dateKey(cursor)]?.includes(habitId)) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function renderHabits() {
  const list = $("#habit-list");
  const completed = data.logs[selectedDate] || [];
  list.replaceChildren();
  if (!data.habits.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Tu lista está despejada. Añade un hábito para empezar.";
    list.append(empty);
    return;
  }

  data.habits.forEach((habit) => {
    const done = completed.includes(habit.id);
    const streak = habitStreak(habit.id);
    const row = document.createElement("article");
    row.className = `habit-row${done ? " done" : ""}`;

    const symbol = document.createElement("span");
    symbol.className = "habit-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = habit.icon;

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "habit-copy";
    copy.setAttribute("aria-label", `Editar ${habit.name}`);
    const name = document.createElement("strong");
    name.textContent = habit.name;
    const hint = document.createElement("small");
    hint.textContent = habit.hint || DEFAULT_HINT;
    const streakLabel = document.createElement("span");
    streakLabel.className = "habit-streak";
    streakLabel.innerHTML = streak ? `<span>✳</span>${streak} ${plural(streak, "día seguido", "días seguidos")}` : "Empieza hoy";
    copy.append(name, hint, streakLabel);
    copy.addEventListener("click", () => openDialog(habit));

    const check = document.createElement("button");
    check.className = "check-button";
    check.type = "button";
    check.setAttribute("aria-label", `${done ? "Desmarcar" : "Completar"} ${habit.name}`);
    check.setAttribute("aria-pressed", String(done));
    check.textContent = done ? "✓" : "";
    check.addEventListener("click", () => toggleHabit(habit.id));

    row.append(symbol, copy, check);
    list.append(row);
  });
}

function renderStats() {
  const isToday = selectedDate === todayKey;
  const completed = data.logs[selectedDate] || [];
  const total = data.habits.length;
  const count = data.habits.filter((habit) => completed.includes(habit.id)).length;
  const percentage = total ? Math.round((count / total) * 100) : 0;
  $("#progress-label").textContent = isToday ? "PROGRESO DE HOY" : "PROGRESO DEL DÍA";
  $("#progress-value").textContent = `${percentage}%`;
  $("#progress-bar").style.width = `${percentage}%`;
  $("#progress-caption").textContent = percentage === 100 ? "¡Lo hiciste!" : percentage > 0 ? "Vas por buen camino" : DEFAULT_HINT;
  $("#completed-value").innerHTML = `${count} <small>/ ${total}</small>`;
  $("#completed-caption").textContent = isToday ? "hoy" : `el ${prettyDate(keyToDate(selectedDate))}`;

  const best = data.habits
    .map((habit) => ({ name: habit.name, days: habitStreak(habit.id) }))
    .sort((a, b) => b.days - a.days)[0];
  $("#streak-value").innerHTML = `${best?.days || 0} <small>${plural(best?.days || 0, "día", "días")}</small>`;
  $("#streak-name").textContent = best?.days ? best.name : "Tu constancia empieza hoy";

  const banner = $("#past-banner");
  banner.hidden = isToday;
  if (!isToday) {
    const date = keyToDate(selectedDate);
    $("#past-label").textContent = `Estás editando el ${DAY_NAMES[date.getDay()]}, ${prettyDate(date)}.`;
  }
}

function render() {
  renderWeek();
  renderHabits();
  renderStats();
}

function goToToday() {
  selectedDate = todayKey;
  weekOffset = 0;
  render();
}

function checkDayChange() {
  const now = new Date();
  const key = dateKey(now);
  if (key === todayKey) return;
  const wasOnToday = selectedDate === todayKey;
  today = now;
  todayKey = key;
  if (wasOnToday) {
    selectedDate = todayKey;
    weekOffset = 0;
  }
  renderHeader();
  render();
}

function toggleHabit(habitId) {
  const done = new Set(data.logs[selectedDate] || []);
  if (done.has(habitId)) done.delete(habitId);
  else done.add(habitId);
  if (done.size) data.logs[selectedDate] = [...done];
  else delete data.logs[selectedDate];
  saveData();
  render();
  if (navigator.vibrate && done.has(habitId)) navigator.vibrate(12);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* Diálogo de hábito (crear y editar) */
const dialog = $("#habit-dialog");

function selectIcon(icon) {
  let matched = false;
  document.querySelectorAll(".icon-choice").forEach((button) => {
    const isMatch = button.dataset.icon === icon;
    button.classList.toggle("selected", isMatch);
    button.setAttribute("aria-pressed", String(isMatch));
    matched ||= isMatch;
  });
  if (!matched) {
    const first = document.querySelector(".icon-choice");
    first.classList.add("selected");
    first.setAttribute("aria-pressed", "true");
    icon = first.dataset.icon;
  }
  $("#habit-icon").value = icon;
}

function openDialog(habit = null) {
  editingId = habit?.id ?? null;
  $("#habit-form").reset();
  $("#habit-name").value = habit?.name ?? "";
  $("#habit-hint").value = habit && habit.hint !== DEFAULT_HINT ? habit.hint ?? "" : "";
  selectIcon(habit?.icon ?? "✳");
  $("#dialog-eyebrow").textContent = habit ? "AJUSTA TU COMPROMISO" : "UN PEQUEÑO COMPROMISO";
  $("#dialog-title").textContent = habit ? "Editar hábito" : "Añade un hábito";
  $("#dialog-copy").textContent = habit ? "Cambia lo que necesites. Tu historial se mantiene." : "Elige algo que quieras cuidar día a día.";
  $("#dialog-submit-label").textContent = habit ? "Guardar cambios" : "Crear hábito";
  $("#delete-habit").hidden = !habit;
  $("#move-controls").hidden = !habit;
  if (habit) {
    const index = data.habits.findIndex((item) => item.id === habit.id);
    $("#move-up").disabled = index <= 0;
    $("#move-down").disabled = index >= data.habits.length - 1;
  }
  dialog.showModal();
  if (!habit) $("#habit-name").focus();
}

function moveHabit(direction) {
  const index = data.habits.findIndex((habit) => habit.id === editingId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= data.habits.length) return;
  [data.habits[index], data.habits[target]] = [data.habits[target], data.habits[index]];
  saveData();
  render();
  $("#move-up").disabled = target <= 0;
  $("#move-down").disabled = target >= data.habits.length - 1;
}

document.querySelectorAll("#add-habit-top, #add-habit-bottom").forEach((button) => button.addEventListener("click", () => openDialog()));
$("#dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelectorAll(".icon-choice").forEach((button) => {
  button.addEventListener("click", () => selectIcon(button.dataset.icon));
});
$("#move-up").addEventListener("click", () => moveHabit(-1));
$("#move-down").addEventListener("click", () => moveHabit(1));

$("#habit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#habit-name").value.trim();
  if (!name) return;
  const hint = $("#habit-hint").value.trim() || DEFAULT_HINT;
  const icon = $("#habit-icon").value;
  if (editingId) {
    const habit = data.habits.find((item) => item.id === editingId);
    Object.assign(habit, { name, hint, icon });
    showToast("Hábito actualizado.");
  } else {
    data.habits.push({ id: `habit-${Date.now()}`, name, icon, hint });
    showToast("Hábito añadido a tu día.");
  }
  saveData();
  dialog.close();
  render();
});

$("#delete-habit").addEventListener("click", () => {
  const habit = data.habits.find((item) => item.id === editingId);
  if (!habit || !confirm(`¿Eliminar «${habit.name}» y todo su historial?`)) return;
  data.habits = data.habits.filter((item) => item.id !== editingId);
  for (const [key, ids] of Object.entries(data.logs)) {
    const kept = ids.filter((id) => id !== editingId);
    if (kept.length) data.logs[key] = kept;
    else delete data.logs[key];
  }
  saveData();
  dialog.close();
  render();
  showToast("Hábito eliminado.");
});

$("#reset-day").addEventListener("click", () => {
  if (!(data.logs[selectedDate] || []).length) {
    showToast("Todavía no hay hábitos marcados.");
    return;
  }
  if (!confirm("¿Desmarcar todos los hábitos de este día?")) return;
  delete data.logs[selectedDate];
  saveData();
  render();
  showToast("Día reiniciado. Puedes volver a empezar.");
});

/* Navegación de semanas */
$("#week-prev").addEventListener("click", () => {
  weekOffset -= 1;
  renderWeek();
});
$("#week-next").addEventListener("click", () => {
  if (weekOffset >= 0) return;
  weekOffset += 1;
  renderWeek();
});
$("#back-to-today").addEventListener("click", goToToday);

/* Copia de seguridad */
$("#export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ app: "ritmo", exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ritmo-copia-${todayKey}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Copia descargada. Guárdala en un lugar seguro.");
});

$("#import-data").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!isValidData(imported)) throw new Error("Formato no válido");
    if (!confirm("Esto reemplazará tus hábitos e historial actuales por los de la copia. ¿Continuar?")) return;
    data = { habits: imported.habits, logs: imported.logs };
    saveData();
    goToToday();
    showToast("Copia restaurada.");
  } catch (error) {
    console.warn("No se pudo importar la copia.", error);
    showToast("Ese archivo no parece una copia de Ritmo.");
  }
});

/* Arranque */
renderHeader();
render();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkDayChange();
});
setInterval(checkDayChange, 60_000);

// Pide al navegador que no borre los datos locales cuando le falte espacio.
navigator.storage?.persist?.().catch(() => {});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch((error) => console.warn("No se pudo preparar el modo sin conexión.", error));
  });
}
