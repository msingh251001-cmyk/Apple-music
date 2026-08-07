const audioElement = document.getElementById('audio-element');

// Elements
const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
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

// Multi-API Punjabi Audio Fetcher
async function fetchSongs(query, limit = 25) {
  // Always append 'punjabi' to guarantee only Punjabi content
  const searchQuery = query.toLowerCase().includes('punjabi') ? query : `punjabi ${query}`;

  try {
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(searchQuery)}&limit=${limit}`);
    const data = await res.json();
    if (data.success && data.data && data.data.results && data.data.results.length > 0) {
      return parseResults(data.data.results);
    }
  } catch (e) {
    console.log("Saavn primary failed, trying backup...");
  }

  // Backup Proxy
  try {
    const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(searchQuery)}&limit=${limit}`)}`);
    const proxyData = await proxyRes.json();
    const parsed = JSON.parse(proxyData.contents);
    if (parsed.success && parsed.data && parsed.data.results) {
      return parseResults(parsed.data.results);
    }
  } catch (err) {
    console.log("Proxy failed...");
  }

  return [];
}

function parseResults(results) {
  return results.map(song => {
    let streamUrl = '';
    if (song.downloadUrl && song.downloadUrl.length > 0) {
      const best = song.downloadUrl.find(d => d.quality === '320kbps') || song.downloadUrl[song.downloadUrl.length - 1];
      streamUrl = best?.url || song.downloadUrl[0]?.url;
    }

    let imgUrl = '';
    if (song.image && song.image.length > 0) {
      const bestImg = song.image.find(i => i.quality === '500x500') || song.image[song.image.length - 1];
      imgUrl = bestImg?.url || song.image[0]?.url;
    }

    return {
      id: song.id,
      title: song.name ? song.name.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : "Unknown Track",
      artist: song.primaryArtists || (song.artists?.primary ? song.artists.primary[0]?.name : "Popular Punjabi Artist"),
      album: song.album?.name || "Punjabi Single",
      cover: imgUrl || "https://picsum.photos/300/300",
      src: streamUrl
    };
  }).filter(s => s.src !== '');
}

// 1. Home Page View
async function loadHomeContent() {
  mainContent.innerHTML = `
    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Punjabi Latest Releases</h2>
        <button id="see-latest" style="background:none; border:none; color:#1db954; cursor:pointer; font-weight:bold;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="latest-releases">Loading Punjabi songs...</div>
    </section>

    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Punjabi Trending Now</h2>
        <button id="see-trending" style="background:none; border:none; color:#1db954; cursor:pointer; font-weight:bold;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="trending-songs">Loading Punjabi songs...</div>
    </section>
  `;

  document.getElementById('see-latest').onclick = () => renderSearchPage(`punjabi latest hits`);
  document.getElementById('see-trending').onclick = () => renderSearchPage(`punjabi top songs`);

  const latest = await fetchSongs(`punjabi latest hits`, 10);
  const trending = await fetchSongs(`punjabi top songs`, 10);

  renderHorizontalCards('latest-releases', latest);
  renderHorizontalCards('trending-songs', trending);
}

function renderHorizontalCards(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (songs.length === 0) {
    container.innerHTML = '<p style="color:#aaa; padding:10px;">Loading Punjabi songs...</p>';
    return;
  }

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

// 2. Search Page Layout
async function renderSearchPage(query, activeCategory = 'Top') {
  mainContent.innerHTML = `
    <div class="filter-chips">
      <button class="chip ${activeCategory === 'Top' ? 'active' : ''}" data-cat="Top">Top</button>
      <button class="chip ${activeCategory === 'Tracks' ? 'active' : ''}" data-cat="Tracks">Tracks</button>
      <button class="chip ${activeCategory === 'Playlists' ? 'active' : ''}" data-cat="Playlists">Playlists</button>
      <button class="chip ${activeCategory === 'Artists' ? 'active' : ''}" data-cat="Artists">Artists</button>
    </div>

    <div id="search-body"><p style="color:#aaa;">Loading Punjabi tracks for "${query}"...</p></div>
  `;

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.onclick = () => {
      const selectedCat = chip.getAttribute('data-cat');
      renderSearchPage(query, selectedCat);
    };
  });

  const activeSearchSongs = await fetchSongs(query, 30);
  const searchBody = document.getElementById('search-body');
  if (!searchBody) return;

  if (activeSearchSongs.length === 0) {
    searchBody.innerHTML = '<p style="color:#aaa; padding:20px 0;">No Punjabi tracks found. Try searching another artist like "Arjan Dhillon" or "Karan Aujla".</p>';
    return;
  }

  if (activeCategory === 'Top') {
    const topResult = activeSearchSongs[0];
    searchBody.innerHTML = `
      <h3 style="margin-bottom:12px; font-size:1.1rem;">Top result</h3>
      <div class="top-result-card" id="top-card">
        <div>
          <h3>${topResult.artist}</h3>
          <p>Punjabi Artist</p>
        </div>
        <div class="play-green-circle"><i class="fas fa-play"></i></div>
      </div>

      <h3 style="margin-bottom:12px; font-size:1.1rem;">Tracks</h3>
      <div id="search-tracks-list"></div>
    `;

    document.getElementById('top-card').onclick = () => renderArtistProfile(topResult.artist, activeSearchSongs);
    renderTracksList('search-tracks-list', activeSearchSongs);

  } else if (activeCategory === 'Tracks') {
    searchBody.innerHTML = `<h3 style="margin-bottom:12px; font-size:1.1rem;">All Punjabi Tracks</h3><div id="search-tracks-list"></div>`;
    renderTracksList('search-tracks-list', activeSearchSongs);

  } else if (activeCategory === 'Artists') {
    renderArtistProfile(activeSearchSongs[0].artist, activeSearchSongs);

  } else {
    searchBody.innerHTML = `<h3 style="margin-bottom:12px; font-size:1.1rem;">Punjabi Playlists</h3><div class="horizontal-scroll" id="playlist-cards"></div>`;
    renderHorizontalCards('playlist-cards', activeSearchSongs);
  }
}

function renderTracksList(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  songs.forEach((song, idx) => {
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
      <i class="fas fa-ellipsis-v three-dots-btn" style="padding:12px; color:#aaa;"></i>
    `;

    row.onclick = (e) => {
      if (e.target.classList.contains('three-dots-btn')) {
        e.stopPropagation();
        openContextMenu(song);
        return;
      }
      playFromList(songs, idx);
    };
    container.appendChild(row);
  });
}

// 3. Artist Profile
function renderArtistProfile(artistName, songs) {
  const topTracks = songs.slice(0, 5);
  const albumsMap = {};
  songs.forEach(s => {
    if (!albumsMap[s.album]) albumsMap[s.album] = s;
  });

  const heroImage = songs[0]?.cover || "https://picsum.photos/600/400";

  mainContent.innerHTML = `
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

    <h3 style="margin-bottom:12px; font-size:1.2rem;">Popular</h3>
    <div id="artist-popular-list"></div>
    <button class="see-all-outline" id="see-all-popular">See all</button>

    <h3 style="margin:20px 0 12px 0; font-size:1.2rem;">Albums</h3>
    <div class="albums-grid" id="artist-albums-grid"></div>
  `;

  document.getElementById('artist-shuffle-play').onclick = () => playFromList(songs, 0);

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
      <i class="fas fa-ellipsis-v three-dots-btn" style="padding:12px; color:#aaa;"></i>
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

  document.getElementById('see-all-popular').onclick = () => renderSearchPage(artistName, 'Tracks');
}

// 4. Player Control & Queue
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

function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || 'Punjabi Music',
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

// Listeners
playBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
miniPlayBtn.onclick = () => audioElement.paused ? playSong() : pauseSong();
prevBtn.onclick = playPrev;
nextBtn.onclick = playNext;
audioElement.onended = playNext;

homeLogo.onclick = loadHomeContent;

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

loadHomeContent();
