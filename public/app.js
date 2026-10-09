const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerAvailableInput = document.getElementById('player-available');
const playerList = document.getElementById('player-list');
const message = document.getElementById('message');

async function loadPlayers() {
  try {
    const response = await fetch('/api/players');
    const players = await response.json();

    if (!Array.isArray(players)) {
      throw new Error('Invalid response from server');
    }

    if (players.length === 0) {
      playerList.innerHTML = '<li class="empty">No players yet.</li>';
      return;
    }

    playerList.innerHTML = players
      .map(
        (player) => `
          <li class="player-item">
            <div>
              <strong>${player.name}</strong>
              <span>${player.available}</span>
            </div>
            <button data-id="${player.id}" class="delete-btn">Delete</button>
          </li>
        `
      )
      .join('');
  } catch (error) {
    message.textContent = 'Could not load players.';
    message.classList.add('error');
    console.error(error);
  }
}

playerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = playerNameInput.value.trim();
  const available = playerAvailableInput.value;

  if (!name) {
    showMessage('Please enter a player name.', true);
    return;
  }

  try {
    const response = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, available })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add player');
    }

    showMessage('Player added successfully.', false);
    playerForm.reset();
    await loadPlayers();
  } catch (error) {
    showMessage(error.message, true);
  }
});

playerList.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('.delete-btn');
  if (!deleteButton) return;

  const id = deleteButton.dataset.id;

  try {
    const response = await fetch(`/api/players/${id}`, { method: 'DELETE' });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Delete failed');
    }

    showMessage('Player removed.', false);
    await loadPlayers();
  } catch (error) {
    showMessage(error.message, true);
  }
});

function showMessage(text, isError) {
  message.textContent = text;
  message.className = `message ${isError ? 'error' : 'success'}`;
}

loadPlayers();
