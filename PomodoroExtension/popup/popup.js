document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start');
  const pauseButton = document.getElementById('pause');
  const resetButton = document.getElementById('reset');
  const timerDisplay = document.getElementById('timer');
  const roundsDisplay = document.getElementById('pomodoroRounds');
  const untilBreakDisplay = document.getElementById('roundsUntilBreak');
  const breakDisplay = document.getElementById('onBreak');

  // Add event listeners to buttons
  startButton.addEventListener('click', function() {
    sendMessageToBackground({ action: 'onStart' });
  });

  pauseButton.addEventListener('click', function() {
    sendMessageToBackground({ action: 'onPause' });
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

  // Listen for changes in timer state and update UI
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.timerState) {
      const { minutes, seconds, pomodoroRounds, totalRounds, onBreak } = changes.timerState.newValue;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      roundsDisplay.textContent = `Total Rounds Completed: ${totalRounds}`;
      untilBreakDisplay.innerHTML = `Rounds Until Long Break: ${(pomodoroRounds % 4 === 0 && pomodoroRounds !== 0) ? 0 : 4 - (pomodoroRounds % 4)}`;
      if (onBreak) {
        breakDisplay.textContent = `On break - take a deep breath`;
      } else {
        breakDisplay.innerHTML = `<br>`;
      }
    }
  });

  // Retrieve initial timer state and update UI
  chrome.storage.local.get(['timerState'], function(result) {
    if (result.timerState) {
      const { minutes, seconds, pomodoroRounds, totalRounds, onBreak } = result.timerState;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      roundsDisplay.textContent = `Total Rounds Completed: ${totalRounds}`;
      untilBreakDisplay.innerHTML = `Rounds Until Long Break: ${(pomodoroRounds % 4 === 0 && pomodoroRounds !== 0) ? 0 : 4 - (pomodoroRounds % 4)}`;
      if (onBreak) {
        breakDisplay.textContent = `On break - take a deep breath`;
      } else {
        breakDisplay.innerHTML = `<br>`;
      }
    }
  });

});
