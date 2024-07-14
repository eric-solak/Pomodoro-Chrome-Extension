// Define the initial timer state
let timerState = {
    minutes: 25,
    seconds: 0,
    isPaused: true,
    onBreak: false,
    totalRounds: 0,
    pomodoroRounds: 0
  };

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.action) {
    case 'onStart':
      handleStart(sendResponse);
      break;
    case 'onPause':
      handlePause(sendResponse);
      break;
    case 'onReset':
      handleReset(sendResponse);
      break;
    default:
      console.error('Unhandled message:', message);
      sendResponse({ error: 'Unhandled message' });
  }
  // Return true to indicate asynchronous sendResponse usage
  return true;
});

// Function to handle 'onStart' action
function handleStart(sendResponse) {
  if (timerState.isPaused) {
    timerState.isPaused = false;
    chrome.alarms.create('pomodoroTimer', { periodInMinutes: 1/60 });
    chrome.storage.local.set({ timerState }, function() {
      sendResponse({ message: 'Timer started successfully' });
    });
  } else {
    sendResponse({ error: 'Timer is already running' });
  }
}

// Function to handle 'onPause' action
function handlePause(sendResponse) {
  timerState.isPaused = true;
  chrome.alarms.clear('pomodoroTimer');
  chrome.storage.local.set({ timerState }, function() {
    sendResponse({ message: 'Timer paused successfully' });
  });
}

// Function to handle 'onReset' action
function handleReset(sendResponse) {
  chrome.alarms.clear('pomodoroTimer')
  timerState = {
    minutes: 25,
    seconds: 0,
    isPaused: true,
    onBreak: false,
    pomodoroRounds: 0,
    totalRounds: 0
  };
  chrome.storage.local.set({ timerState }, function() {
    sendResponse({ message: 'Timer reset successfully' });
  });
}

// Function to update timer on alarm trigger
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'pomodoroTimer') {
    updateTimer();
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
    console.log('Updated timer state:', timerState);
  }
}

// Function to handle timer end (start break or next round)
function handleTimerEnd() {
  if (!timerState.onBreak) { // Break time
    timerState.onBreak = true;
    timerState.minutes = 5; 
    timerState.seconds = 0;
    notifyBreakStart();
  } else { // Pomodoro time
    timerState.onBreak = false;
    timerState.minutes = 25; 
    timerState.seconds = 0; 
    timerState.totalRounds++;
    timerState.pomodoroRounds++;
    if (timerState.pomodoroRounds === 4) { // Long break time after 4 rounds
      timerState.onBreak = true;
      timerState.seconds = 20;
      timerState.minutes = 0; 
      timerState.pomodoroRounds = 0;
      timerState.totalRounds++;
      notifyBreakStart();
    } else {
      notifyBreakEnd();
    }
  }
  chrome.storage.local.set({ timerState });
}

function notifyBreakStart() {
  const notificationOptions = {
    type: 'basic',
    iconUrl: '/images/icon-16.png',
    title: 'Pomodoro Break Began',
    message: 'Time to take a rest!'
  }

  chrome.notifications.create('breakStartNotification', notificationOptions, function(notificationId) {
    console.log('Break start notification created:', notificationId);
  });
}

function notifyBreakEnd() {
  const notificationOptions = {
    type: 'basic',
    iconUrl: '/images/icon-16.png',
    title: 'Pomodoro Break Ended',
    message: 'Time to get back to work!'
  }

  chrome.notifications.create('breakEndNotification', notificationOptions, function(notificationId) {
    console.log('Break end notification created:', notificationId);
  });
}

// Initial setup: retrieve timer state from storage
chrome.storage.local.get(['timerState'], function(result) {
  if (result.timerState) {
    timerState = result.timerState;
  }
});

