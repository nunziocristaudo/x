// Simple gallery loader
const PLACEHOLDER = 'preview.jpg';
const BASE_URL = 'https://tinysquares.io/';

document.addEventListener('DOMContentLoaded', () => {
  fetch('tiles.json')
    .then(r => r.json())
    .then(data => {
      const gallery = document.getElementById('gallery');
      data.slice(0, 50).forEach(item => {
        const img = document.createElement('img');
        img.src = BASE_URL + item.url;
        img.alt = '';
        img.onerror = () => { img.src = PLACEHOLDER; };
        gallery.appendChild(img);
      });
    })
    .catch(err => {
      console.error('Failed to load images', err);
      const gallery = document.getElementById('gallery');
      for (let i = 0; i < 12; i++) {
        const img = document.createElement('img');
        img.src = PLACEHOLDER;
        gallery.appendChild(img);
      }
    });
});
