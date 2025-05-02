// script.js
document.addEventListener('DOMContentLoaded', () => {
  const container      = document.getElementById('image-slider-container');
  const loading        = document.getElementById('loading-message');
  const errorMsg       = document.getElementById('error-message');
  const prevBtn        = document.getElementById('prev-btn');
  const playPauseBtn   = document.getElementById('play-pause-btn');
  const nextBtn        = document.getElementById('next-btn');
  const audioEl        = document.getElementById('audio-player');
  let   imgs           = [];
  let   current        = 0;
  let   timer          = null;
  let   isPlaying      = false;

  function showError(msg) {
    loading.style.display   = 'none';
    errorMsg.textContent    = msg;
    errorMsg.style.display  = 'block';
    console.error(msg);
  }

  function showNextImage() {
    imgs[current].classList.remove('active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('active');
  }

  function showPrevImage() {
    imgs[current].classList.remove('active');
    current = (current - 1 + imgs.length) % imgs.length;
    imgs[current].classList.add('active');
  }

  function startAutoPlay() {
    if (imgs.length > 1) {
      timer     = setInterval(showNextImage, 5000);
      isPlaying = true;
      playPauseBtn.textContent = 'Pause';
    }
  }

  function stopAutoPlay() {
    clearInterval(timer);
    isPlaying = false;
    playPauseBtn.textContent = 'Play';
  }

  async function startSlider(folderId) {
    const manifestPath = `images/${folderId}/manifest.json`;
    let list;
    try {
      const res  = await fetch(manifestPath);
      if (!res.ok) throw new Error(`Manifest nicht gefunden (${res.status})`);
      const json = await res.json();
      list = Array.isArray(json.images) ? json.images : [];
    } catch (e) {
      return showError(`Fehler beim Laden von manifest.json: ${e.message}`);
    }

    if (list.length === 0) {
      return showError(`Keine Medien in "${folderId}" gefunden.`);
    }

    // ◆ Trenne WAVs von Bildern
    const audioFiles = list.filter(f => f.toLowerCase().endsWith('.wav'));
    if (audioFiles.length) {
      audioEl.src = `images/${folderId}/${encodeURIComponent(audioFiles[0])}`;
      audioEl.style.display = 'block';
    }
    list = list.filter(f => !f.toLowerCase().endsWith('.wav'));

    if (timer) clearInterval(timer);
    container.querySelectorAll('img').forEach(x => x.remove());
    imgs                  = [];
    loading.style.display = 'none';
    errorMsg.style.display= 'none';

    list.forEach(file => {
      const img = document.createElement('img');
      img.src = `images/${folderId}/${encodeURIComponent(file)}`;
      img.alt = `Bild aus ${folderId}`;
      container.appendChild(img);
      imgs.push(img);
    });

    imgs[0].classList.add('active');
    current = 0;

    startAutoPlay();
  }

  prevBtn.addEventListener('click',  () => {
    if (isPlaying) stopAutoPlay();
    showPrevImage();
  });
  nextBtn.addEventListener('click',  () => {
    if (isPlaying) stopAutoPlay();
    showNextImage();
  });
  playPauseBtn.addEventListener('click', () => {
    isPlaying ? stopAutoPlay() : startAutoPlay();
  });

  const params   = new URLSearchParams(window.location.search);
  const folderId = params.get('folderId');
  if (!folderId) {
    showError("Kein ?folderId=… in der URL. Beispiel: ?folderId=beduerfnisse");
  } else {
    startSlider(folderId);
  }
});
