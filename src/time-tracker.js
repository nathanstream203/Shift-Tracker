var tickInterval = null;
var STORAGE_KEY = "shift-tracker-today";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function saveState() {
  var state = {
    date: todayStr(),
    in1: document.getElementById("in1").value,
    out1: document.getElementById("out1").value,
    in2: document.getElementById("in2").value,
    goal: document.getElementById("goal").value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var state = JSON.parse(raw);
    if (state.date !== todayStr()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    document.getElementById("in1").value = state.in1 || "";
    document.getElementById("out1").value = state.out1 || "";
    document.getElementById("in2").value = state.in2 || "";
    document.getElementById("goal").value = state.goal || "8";
  } catch (e) {}
}

function toMins(val) {
  if (!val) return null;
  var parts = val.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function nowMins() {
  var n = new Date();
  return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
}

function fmtTime(totalMins) {
  var normalized = ((totalMins % 1440) + 1440) % 1440;
  var h = Math.floor(normalized / 60);
  var m = Math.round(normalized % 60);
  if (m === 60) {
    h++;
    m = 0;
  }
  var ampm = h >= 12 ? "pm" : "am";
  var h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ":" + String(m).padStart(2, "0") + ampm;
}

function fmtDuration(mins) {
  var totalSec = Math.round(mins * 60);
  var h = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  if (h > 0)
    return (
      h +
      "h " +
      String(m).padStart(2, "0") +
      "m " +
      String(s).padStart(2, "0") +
      "s"
    );
  return m + "m " + String(s).padStart(2, "0") + "s";
}

function fmtTimeLeft(mins) {
  if (mins <= 0) return "Done!";
  var totalSec = Math.round(mins * 60);
  var h = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  if (h > 0)
    return (
      h +
      "h " +
      String(m).padStart(2, "0") +
      "m " +
      String(s).padStart(2, "0") +
      "s left"
    );
  if (m > 0) return m + "m " + String(s).padStart(2, "0") + "s left";
  return s + "s left";
}

function fmtDurationShort(mins) {
  var h = Math.floor(mins / 60);
  var m = Math.round(mins % 60);
  if (h === 0) return m + "m";
  if (m === 0) return h + "h";
  return h + "h " + m + "m";
}

function getPaidMinsSoFar(in1, out1, in2, now) {
  if (in1 === null) return null;
  if (now < in1) return 0;
  if (out1 === null) return now - in1;
  if (now <= out1) return now - in1;
  var morning = out1 - in1;
  if (in2 === null) return morning;
  if (now <= in2) return morning;
  return morning + (now - in2);
}

function renderLive(in1, out1, in2, goalMins) {
  var area = document.getElementById("live-area");
  if (in1 === null) {
    area.innerHTML = "";
    return;
  }

  var now = nowMins();
  var paidSoFar = getPaidMinsSoFar(in1, out1, in2, now);
  if (paidSoFar === null || paidSoFar < 0) paidSoFar = 0;

  var remaining = Math.max(goalMins - paidSoFar, 0); // <-- new
  var pct = Math.min((paidSoFar / goalMins) * 100, 100);
  var fillClass = pct >= 100 ? "over" : pct >= 90 ? "warn" : "";

  var onBreak =
    (out1 !== null && in2 === null && now > out1) ||
    (out1 !== null && in2 !== null && now > out1 && now < in2);

  var statusLabel = onBreak
    ? '<span style="color:var(--text-warning)">On lunch break</span>'
    : '<span class="dot"></span>Clocked in \u2014 tracking live';

  area.innerHTML =
    '<div class="live-card">' +
    '<div class="live-top">' +
    '<span class="live-label">' +
    statusLabel +
    "</span>" +
    '<span class="live-pct">' +
    Math.round(pct) +
    "% of goal</span>" +
    "</div>" +
    '<div class="live-ticker-wrap">' +
    '<div style="flex:1">' +
    '<p class="live-ticker-label">paid hours so far</p>' +
    '<p class="live-ticker">' +
    fmtDuration(paidSoFar) +
    "</p>" +
    "</div>" +
    '<div style="flex:1;text-align:center">' +
    '<p class="live-ticker-label">' +
    fmtTimeLeft(remaining) +
    "</p>" +
    "</div>" +
    "</div>" +
    '<div class="progress-bar">' +
    '<div class="progress-fill ' +
    fillClass +
    '" style="width:' +
    pct.toFixed(1) +
    '%"></div>' +
    "</div>" +
    '<div class="progress-labels">' +
    "<span>0h</span>" +
    "<span>" +
    (goalMins / 60).toFixed(1) +
    "h goal</span>" +
    "</div>" +
    "</div>";
}

function clearField(id) {
  document.getElementById(id).value = "";
  calc();
}

function stampNow(id) {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, "0");
  var mm = String(now.getMinutes()).padStart(2, "0");
  document.getElementById(id).value = hh + ":" + mm;
  calc();
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById("in1").value = "";
  document.getElementById("out1").value = "";
  document.getElementById("in2").value = "";
  document.getElementById("goal").value = "8";
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  document.getElementById("live-area").innerHTML = "";
  document.getElementById("result-area").innerHTML =
    '<div class="result"><p class="empty">Enter your morning clock-in time to get started</p></div>';
}

function calc() {
  saveState();

  var in1 = toMins(document.getElementById("in1").value);
  var out1 = toMins(document.getElementById("out1").value);
  var in2 = toMins(document.getElementById("in2").value);
  var goalHrs = parseFloat(document.getElementById("goal").value) || 8;
  var goalMins = Math.round(goalHrs * 60);

  if (tickInterval) clearInterval(tickInterval);
  renderLive(in1, out1, in2, goalMins);
  if (in1 !== null) {
    tickInterval = setInterval(function () {
      renderLive(in1, out1, in2, goalMins);
    }, 1000);
  }

  var area = document.getElementById("result-area");

  if (in1 === null) {
    area.innerHTML =
      '<div class="result"><p class="empty">Enter your morning clock-in time to get started</p></div>';
    return;
  }

  var morningMins = null,
    breakMins = null,
    paidSoFar = null,
    afternoonStart = null;

  if (out1 !== null && in2 !== null) {
    morningMins = out1 - in1;
    breakMins = in2 - out1;
    afternoonStart = in2;
    paidSoFar = morningMins;
  } else if (out1 !== null) {
    morningMins = out1 - in1;
    paidSoFar = morningMins;
  } else {
    paidSoFar = 0;
  }

  var remainingMins = goalMins - (paidSoFar || 0);
  var clockOutMins = null,
    status = "";

  if (afternoonStart !== null) {
    clockOutMins = afternoonStart + remainingMins;
  } else if (out1 === null) {
    clockOutMins = in1 + goalMins;
    status = "no-lunch";
  }

  var html = '<div class="result">';

  if (clockOutMins !== null) {
    html += '<p class="result-label">Clock out at</p>';
    html += '<p class="result-time">' + fmtTime(clockOutMins) + "</p>";
    if (status === "no-lunch") {
      html +=
        '<p class="result-sub status-warn">No lunch break entered \u2014 straight ' +
        goalHrs +
        "h from clock-in</p>";
    } else {
      html +=
        '<p class="result-sub status-ok">to hit ' +
        goalHrs +
        " paid hours today</p>";
    }
  }

  html += '<div class="metrics">';
  if (morningMins !== null) {
    html +=
      '<div class="metric"><p class="metric-label">Morning block</p><p class="metric-val">' +
      fmtDurationShort(morningMins) +
      "</p></div>";
  }
  if (breakMins !== null) {
    html +=
      '<div class="metric"><p class="metric-label">Lunch break</p><p class="metric-val">' +
      fmtDurationShort(breakMins) +
      "</p></div>";
  }
  if (afternoonStart !== null) {
    html +=
      '<div class="metric"><p class="metric-label">Afternoon needed</p><p class="metric-val">' +
      fmtDurationShort(remainingMins) +
      "</p></div>";
  }
  if (paidSoFar !== null && afternoonStart !== null) {
    html +=
      '<div class="metric"><p class="metric-label">Paid so far</p><p class="metric-val">' +
      fmtDurationShort(paidSoFar) +
      "</p></div>";
  }
  html += "</div></div>";

  area.innerHTML = html;
}

window.addEventListener("DOMContentLoaded", function () {
  loadState();
  calc();
});
