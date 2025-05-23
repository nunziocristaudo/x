const gallery = document.getElementById('gallery');
const tileSize = 150;
const bufferTiles = 2;
const baseURL = 'https://dev.tinysquares.io/';
const workerURL = 'https://quiet-mouse-8001.flaxen-huskier-06.workers.dev/';

let tiles = new Map();
let availableFiles = [];
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let velocityX = 0;
let velocityY = 0;
let lastMove = 0;
let currentIndex = 0;

async function fetchTileList() {
  try {
    const res = await fetch(workerURL);
    const list = await res.json();
    availableFiles = list.map(item => (typeof item === 'string' ? { url: item } : item));
  } catch (e) {
    console.error('Failed to load tiles:', e);
    availableFiles = [];
  }
}

function createTile(file, index, x, y) {
  const tile = document.createElement('div');
  tile.className = 'post';
  tile.dataset.index = index;
  tile.style.position = 'absolute';
  tile.style.left = `${x * tileSize}px`;
  tile.style.top = `${y * tileSize}px`;

  const frame = document.createElement('div');
  frame.className = 'frame';

  const ext = file.url.split('.').pop();
  const media = document.createElement(ext === 'mp4' ? 'video' : 'img');
  media.src = baseURL + file.url;
  if (ext === 'mp4') {
    media.muted = true;
    media.loop = true;
    media.autoplay = true;
  }

  frame.appendChild(media);
  tile.appendChild(frame);
  tile.addEventListener('click', () => showLightbox(index));

  gallery.appendChild(tile);
  tiles.set(`${x},${y}`, tile);
}

function renderInfiniteGrid() {
  const cols = Math.ceil(window.innerWidth / tileSize) + bufferTiles * 2;
  const rows = Math.ceil(window.innerHeight / tileSize) + bufferTiles * 2;

  const startX = Math.floor(cameraX / tileSize) - bufferTiles;
  const startY = Math.floor(cameraY / tileSize) - bufferTiles;

  for (let y = startY; y < startY + rows; y++) {
    for (let x = startX; x < startX + cols; x++) {
      const key = `${x},${y}`;
      if (!tiles.has(key)) {
        const index = ((y * 1000 + x) % availableFiles.length + availableFiles.length) % availableFiles.length;
        createTile(availableFiles[index], index, x, y);
      }
    }
  }
}

function createLightbox() {
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.classList.add('hidden');
  lb.innerHTML = `
    <div class="lightbox-content">
            <div id="mediaContainer"></div>
    </div>
  `;
  document.body.appendChild(lb);

  lb.onclick = () => {
    lb.classList.add('fade-out');
    setTimeout(() => {
      lb.classList.remove('fade-out');
      lb.classList.add('hidden');
    }, 300);
  };
  lb.addEventListener('touchstart', handleTouchStart, false);
  lb.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('keydown', handleArrowKey);
}

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
  if (keyMap[e.key]) showNeighbor(keyMap[e.key]);
}

function showNeighbor(direction) {
  const cols = Math.floor(window.innerWidth / tileSize);
  let nextIndex = currentIndex;
  if (direction === 'left') nextIndex--;
  else if (direction === 'right') nextIndex++;
  else if (direction === 'up') nextIndex -= cols;
  else if (direction === 'down') nextIndex += cols;
  if (nextIndex >= 0 && nextIndex < availableFiles.length) {
    currentIndex = nextIndex;
    showLightbox(currentIndex);
  }
}

function showLightbox(index) {
  const lb = document.getElementById('lightbox');
  const media = availableFiles[index];
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

function animate() {
  requestAnimationFrame(animate);
  cameraX += velocityX;
  cameraY += velocityY;
  velocityX *= 0.95;
  velocityY *= 0.95;
  gallery.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
  renderInfiniteGrid();
}

gallery.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX - cameraX;
  dragStartY = e.clientY - cameraY;
});

gallery.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cameraX = e.clientX - dragStartX;
    cameraY = e.clientY - dragStartY;
  }
});

gallery.addEventListener('mouseup', () => {
  isDragging = false;
});

gallery.addEventListener('mouseleave', () => {
  isDragging = false;
});

document.addEventListener('DOMContentLoaded', async () => {
  await fetchTileList();
  createLightbox();
  animate();

  let lastTouchX = 0;
  let lastTouchY = 0;

  gallery.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  });

  gallery.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - lastTouchX;
      const deltaY = touchY - lastTouchY;
      cameraX -= deltaX;
      cameraY -= deltaY;
      lastTouchX = touchX;
      lastTouchY = touchY;
    }
  });

  gallery.addEventListener('touchend', () => {
    isDragging = false;
  });

  gallery.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraX += e.deltaX;
    cameraY += e.deltaY;
  }, { passive: false });
});
  createLightbox();
  animate();
});
