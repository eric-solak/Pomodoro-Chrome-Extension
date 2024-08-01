document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggle');
  const resetButton = document.getElementById('reset');

  const timerDisplay = document.getElementById('timer');
  const roundsDisplay = document.getElementById('pomodoroRounds');
  const untilBreakDisplay = document.getElementById('roundsUntilBreak');
  const breakDisplay = document.getElementById('onBreak');

  const workTimeInput = document.getElementById('workTimeValue');
  const breakTimeInput = document.getElementById('breakTimeValue');
  const longBreakTimeInput = document.getElementById('longBreakTimeValue');

  // Event listeners to work time, break time, long break inputs
  workTimeInput.addEventListener('change', function() {
    const workTime = parseInt(workTimeInput.value, 10);
    chrome.storage.local.set({ workTime: workTime }, function() {
    });
  });

  breakTimeInput.addEventListener('change', function() {
    const breakTime = parseInt(breakTimeInput.value, 10);
    chrome.storage.local.set({ breakTime: breakTime }, function() {
    });
  });

  longBreakTimeInput.addEventListener('change', function() {
    const longBreakTime = parseInt(longBreakTimeInput.value, 10);
    chrome.storage.local.set({ longBreakTime: longBreakTime }, function() {
    });
  });

  // Event listeners to buttons
  toggleButton.addEventListener('click', function() {
    sendMessageToBackground({ action: 'onToggle' });
  });

  resetButton.addEventListener('click', function() {
    sendMessageToBackground({ action: 'onReset' });
  });

  // Function to send message to background script
  function sendMessageToBackground(message) {
    chrome.runtime.sendMessage(message, function(response) {
      console.log('Response from background:', response);
    });
  }

  // Retrieve initial timer settings and update UI
  chrome.storage.local.get(['workTime', 'breakTime', 'longBreakTime'], function(result) {
    console.log(result.workTime)
    if (result.workTime) {
      workTimeInput.value = result.workTime;
    }
    if (result.breakTime) {
      breakTimeInput.value = result.breakTime;
    }
    if (result.longBreakTime) {
      longBreakTimeInput.value = result.longBreakTime;
    }
  });

  // Listen for changes in timer state and update UI
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.timerState) {
      const { minutes, seconds, pomodoroRounds, totalRounds, onBreak, isPaused } = changes.timerState.newValue;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      roundsDisplay.textContent = `Total Rounds Completed: ${totalRounds}`;
      untilBreakDisplay.innerHTML = `Rounds Until Long Break: ${(pomodoroRounds % 4 === 0 && pomodoroRounds !== 0) ? 0 : 4 - (pomodoroRounds % 4)}`;
      
      if (isPaused) {
        toggleButton.textContent = 'Start'
        toggleButton.classList.add('paused');
        toggleButton.classList.remove('started');
      } else {
        toggleButton.textContent = 'Pause'
        toggleButton.classList.add('started');
        toggleButton.classList.remove('paused');
      }
      
      if (onBreak) {
        breakDisplay.innerHTML = `Break - take a deep breath<br>`;
      } else {
        breakDisplay.innerHTML = `ㅤ<br>`;
      }
    }
  });

  // Retrieve initial timer state and update UI
  chrome.storage.local.get(['timerState'], function(result) {
    if (result.timerState) {
      const { minutes, seconds, pomodoroRounds, totalRounds, onBreak, isPaused } = result.timerState;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      roundsDisplay.textContent = `Total Rounds Completed: ${totalRounds}`;
      untilBreakDisplay.innerHTML = `Rounds Until Long Break: ${(pomodoroRounds % 4 === 0 && pomodoroRounds !== 0) ? 0 : 4 - (pomodoroRounds % 4)}`;
      
      if (isPaused) {
        toggleButton.textContent = 'Start'
        toggleButton.classList.add('paused');
        toggleButton.classList.remove('started');
      } else {
        toggleButton.textContent = 'Pause'
        toggleButton.classList.add('started');
        toggleButton.classList.remove('paused');
      }

      if (onBreak) {
        breakDisplay.innerHTML = `Break - take a deep breath<br>`;
      } else {
        breakDisplay.innerHTML = `ㅤ<br>`;
      }
    }
  });


});
