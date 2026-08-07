const audioElement = document.getElementById('audio-element');

// UI Elements
const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const languageSelect = document.getElementById('language-select');
const homeLogo = document.getElementById('home-logo');

const miniPlayer = document.getElementById('mini-player');
const playerOverlay = document.getElementById('player-overlay');
const closePlayer = document.getElementById('close-player');

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
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

// Queue & Context Menu Elements
const queueBtn = document.getElementById('queue-btn');
const queueSheet = document.getElementById('queue-sheet');
const closeQueue = document.getElementById('close-queue');
const queueListContainer = document.getElementById('queue-list-container');

const contextModal = document.getElementById('context-modal');
const closeContext = document.getElementById('close-context');
const contextSongTitle = document.getElementById('context-song-title');
const contextSongArtist = document.getElementById('context-song-artist');
const btnPlayNext = document.getElementById('btn-play-next');
const btnAddQueue = document.getElementById('btn-add-queue');

let currentQueue = [];
let currentSongIndex = 0;
let selectedContextSong = null;

// High Quality Full Audio Fetcher
async function fetchSongs(query, limit = 20) {
  try {
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();
    
    if (data.success && data.data.results.length > 0) {
      return data.data.results.map(song => {
        const downloadUrl = song.downloadUrl ? (song.downloadUrl[song.downloadUrl.length - 1]?.url || song.downloadUrl[0]?.url) : '';
        const image = song.image ? (song.image[song.image.length - 1]?.url || song.image[0]?.url) : '';
        
        return {
          title: song.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
          artist: song.primaryArtists || "Unknown Artist",
          album: song.album?.name || "Single",
          cover: image,
          src: downloadUrl,
          year: song.year || ''
        };
      });
    } else {
      return await fallbackiTunesFetch(query, limit);
    }
  } catch (e) {
    return await fallbackiTunesFetch(query, limit);
  }
}

async function fallbackiTunesFetch(query, limit) {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}`);
    const data = await response.json();
    return data.results.map(track => ({
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      cover: track.artworkUrl100.replace('100x100bb', '400x400bb'),
      src: track.previewUrl,
      year: track.releaseDate ? track.releaseDate.substring(0, 4) : ''
    }));
  } catch (err) {
    return [];
  }
}

// 1. Render Cards with 3-Dots Button
function renderCardsList(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  songs.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${song.cover}" alt="Cover">
      <div class="card-more-btn" data-index="${index}"><i class="fas fa-ellipsis-v"></i></div>
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;

    card.onclick = (e) => {
      if (e.target.closest('.card-more-btn')) {
        e.stopPropagation();
        openContextMenu(song);
        return;
      }
      currentQueue = [...songs];
      currentSongIndex = index;
      loadSong(song);
      playSong();
    };
    container.appendChild(card);
  });
}

// Context Menu (3 Dots Popup)
function openContextMenu(song) {
  selectedContextSong = song;
  contextSongTitle.innerText = song.title;
  contextSongArtist.innerText = song.artist;
  contextModal.style.display = 'flex';
}

closeContext.onclick = () => contextModal.style.display = 'none';

btnPlayNext.onclick = () => {
  if (selectedContextSong) {
    currentQueue.splice(currentSongIndex + 1, 0, selectedContextSong);
    contextModal.style.display = 'none';
    renderQueueList();
  }
};

btnAddQueue.onclick = () => {
  if (selectedContextSong) {
    currentQueue.push(selectedContextSong);
    contextModal.style.display = 'none';
    renderQueueList();
  }
};

// Queue Sheet Logic
queueBtn.onclick = () => {
  renderQueueList();
  queueSheet.classList.add('active');
};
closeQueue.onclick = () => queueSheet.classList.remove('active');

function renderQueueList() {
  queueListContainer.innerHTML = '';
  if (currentQueue.length === 0) {
    queueListContainer.innerHTML = '<p style="color:#aaa; text-align:center; padding:20px;">Queue is Empty</p>';
    return;
  }

  currentQueue.forEach((song, idx) => {
    const item = document.createElement('div');
    const isPlaying = idx === currentSongIndex;
    item.style.cssText = `display:flex; align-items:center; justify-content:space-between; padding:10px; margin-bottom:8px; border-radius:10px; background:${isPlaying ? 'rgba(250, 45, 72, 0.2)' : 'rgba(255,255,255,0.05)'};`;
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="${song.cover}" style="width:40px; height:40px; border-radius:6px;">
        <div>
          <h4 style="font-size:0.85rem; color:${isPlaying ? '#fa2d48' : '#fff'};">${song.title}</h4>
          <p style="font-size:0.75rem; color:#aaa;">${song.artist}</p>
        </div>
      </div>
      ${isPlaying ? '<i class="fas fa-wave-square" style="color:#fa2d48;"></i>' : ''}
    `;
    item.onclick = () => {
      currentSongIndex = idx;
      loadSong(song);
      playSong();
    };
    queueListContainer.appendChild(item);
  });
}

// Home Page Load
async function loadHomeContent() {
  const lang = languageSelect.value;
  mainContent.innerHTML = `
    <section class="section">
      <div class="section-header">
        <h2>Latest Releases</h2>
        <button class="see-all-btn" id="see-all-latest">See All <i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="horizontal-scroll" id="latest-releases">Loading...</div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Trending Now</h2>
        <button class="see-all-btn" id="see-all-trending">See All <i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="horizontal-scroll" id="trending-songs">Loading...</div>
    </section>
  `;

  document.getElementById('see-all-latest').onclick = () => loadFullGrid(`${lang} latest hits`, "Latest Releases");
  document.getElementById('see-all-trending').onclick = () => loadFullGrid(`${lang} top trending`, "Trending Songs");

  const latest = await fetchSongs(`${lang} latest hits`, 10);
  const trending = await fetchSongs(`${lang} top trending`, 10);

  renderCardsList('latest-releases', latest);
  renderCardsList('trending-songs', trending);
}

// See All Full Grid View
async function loadFullGrid(query, title) {
  mainContent.innerHTML = `<h2>${title}</h2><div class="grid-layout" id="full-grid">Loading...</div>`;
  const songs = await fetchSongs(query, 40);
  renderCardsList('full-grid', songs);
}

// Search Handler
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(async () => {
      mainContent.innerHTML = `<p>Searching for "${query}"...</p>`;
      const results = await fetchSongs(query, 30);
      mainContent.innerHTML = `<h2>Results for "${query}"</h2><div class="grid-layout" id="search-grid"></div>`;
      renderCardsList('search-grid', results);
    }, 400);
  } else if (query.length === 0) {
    loadHomeContent();
  }
});

// Player Logic & MediaSession
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
  audioElement.play().catch(e => console.log(e));
  playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  miniPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

function pauseSong() {
  audioElement.pause();
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  miniPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function playPrev() {
  if (currentQueue.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + currentQueue.length) % currentQueue.length;
  loadSong(currentQueue[currentSongIndex]);
  playSong();
}

function playNext() {
  if (currentQueue.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % currentQueue.length;
  loadSong(currentQueue[currentQueue.length > currentSongIndex ? currentSongIndex : 0]);
  playSong();
}

function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Apple Music Web Player',
      artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('play', playSong);
    navigator.mediaSession.setActionHandler('pause', pauseSong);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
  }
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Event Listeners
playBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
miniPlayBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
prevBtn.onclick = playPrev;
nextBtn.onclick = playNext;
audioElement.onended = playNext;

homeLogo.onclick = loadHomeContent;

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

audioElement.ontimeupdate = () => {
  if (audioElement.duration) {
    seekBar.value = (audioElement.currentTime / audioElement.duration) * 100;
    currentTimeEl.innerText = formatTime(audioElement.currentTime);
    totalDurationEl.innerText = formatTime(audioElement.duration);
  }
};

seekBar.oninput = () => audioElement.currentTime = (seekBar.value / 100) * audioElement.duration;
volumeBar.oninput = () => audioElement.volume = volumeBar.value;

loadHomeContent();
