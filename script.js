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

// Fixed Reliable Punjabi Songs Collection (Guaranteed High Speed)
const PUNJABI_DATABASE = [
  {
    id: "1",
    title: "One Call Away",
    artist: "Arjan Dhillon",
    album: "Enigma",
    cover: "https://i.scdn.co/image/ab67616d0000b273b5c464e8fa48c3b53c155d8f",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "2",
    title: "Culture",
    artist: "Arjan Dhillon",
    album: "Enigma",
    cover: "https://i.scdn.co/image/ab67616d0000b273b5c464e8fa48c3b53c155d8f",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "3",
    title: "Counting Gems",
    artist: "Arjan Dhillon",
    album: "Enigma",
    cover: "https://i.scdn.co/image/ab67616d0000b273b5c464e8fa48c3b53c155d8f",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "4",
    title: "Greatest",
    artist: "Arjan Dhillon",
    album: "Patandar",
    cover: "https://i.scdn.co/image/ab67616d0000b273f55e08b1f59ef8b0f37d3839",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "5",
    title: "Softly",
    artist: "Karan Aujla",
    album: "Making Memories",
    cover: "https://i.scdn.co/image/ab67616d0000b273e803d368d37e3d1621532f11",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  },
  {
    id: "6",
    title: "Winning Speech",
    artist: "Karan Aujla",
    album: "Single",
    cover: "https://i.scdn.co/image/ab67616d0000b2732959648a73a388fae1fa4292",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
  },
  {
    id: "7",
    title: "GOAT",
    artist: "Diljit Dosanjh",
    album: "GOAT",
    cover: "https://i.scdn.co/image/ab67616d0000b273e34b92b0c1692df89ee606cf",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
  },
  {
    id: "8",
    title: "Lover",
    artist: "Diljit Dosanjh",
    album: "MoonChild Era",
    cover: "https://i.scdn.co/image/ab67616d0000b27339d22d2ff36d2e684eb8db7d",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
  }
];

// High Speed Combined Fetcher (Online API + Fallback Built-in)
async function fetchSongs(query) {
  if (!query || query.trim() === '') return PUNJABI_DATABASE;

  const q = query.toLowerCase();
  
  // Instant Search from Local Database First
  const filtered = PUNJABI_DATABASE.filter(s => 
    s.title.toLowerCase().includes(q) || 
    s.artist.toLowerCase().includes(q) || 
    s.album.toLowerCase().includes(q)
  );

  if (filtered.length > 0) return filtered;

  // Online Backup (iTunes Fast Server)
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query + ' punjabi')}&media=music&limit=20`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.map(t => ({
        id: t.trackId,
        title: t.trackName,
        artist: t.artistName,
        album: t.collectionName || "Punjabi Track",
        cover: t.artworkUrl100.replace('100x100bb', '500x500bb'),
        src: t.previewUrl
      }));
    }
  } catch (e) {
    console.log("Online backup quiet fail, showing database.");
  }

  return PUNJABI_DATABASE;
}

// 1. Home Page View
async function loadHomeContent() {
  mainContent.innerHTML = `
    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Punjabi Latest Releases</h2>
        <button id="see-latest" style="background:none; border:none; color:#1db954; cursor:pointer; font-weight:bold;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="latest-releases"></div>
    </section>

    <section style="margin-bottom:25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Punjabi Trending Now</h2>
        <button id="see-trending" style="background:none; border:none; color:#1db954; cursor:pointer; font-weight:bold;">See All ></button>
      </div>
      <div class="horizontal-scroll" id="trending-songs"></div>
    </section>
  `;

  document.getElementById('see-latest').onclick = () => renderSearchPage('Arjan Dhillon');
  document.getElementById('see-trending').onclick = () => renderSearchPage('Karan Aujla');

  renderHorizontalCards('latest-releases', PUNJABI_DATABASE.slice(0, 4));
  renderHorizontalCards('trending-songs', PUNJABI_DATABASE.slice(4, 8));
}

function renderHorizontalCards(containerId, songs) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  songs.forEach((song, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${song.cover}" onerror="this.src='https://via.placeholder.com/150';">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    card.onclick = () => playFromList(songs, idx);
    container.appendChild(card);
  });
}

// 2. Spotify Search View
async function renderSearchPage(query, activeCategory = 'Top') {
  mainContent.innerHTML = `
    <div class="filter-chips">
      <button class="chip ${activeCategory === 'Top' ? 'active' : ''}" data-cat="Top">Top</button>
      <button class="chip ${activeCategory === 'Tracks' ? 'active' : ''}" data-cat="Tracks">Tracks</button>
      <button class="chip ${activeCategory === 'Playlists' ? 'active' : ''}" data-cat="Playlists">Playlists</button>
      <button class="chip ${activeCategory === 'Artists' ? 'active' : ''}" data-cat="Artists">Artists</button>
    </div>

    <div id="search-body"></div>
  `;

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.onclick = () => {
      const selectedCat = chip.getAttribute('data-cat');
      renderSearchPage(query, selectedCat);
    };
  });

  const activeSearchSongs = await fetchSongs(query);
  const searchBody = document.getElementById('search-body');
  if (!searchBody) return;

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
    searchBody.innerHTML = `<h3 style="margin-bottom:12px; font-size:1.1rem;">All Tracks</h3><div id="search-tracks-list"></div>`;
    renderTracksList('search-tracks-list', activeSearchSongs);

  } else if (activeCategory === 'Artists') {
    renderArtistProfile(activeSearchSongs[0].artist, activeSearchSongs);

  } else {
    searchBody.innerHTML = `<h3 style="margin-bottom:12px; font-size:1.1rem;">Playlists</h3><div class="horizontal-scroll" id="playlist-cards"></div>`;
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
        <img src="${song.cover}" onerror="this.src='https://via.placeholder.com/50';">
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

// 3. Spotify Style Artist Hero & Albums Layout
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

    <h3 style="margin-bottom:12px; font-size:1.2rem;">Popular Tracks</h3>
    <div id="artist-popular-list"></div>

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
        <img src="${song.cover}" onerror="this.src='https://via.placeholder.com/50';">
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
  if (query.length > 1) {
    searchTimeout = setTimeout(() => renderSearchPage(query), 300);
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

// Event Listeners
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

// Direct Instant Load
loadHomeContent();
