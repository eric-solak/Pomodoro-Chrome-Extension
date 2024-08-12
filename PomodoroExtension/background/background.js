let timerState = {
  minutes: 25,
  seconds: 0,
  isPaused: true,
  onBreak: false,
  totalRounds: 0,
  pomodoroRounds: 0,
  workTime: 25,
  breakTime: 5,
  longBreakTime: 20
};

// Load initial timer durations from storage
chrome.storage.local.get(['workTime', 'breakTime', 'longBreakTime'], function (result) {
  if (result.workTime) 
    timerState.workTime = result.workTime;
  if (result.breakTime) 
    timerState.breakTime = result.breakTime;
  if (result.longBreakTime) 
    timerState.longBreakTime = result.longBreakTime;
  timerState.minutes = timerState.workTime;
  chrome.storage.local.set({ timerState });
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.action) {
    case 'onToggle':
      handleToggle(sendResponse);
      break;
    case 'onReset':
      handleReset(sendResponse);
      break;
    default:
      console.error('Unhandled message:', message);
      sendResponse({ error: 'Unhandled message' });
  }
  return true;
});

// Function to handle 'onToggle' action
function handleToggle(sendResponse) {
  if (timerState.isPaused) {
    timerState.isPaused = false;
    chrome.alarms.create('pomodoroTimer', { periodInMinutes: 1 / 60 });
    chrome.storage.local.set({ timerState }, function () {
      sendResponse({ message: 'Timer started successfully' });
    });
  } else {
    timerState.isPaused = true;
    chrome.alarms.clear('pomodoroTimer');
    chrome.storage.local.set({ timerState }, function () {
      sendResponse({ message: 'Timer paused successfully' });
    });
  }
}

// Function to handle 'onReset' action
function handleReset(sendResponse) {
  chrome.alarms.clear('pomodoroTimer');
  timerState.isPaused = true;
  timerState.onBreak = false;
  timerState.pomodoroRounds = 0;
  timerState.totalRounds = 0;
  chrome.storage.local.get(['workTime'], function (result) {
    timerState.minutes = result.workTime || 25;
    timerState.seconds = 0;
    chrome.storage.local.set({ timerState }, function () {
      sendResponse({ message: 'Timer reset successfully' });
    });
  });
}

// Function to update timer on alarm trigger
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'pomodoroTimer') {
    chrome.storage.local.get('timerState', function(result) { //DOES THIS HELP??
      if (result.timerState) {
        timerState = result.timerState;
        updateTimer();
      }
    });
  }
});

// Function to update timer state
function updateTimer() {
  if (!timerState.isPaused) {
    if (timerState.seconds > 0) {
      timerState.seconds--;
    } else if (timerState.minutes > 0) {
      timerState.minutes--;
      timerState.seconds = 59;
    } else {
      handleTimerEnd();
    }
    chrome.storage.local.set({ timerState });
  }
}

// Function to handle timer end (start break or next round)
function handleTimerEnd() {
  chrome.storage.local.get(['breakTime', 'longBreakTime'], function (result) {
    if (!timerState.onBreak) { // Break time
      timerState.onBreak = true;
      timerState.minutes = result.breakTime || 5;
      timerState.seconds = 0;
      notifyBreakStart();
    } else { // Pomodoro time
      timerState.onBreak = false;
      timerState.minutes = timerState.workTime;
      timerState.seconds = 0;
      timerState.totalRounds++;
      timerState.pomodoroRounds++;
      if (timerState.pomodoroRounds === 4) { // Long break time after 4 rounds
        timerState.onBreak = true;
        timerState.minutes = result.longBreakTime || 20;
        timerState.seconds = 0;
        timerState.pomodoroRounds = 0;
        notifyBreakStart();
      } else {
        notifyBreakEnd();
      }
    }
    chrome.storage.local.set({ timerState });
  });
}

function notifyBreakStart() {
  const notificationOptions = {
    type: 'basic',
    iconUrl: '/images/icon-16.png',
    title: 'Pomodoro Break Began',
    message: 'Time to take a rest!'
  };

  chrome.notifications.create('breakStartNotification', notificationOptions, function (notificationId) {
    console.log('Break start notification created:', notificationId);
  });
}

function notifyBreakEnd() {
  const notificationOptions = {
    type: 'basic',
    iconUrl: '/images/icon-16.png',
    title: 'Pomodoro Break Ended',
    message: 'Time to get back to work!'
  };

  chrome.notifications.create('breakEndNotification', notificationOptions, function (notificationId) {
    console.log('Break end notification created:', notificationId);
  });
}
