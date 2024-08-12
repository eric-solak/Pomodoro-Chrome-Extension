document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    toggleButton: document.getElementById('toggle'),
    resetButton: document.getElementById('reset'),
    timerDisplay: document.getElementById('timer'),
    roundsDisplay: document.getElementById('pomodoroRounds'),
    untilBreakDisplay: document.getElementById('roundsUntilBreak'),
    breakDisplay: document.getElementById('onBreak'),
    workTimeInput: document.getElementById('workTimeValue'),
    breakTimeInput: document.getElementById('breakTimeValue'),
    longBreakTimeInput: document.getElementById('longBreakTimeValue'),
  };

  // Handle general event listener function
  function handleInputChange(event) {
    const key = event.target.id.replace('Value', '');
    const value = parseInt(event.target.value, 10);
    chrome.storage.local.set({ [key]: value });
  }

  // Event listeners to work time, break time, long break inputs
  elements.workTimeInput.addEventListener('change', handleInputChange);
  elements.breakTimeInput.addEventListener('change', handleInputChange);
  elements.longBreakTimeInput.addEventListener('change', handleInputChange);

  // Event listeners to buttons
  elements.toggleButton.addEventListener('click', () => sendMessageToBackground('onToggle'));
  elements.resetButton.addEventListener('click', () => sendMessageToBackground('onReset'));

  // Function to send message to background script
  function sendMessageToBackground(action) {
    chrome.runtime.sendMessage({ action }, function(response) {
      console.log('Response from background:', response);
    });
  }

  // Function to update UI based on timer state from background.js
  function updateUI({ minutes, seconds, pomodoroRounds, totalRounds, onBreak, isPaused }) {
    elements.timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    elements.roundsDisplay.textContent = `Total Rounds Completed: ${totalRounds}`;
    elements.untilBreakDisplay.innerHTML = `Rounds Until Long Break: ${(pomodoroRounds % 4 === 0 && pomodoroRounds !== 0) ? 0 : 4 - (pomodoroRounds % 4)}`;

    if (isPaused) {
      elements.toggleButton.textContent = 'Start';
      elements.toggleButton.classList.add('paused');
      elements.toggleButton.classList.remove('started');
    } else {
      elements.toggleButton.textContent = 'Pause';
      elements.toggleButton.classList.add('started');
      elements.toggleButton.classList.remove('paused');
    }

    elements.breakDisplay.innerHTML = onBreak ? `Break - take a deep breath<br>` : `ㅤ<br>`;
  }

  chrome.storage.local.get(['workTime', 'breakTime', 'longBreakTime', 'timerState'], function(result) {
    const { workTime, breakTime, longBreakTime, timerState } = result;

    if (workTime !== undefined) elements.workTimeInput.value = workTime;
    if (breakTime !== undefined) elements.breakTimeInput.value = breakTime;
    if (longBreakTime !== undefined) elements.longBreakTimeInput.value = longBreakTime;

    if (timerState) {
      updateUI(timerState);
    }
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.timerState) {
      updateUI(changes.timerState.newValue);
    }
  });
});
