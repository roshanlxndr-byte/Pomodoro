/**
 * FocusFlow Chrome Extension - Background Service Worker (Manifest V3)
 * Handles background timer persistence, chrome.alarms, badge updates, and desktop notifications.
 */

const ALARM_NAME = 'focusflow_ticker';

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['focusflow_user_settings', 'focusflow_timer_state'], (res) => {
    if (!res.focusflow_user_settings) {
      chrome.storage.local.set({
        focusflow_user_settings: {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
          notificationsEnabled: true,
          soundEnabled: true,
          alarmVolume: 80,
          focusAlarmSound: 'bell',
          breakAlarmSound: 'chime'
        }
      });
    }

    if (!res.focusflow_timer_state) {
      chrome.storage.local.set({
        focusflow_timer_state: {
          mode: 'focus',
          timeLeftSeconds: 25 * 60,
          totalSeconds: 25 * 60,
          isRunning: false,
          completedCycles: 0,
          lastUpdated: Date.now()
        }
      });
    }
  });
  updateBadge('25m', '#f43f5e');
});

// Update badge icon text and color
function updateBadge(text, color = '#f43f5e') {
  chrome.action.setBadgeText({ text: text || '' });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Background alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    tickTimer();
  }
});

function tickTimer() {
  chrome.storage.local.get(['focusflow_timer_state', 'focusflow_user_settings'], (data) => {
    const state = data.focusflow_timer_state;
    const settings = data.focusflow_user_settings || {};
    if (!state || !state.isRunning) return;

    if (state.timeLeftSeconds > 1) {
      state.timeLeftSeconds -= 1;
      const mins = Math.ceil(state.timeLeftSeconds / 60);
      updateBadge(`${mins}m`, state.mode === 'focus' ? '#f43f5e' : '#10b981');
      chrome.storage.local.set({ focusflow_timer_state: state });
    } else {
      // Phase completed!
      handlePhaseTransition(state, settings);
    }
  });
}

function handlePhaseTransition(state, settings) {
  let nextMode = 'shortBreak';
  let nextDurationMins = settings.shortBreakDuration || 5;
  let title = 'Break Time!';
  let message = 'Great focus session! Take a relaxing break.';

  if (state.mode === 'focus') {
    state.completedCycles = (state.completedCycles || 0) + 1;
    const isLongBreak = state.completedCycles % (settings.longBreakInterval || 4) === 0;

    if (isLongBreak) {
      nextMode = 'longBreak';
      nextDurationMins = settings.longBreakDuration || 15;
      title = 'Long Break Time!';
      message = `You completed ${settings.longBreakInterval} sessions! Take a well-deserved ${nextDurationMins} minute rest.`;
    } else {
      nextMode = 'shortBreak';
      nextDurationMins = settings.shortBreakDuration || 5;
      title = 'Focus Finished!';
      message = `Time for a ${nextDurationMins} minute break. Stretch and hydrate!`;
    }
  } else {
    // Break finished -> back to focus
    nextMode = 'focus';
    nextDurationMins = settings.focusDuration || 25;
    title = 'Break Ended!';
    message = 'Ready to dive back into deep work? Time to focus!';
  }

  // Send desktop notification
  if (settings.notificationsEnabled !== false) {
    chrome.notifications.create(`focusflow_transition_${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 2,
      requireInteraction: true
    });
  }

  const shouldAutoStart = nextMode === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks;

  state.mode = nextMode;
  state.timeLeftSeconds = nextDurationMins * 60;
  state.totalSeconds = nextDurationMins * 60;
  state.isRunning = Boolean(shouldAutoStart);
  state.lastUpdated = Date.now();

  updateBadge(shouldAutoStart ? `${nextDurationMins}m` : 'DONE', nextMode === 'focus' ? '#f43f5e' : '#10b981');
  chrome.storage.local.set({ focusflow_timer_state: state });
}
