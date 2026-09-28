/**
 * Options Page Controller for Chrome Extension
 */
const focusDurationInput = document.getElementById('focusDuration');
const shortBreakDurationInput = document.getElementById('shortBreakDuration');
const longBreakDurationInput = document.getElementById('longBreakDuration');
const longBreakIntervalInput = document.getElementById('longBreakInterval');
const autoStartBreaksInput = document.getElementById('autoStartBreaks');
const autoStartFocusInput = document.getElementById('autoStartFocus');
const notificationsEnabledInput = document.getElementById('notificationsEnabled');
const focusAlarmSoundInput = document.getElementById('focusAlarmSound');
const breakAlarmSoundInput = document.getElementById('breakAlarmSound');
const saveBtn = document.getElementById('save-btn');
const clearDataBtn = document.getElementById('clear-data-btn');
const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
const toast = document.getElementById('toast');

function showToast(msg = 'Settings saved!') {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

function loadSettings() {
  const getFn = typeof chrome !== 'undefined' && chrome.storage ? 
    (cb) => chrome.storage.local.get(['focusflow_user_settings'], cb) :
    (cb) => cb({ focusflow_user_settings: JSON.parse(localStorage.getItem('focusflow_user_settings') || '{}') });

  getFn((res) => {
    const s = res.focusflow_user_settings || {};
    if (s.focusDuration) focusDurationInput.value = s.focusDuration;
    if (s.shortBreakDuration) shortBreakDurationInput.value = s.shortBreakDuration;
    if (s.longBreakDuration) longBreakDurationInput.value = s.longBreakDuration;
    if (s.longBreakInterval) longBreakIntervalInput.value = s.longBreakInterval;
    autoStartBreaksInput.checked = Boolean(s.autoStartBreaks);
    autoStartFocusInput.checked = Boolean(s.autoStartFocus);
    notificationsEnabledInput.checked = s.notificationsEnabled !== false;
    if (s.focusAlarmSound) focusAlarmSoundInput.value = s.focusAlarmSound;
    if (s.breakAlarmSound) breakAlarmSoundInput.value = s.breakAlarmSound;
  });
}

function saveSettings() {
  const settings = {
    focusDuration: parseInt(focusDurationInput.value) || 25,
    shortBreakDuration: parseInt(shortBreakDurationInput.value) || 5,
    longBreakDuration: parseInt(longBreakDurationInput.value) || 15,
    longBreakInterval: parseInt(longBreakIntervalInput.value) || 4,
    autoStartBreaks: autoStartBreaksInput.checked,
    autoStartFocus: autoStartFocusInput.checked,
    notificationsEnabled: notificationsEnabledInput.checked,
    focusAlarmSound: focusAlarmSoundInput.value,
    breakAlarmSound: breakAlarmSoundInput.value,
  };

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ focusflow_user_settings: settings }, () => {
      showToast('Settings saved to extension storage!');
    });
  } else {
    localStorage.setItem('focusflow_user_settings', JSON.stringify(settings));
    showToast('Settings saved to LocalStorage!');
  }
}

clearDataBtn.addEventListener('click', () => {
  const confirmed = confirm('Are you sure you want to completely clear all user data and preferences from local storage?');
  if (confirmed) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.clear(() => {
        showToast('Local storage cleared cleanly!');
        loadSettings();
      });
    } else {
      localStorage.clear();
      showToast('Local storage cleared cleanly!');
      loadSettings();
    }
  }
});

resetDefaultsBtn.addEventListener('click', () => {
  focusDurationInput.value = 25;
  shortBreakDurationInput.value = 5;
  longBreakDurationInput.value = 15;
  longBreakIntervalInput.value = 4;
  autoStartBreaksInput.checked = false;
  autoStartFocusInput.checked = false;
  notificationsEnabledInput.checked = true;
  focusAlarmSoundInput.value = 'bell';
  breakAlarmSoundInput.value = 'chime';
  saveSettings();
});

saveBtn.addEventListener('click', saveSettings);
loadSettings();
