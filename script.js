const audioElement = document.getElementById('audio-element');

// UI Elements
const searchInput = document.getElementById('search-input');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const languageSelect = document.getElementById('language-select');

// Player Overlay Elements
const miniPlayer = document.getElementById('mini-player');
const playerOverlay = document.getElementById('player-overlay');
const closePlayer = document.getElementById('close-player');

// Player Controls
const playBtn = document.getElementById('play-btn');
const miniPlayBtn = document.getElementById('mini-play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerCover = document.getElementById('player-cover');

const miniTitle = document.getElementById('mini-title');
const miniArtist = document.getElementById('mini-artist');
const miniCover = document.getElementById('mini-cover');

const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');

let currentPlaylist = [];
let currentSongIndex = 0;

// iTunes/Apple Free API Integration (Instant Realtime Songs)
async function fetchSongs(query) {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`);
    const data = await response.json();
    return data.results.map(track => ({
      title: track.trackName,
      artist: track.artistName,
      cover: track.artworkUrl100.replace('100x100bb', '400x400bb'),
      src: track.previewUrl
    }));
  } catch (error) {
    console.error("Error fetching music:", error);
    return [];
  }
}

// Render Content Dynamically Based on Language Setting
async function loadHomeContent() {
  const lang = languageSelect.value;
  
  // Fetch Real Latest & Trending Songs
  const latestSongs = await fetchSongs(`${lang} latest hits`);
  const trendingSongs = await fetchSongs(`${lang} top songs`);

  if (latestSongs.length > 0) {
    currentPlaylist = latestSongs;
    renderCards('latest-releases', latestSongs);
  }

  if (trendingSongs.length > 0) {
    renderCards('trending-songs', trendingSongs);
  }
}

function renderCards(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  songs.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${song.cover}" alt="Cover">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    card.onclick = () => {
      currentPlaylist = songs;
      currentSongIndex = index;
      loadSong(song);
      playSong();
    };
    container.appendChild(card);
  });
}

// Realtime Live Search
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(async () => {
      const results = await fetchSongs(query);
      if (results.length > 0) {
        currentPlaylist = results;
        renderCards('latest-releases', results);
      }
    }, 400);
  } else if (query.length === 0) {
    loadHomeContent();
  }
});

// Settings & Player Modal Logic
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
closeSettings.onclick = () => {
  settingsModal.style.display = 'none';
  loadHomeContent();
};

miniPlayer.onclick = (e) => {
  if (e.target.closest('#mini-play-btn')) return;
  playerOverlay.classList.add('active');
};
closePlayer.onclick = () => playerOverlay.classList.remove('active');

// MediaSession API (Background Play & Lock Screen Controls)
function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Apple Music Web Player',
      artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('play', playSong);
    navigator.mediaSession.setActionHandler('pause', pauseSong);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
  }
}

// Player Functions
function loadSong(song) {
  if (!song || !song.src) return;
  audioElement.src = song.src;
  playerTitle.innerText = song.title;
  playerArtist.innerText = song.artist;
  playerCover.src = song.cover;

  miniTitle.innerText = song.title;
  miniArtist.innerText = song.artist;
  miniCover.src = song.cover;

  updateMediaSession(song);
}

function playSong() {
  audioElement.play();
  playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  miniPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

function pauseSong() {
  audioElement.pause();
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  miniPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function playPrev() {
  if (currentPlaylist.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
  loadSong(currentPlaylist[currentSongIndex]);
  playSong();
}

function playNext() {
  if (currentPlaylist.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
  loadSong(currentPlaylist[currentSongIndex]);
  playSong();
}

playBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
miniPlayBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
prevBtn.onclick = playPrev;
nextBtn.onclick = playNext;

audioElement.onended = playNext;

// Seek & Volume
audioElement.ontimeupdate = () => {
  if (audioElement.duration) {
    seekBar.value = (audioElement.currentTime / audioElement.duration) * 100;
  }
};

seekBar.oninput = () => {
  audioElement.currentTime = (seekBar.value / 100) * audioElement.duration;
};

volumeBar.oninput = () => {
  audioElement.volume = volumeBar.value;
};

// Initial Load
loadHomeContent();
