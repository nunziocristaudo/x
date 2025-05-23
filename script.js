const gallery = document.getElementById('gallery');
const tileSize = 150;
const bufferTiles = 1;
let tiles = new Map();

const baseURL = 'https://dev.tinysquares.io/';
const workerURL = 'https://quiet-mouse-8001.flaxen-huskier-06.workers.dev/';

let cameraX = 0;
let cameraY = 0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let velocityX = 0;
let velocityY = 0;

let lastMove = 0;

async function loadAvailableFiles() {
  const workerURL = 'https://quiet-mouse-8001.flaxen-huskier-06.workers.dev/';
  const localTilesURL = 'tiles.json';

  try {
    const [remoteRes, localRes] = await Promise.all([
      fetch(workerURL).then(res => res.json()).catch(() => []),
      fetch(localTilesURL).then(res => res.json()).catch(() => [])
    ]);

    const normalize = (item) =>
      typeof item === 'string' ? { url: item } : item;

    const remoteFiles = remoteRes.map(normalize);
    const localFiles = localRes.map(normalize);

    window.availableFiles = [...remoteFiles, ...localFiles];
  } catch (err) {
    console.error('Failed to load files', err);
    window.availableFiles = [];
  }
}

function createLightbox() {
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.classList.add('hidden');
  lb.innerHTML = `
    <div class="lightbox-content">
      <button id="closeBtn">×</button>
      <div id="mediaContainer"></div>
    </div>
  `;
  document.body.appendChild(lb);

  document.getElementById('closeBtn').onclick = () => lb.classList.add('hidden');

  lb.addEventListener('touchstart', handleTouchStart, false);
  lb.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('keydown', handleArrowKey);
}

let currentIndex = 0;
let xDown = null;
let yDown = null;

function handleTouchStart(evt) {
  const firstTouch = evt.touches[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
}

function handleTouchMove(evt) {
  if (!xDown || !yDown) return;

  const xUp = evt.touches[0].clientX;
  const yUp = evt.touches[0].clientY;

  const xDiff = xDown - xUp;
  const yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) showNeighbor('right'); else showNeighbor('left');
  } else {
    if (yDiff > 0) showNeighbor('down'); else showNeighbor('up');
  }

  xDown = null;
  yDown = null;
}

function handleArrowKey(e) {
  const keyMap = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down'
  };
  if (keyMap[e.key]) {
    showNeighbor(keyMap[e.key]);
  }
}

function showNeighbor(direction) {
  const cols = Math.floor(window.innerWidth / tileSize);
  let nextIndex = currentIndex;
  if (direction === 'left') nextIndex--;
  else if (direction === 'right') nextIndex++;
  else if (direction === 'up') nextIndex -= cols;
  else if (direction === 'down') nextIndex += cols;

  if (nextIndex >= 0 && nextIndex < window.availableFiles.length) {
    currentIndex = nextIndex;
    showLightbox(currentIndex);
  }
}

function showLightbox(index) {
  const lb = document.getElementById('lightbox');
  const media = window.availableFiles[index];
  currentIndex = index;
  const ext = media.url.split('.').pop();
  const el = document.createElement(ext === 'mp4' ? 'video' : 'img');
  el.src = baseURL + media.url;
  if (ext === 'mp4') {
    el.controls = true;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
  }
  const container = document.getElementById('mediaContainer');
  container.innerHTML = '';
  container.appendChild(el);
  lb.classList.remove('hidden');
}

function initTileClickHandlers() {
  gallery.addEventListener('click', (e) => {
    const post = e.target.closest('.post');
    if (!post) return;
    const index = parseInt(post.dataset.index, 10);
    if (!isNaN(index)) {
      showLightbox(index);
    }
  });
}

loadAvailableFiles().then(() => {
  createLightbox();
  initTileClickHandlers();
  // continue initializing grid...
});
