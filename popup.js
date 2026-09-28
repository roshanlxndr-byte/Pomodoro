/**
 * FocusFlow Popup Controller
 */
const circumference = 2 * Math.PI * 88;
const progressCircle = document.getElementById('progress-circle');
const timerDisplay = document.getElementById('timer-display');
const toggleBtn = document.getElementById('toggle-btn');
const toggleLabel = document.getElementById('toggle-label');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const modeLabel = document.getElementById('mode-label');
const tabButtons = document.querySelectorAll('.tab-btn');

let state = {
  mode: 'focus',
  timeLeftSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  isRunning: false,
  completedCycles: 0
};
let settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4
};

// Initialize
function init() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['focusflow_timer_state', 'focusflow_user_settings'], (res) => {
      if (res.focusflow_user_settings) settings = res.focusflow_user_settings;
      if (res.focusflow_timer_state) state = res.focusflow_timer_state;
      render();
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.focusflow_timer_state) {
        state = changes.focusflow_timer_state.newValue;
        render();
      }
      if (changes.focusflow_user_settings) {
        settings = changes.focusflow_user_settings.newValue;
      }
    });
  } else {
    render();
  }

  setInterval(() => {
    if (state.isRunning && state.timeLeftSeconds > 0) {
      state.timeLeftSeconds -= 1;
      render();
    }
  }, 1000);
}

function render() {
  const mins = Math.floor(state.timeLeftSeconds / 60);
  const secs = state.timeLeftSeconds % 60;
  timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const fraction = state.timeLeftSeconds / (state.totalSeconds || 1);
  const offset = circumference * (1 - fraction);
  progressCircle.style.strokeDashoffset = offset;

  const modeColor = state.mode === 'focus' ? '#f43f5e' : (state.mode === 'shortBreak' ? '#10b981' : '#06b6d4');
  progressCircle.style.stroke = modeColor;
  toggleBtn.style.backgroundColor = modeColor;

  toggleLabel.textContent = state.isRunning ? 'Pause' : 'Start ' + (state.mode === 'focus' ? 'Focus' : 'Break');
  modeLabel.textContent = state.mode === 'focus' ? 'Focus Session' : (state.mode === 'shortBreak' ? 'Short Break' : 'Long Break');

  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
  });
}

toggleBtn.addEventListener('click', () => {
  state.isRunning = !state.isRunning;
  save();
  render();
});

resetBtn.addEventListener('click', () => {
  state.isRunning = false;
  const mins = state.mode === 'focus' ? settings.focusDuration : (state.mode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration);
  state.timeLeftSeconds = mins * 60;
  state.totalSeconds = mins * 60;
  save();
  render();
});

skipBtn.addEventListener('click', () => {
  state.isRunning = false;
  if (state.mode === 'focus') {
    state.completedCycles = (state.completedCycles || 0) + 1;
    const isLong = state.completedCycles % (settings.longBreakInterval || 4) === 0;
    state.mode = isLong ? 'longBreak' : 'shortBreak';
    const mins = isLong ? settings.longBreakDuration : settings.shortBreakDuration;
    state.timeLeftSeconds = mins * 60;
    state.totalSeconds = mins * 60;
  } else {
    state.mode = 'focus';
    state.timeLeftSeconds = settings.focusDuration * 60;
    state.totalSeconds = settings.focusDuration * 60;
  }
  save();
  render();
});

openSettingsBtn.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open('options.html', '_blank');
  }
});

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetMode = btn.dataset.mode;
    state.mode = targetMode;
    state.isRunning = false;
    const mins = targetMode === 'focus' ? settings.focusDuration : (targetMode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration);
    state.timeLeftSeconds = mins * 60;
    state.totalSeconds = mins * 60;
    save();
    render();
  });
});

function save() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ focusflow_timer_state: state });
    if (state.isRunning) {
      chrome.alarms.create('focusflow_ticker', { periodInMinutes: 1/60 });
    } else {
      chrome.alarms.clear('focusflow_ticker');
    }
  }
}

init();
