const audioElement = document.getElementById('audio-element');

// Elements
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

// Reliable Direct Full-Length Audio Engine (JioSaavn CDN API)
async function fetchSongs(query, limit = 20) {
  try {
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();
    
    if (data.success && data.data && data.data.results && data.data.results.length > 0) {
      return data.data.results.map(song => {
        let streamUrl = '';
        if (song.downloadUrl && song.downloadUrl.length > 0) {
          // Select highest 320kbps / 160kbps audio link
          const bestQuality = song.downloadUrl.find(d => d.quality === '320kbps') || song.downloadUrl[song.downloadUrl.length - 1];
          streamUrl = bestQuality?.url || song.downloadUrl[0]?.url;
        }

        let imgUrl = '';
        if (song.image && song.image.length > 0) {
          const bestImg = song.image.find(i => i.quality === '500x500') || song.image[song.image.length - 1];
          imgUrl = bestImg?.url || song.image[0]?.url;
        }

        return {
          id: song.id,
          title: song.name ? song.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : "Unknown Track",
          artist: song.primaryArtists || song.artists?.primary[0]?.name || "Popular Artist",
          album: song.album?.name || "Single",
          cover: imgUrl || "https://picsum.photos/300/300",
          src: streamUrl
        };
      }).filter(s => s.src && s.src.endsWith('.mp3') || s.src.includes('cdn'));
    }
  } catch (e) {
    console.error("Fetch Error:", e);
  }
  return [];
}

// 1. Home Page View
async function loadHomeContent() {
  const lang = languageSelect.value;
  mainContent.innerHTML = `
    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Latest Releases</h2>
        <button id="see-latest" style="background:none; border:none; color:#1db954; cursor:pointer;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="latest-releases">Loading full tracks...</div>
    </section>

    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Trending Now</h2>
        <button id="see-trending" style="background:none; border:none; color:#1db954; cursor:pointer;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="trending-songs">Loading full tracks...</div>
    </section>
  `;

  document.getElementById('see-latest').onclick = () => renderSearchPage(`${lang} latest hits`);
  document.getElementById('see-trending').onclick = () => renderSearchPage(`${lang} top songs`);

  const latest = await fetchSongs(`${lang} latest hits`, 10);
  const trending = await fetchSongs(`${lang} top songs`, 10);

  renderHorizontalCards('latest-releases', latest);
  renderHorizontalCards('trending-songs', trending);
}

function renderHorizontalCards(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  songs.forEach((song, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${song.cover}">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    card.onclick = () => playFromList(songs, idx);
    container.appendChild(card);
  });
}

// 2. Spotify Search View (Image 3)
async function renderSearchPage(query) {
  mainContent.innerHTML = `
    <!-- Category Chips (Image 3) -->
    <div class="filter-chips">
      <button class="chip active">Top</button>
      <button class="chip">Tracks</button>
      <button class="chip">Playlists</button>
      <button class="chip">Artists</button>
    </div>

    <div id="search-body">Loading...</div>
  `;

  const results = await fetchSongs(query, 25);
  const searchBody = document.getElementById('search-body');
  if (!searchBody) return;

  if (results.length === 0) {
    searchBody.innerHTML = '<p style="color:#aaa;">No tracks found.</p>';
    return;
  }

  const topResult = results[0];

  searchBody.innerHTML = `
    <h3 style="margin-bottom:12px; font-size:1.1rem;">Top result</h3>
    <div class="top-result-card" id="top-card">
      <div>
        <h3>${topResult.artist}</h3>
        <p>Artist</p>
      </div>
      <div class="play-green-circle"><i class="fas fa-play"></i></div>
    </div>

    <h3 style="margin-bottom:12px; font-size:1.1rem;">Tracks</h3>
    <div id="search-tracks-list"></div>
  `;

  // Click on Top Result opens Artist Profile
  document.getElementById('top-card').onclick = () => renderArtistProfile(topResult.artist, results);

  // Render Tracks List
  const tracksListContainer = document.getElementById('search-tracks-list');
  results.forEach((song, idx) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <div class="track-info">
        <img src="${song.cover}">
        <div class="track-text">
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>
      </div>
      <i class="fas fa-ellipsis-v three-dots-btn" style="padding:10px; color:#aaa;"></i>
    `;

    row.onclick = (e) => {
      if (e.target.classList.contains('three-dots-btn')) {
        e.stopPropagation();
        openContextMenu(song);
        return;
      }
      playFromList(results, idx);
    };
    tracksListContainer.appendChild(row);
  });
}

// 3. Spotify Artist Profile View (Image 1 & 2)
function renderArtistProfile(artistName, songs) {
  const topTracks = songs.slice(0, 5);
  
  // Grouping albums
  const albumsMap = {};
  songs.forEach(s => {
    if (!albumsMap[s.album]) albumsMap[s.album] = s;
  });

  const heroImage = songs[0]?.cover || "https://picsum.photos/600/400";

  mainContent.innerHTML = `
    <!-- Hero Banner (Image 1) -->
    <div class="artist-hero" style="background-image: url('${heroImage}');">
      <div class="artist-hero-overlay"></div>
      <div class="artist-hero-content">
        <h1>${artistName}</h1>
        <div class="artist-actions">
          <button class="follow-btn">Follow</button>
          <i class="fas fa-ellipsis-v" style="font-size:1.2rem; color:#aaa;"></i>
          <div class="play-green-circle" id="artist-shuffle-play" style="margin-left:auto;"><i class="fas fa-play"></i></div>
        </div>
      </div>
    </div>

    <!-- Popular Section -->
    <h3 style="margin-bottom:12px; font-size:1.2rem;">Popular</h3>
    <div id="artist-popular-list"></div>
    <button class="see-all-outline" id="see-all-popular">See all</button>

    <!-- Albums Section (Image 2) -->
    <h3 style="margin:20px 0 12px 0; font-size:1.2rem;">Albums</h3>
    <div class="albums-grid" id="artist-albums-grid"></div>
  `;

  document.getElementById('artist-shuffle-play').onclick = () => playFromList(songs, 0);

  // Render Popular 5 Tracks
  const popularContainer = document.getElementById('artist-popular-list');
  topTracks.forEach((song, idx) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <div class="track-info">
        <img src="${song.cover}">
        <div class="track-text">
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>
      </div>
      <i class="fas fa-ellipsis-v three-dots-btn" style="padding:10px; color:#aaa;"></i>
    `;
    row.onclick = (e) => {
      if (e.target.classList.contains('three-dots-btn')) {
        e.stopPropagation();
        openContextMenu(song);
        return;
      }
      playFromList(topTracks, idx);
    };
    popularContainer.appendChild(row);
  });

  // Render Albums Grid
  const albumGrid = document.getElementById('artist-albums-grid');
  Object.values(albumsMap).forEach(alb => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.innerHTML = `
      <div class="album-card-img-wrapper">
        <img src="${alb.cover}">
        <div class="album-play-icon"><i class="fas fa-play" style="font-size:0.8rem;"></i></div>
      </div>
      <h4>${alb.album}</h4>
      <p>${alb.artist}</p>
    `;
    card.onclick = () => playFromList(songs.filter(s => s.album === alb.album), 0);
    albumGrid.appendChild(card);
  });

  document.getElementById('see-all-popular').onclick = () => renderSearchPage(artistName);
}

// 4. Play Control & Queue Management
function playFromList(list, index) {
  currentQueue = [...list];
  currentSongIndex = index;
  loadSong(currentQueue[currentSongIndex]);
  playSong();
}

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
  loadSong(currentQueue[currentSongIndex]);
  playSong();
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
  }
};

btnAddQueue.onclick = () => {
  if (selectedContextSong) {
    currentQueue.push(selectedContextSong);
    contextModal.style.display = 'none';
  }
};

// Search Bar Realtime Trigger
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchTimeout = setTimeout(() => renderSearchPage(query), 400);
  } else if (query.length === 0) {
    loadHomeContent();
  }
});

// Background Lock Screen Session
function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Spotify Music',
      artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('play', playSong);
    navigator.mediaSession.setActionHandler('pause', pauseSong);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
  }
}

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
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
    item.className = 'track-row';
    item.style.background = isPlaying ? 'rgba(29, 185, 84, 0.15)' : 'rgba(255,255,255,0.03)';
    item.innerHTML = `
      <div class="track-info">
        <img src="${song.cover}">
        <div class="track-text">
          <h4 style="color:${isPlaying ? '#1db954' : '#fff'}">${song.title}</h4>
          <p>${song.artist}</p>
        </div>
      </div>
      ${isPlaying ? '<i class="fas fa-volume-high" style="color:#1db954;"></i>' : ''}
    `;
    item.onclick = () => {
      currentSongIndex = idx;
      loadSong(song);
      playSong();
    };
    queueListContainer.appendChild(item);
  });
}

audioElement.ontimeupdate = () => {
  if (audioElement.duration) {
    seekBar.value = (audioElement.currentTime / audioElement.duration) * 100;
    currentTimeEl.innerText = formatTime(audioElement.currentTime);
    totalDurationEl.innerText = formatTime(audioElement.duration);
  }
};

seekBar.oninput = () => audioElement.currentTime = (seekBar.value / 100) * audioElement.duration;
volumeBar.oninput = () => audioElement.volume = volumeBar.value;

// App Load
loadHomeContent();
