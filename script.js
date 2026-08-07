const audioElement = document.getElementById('audio-element');

// Settings Elements
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

// Sample Playlists / Song Feeds (Simulated Content Stream)
let songsList = [
  {
    title: "Punjabi Vibe 1",
    artist: "Karan Aujla Style",
    cover: "https://picsum.photos/300/300?random=1",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lang: "punjabi"
  },
  {
    title: "Punjabi Vibe 2",
    artist: "Diljit Dosanjh Style",
    cover: "https://picsum.photos/300/300?random=2",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    lang: "punjabi"
  },
  {
    title: "Hindi Melody",
    artist: "Arijit Singh Style",
    cover: "https://picsum.photos/300/300?random=3",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    lang: "hindi"
  }
];

let currentSongIndex = 0;

// 1. Settings Modal Controls
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
closeSettings.onclick = () => {
  settingsModal.style.display = 'none';
  renderContent(); // Apply language filter refresh
};

// 2. Open / Close Player Overlay
miniPlayer.onclick = (e) => {
  if (e.target.closest('#mini-play-btn')) return;
  playerOverlay.classList.add('active');
};
closePlayer.onclick = () => playerOverlay.classList.remove('active');

// 3. MediaSession API (Crutial for Lock Screen & Background Audio Play)
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

// 4. Playback Logic
function loadSong(song) {
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
  currentSongIndex = (currentSongIndex - 1 + songsList.length) % songsList.length;
  loadSong(songsList[currentSongIndex]);
  playSong();
}

function playNext() {
  currentSongIndex = (currentSongIndex + 1) % songsList.length;
  loadSong(songsList[currentSongIndex]);
  playSong();
}

playBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
miniPlayBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
prevBtn.onclick = playPrev;
nextBtn.onclick = playNext;

// 5. Seek & Volume Bar
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

// 6. Dynamic Content Renderer (Language Filtered)
function renderContent() {
  const selectedLang = languageSelect.value;
  const filtered = songsList.filter(s => s.lang === selectedLang);

  const latestContainer = document.getElementById('latest-releases');
  latestContainer.innerHTML = '';

  const activeList = filtered.length > 0 ? filtered : songsList;

  activeList.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${song.cover}" alt="Cover">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    card.onclick = () => {
      currentSongIndex = index;
      loadSong(song);
      playSong();
    };
    latestContainer.appendChild(card);
  });
}

// Initial Load
loadSong(songsList[0]);
renderContent();
