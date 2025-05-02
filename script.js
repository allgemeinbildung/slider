// script.js
document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  const DEFAULT_INTERVAL_MS = 15000; // Default autoplay interval in milliseconds
  const URL_PARAM_FOLDER_ID = 'folderId';
  const URL_PARAM_INTERVAL  = 'interval'; // New URL param for interval

  // --- DOM Elements ---
  const container      = document.getElementById('image-slider-container');
  const loading        = document.getElementById('loading-message');
  const errorMsg       = document.getElementById('error-message');
  const prevBtn        = document.getElementById('prev-btn');
  const playPauseBtn   = document.getElementById('play-pause-btn');
  const nextBtn        = document.getElementById('next-btn');
  const audioEl        = document.getElementById('audio-player');
  const podcastTitleEl = document.getElementById('podcast-title'); // New element
  const slideIndicator = document.getElementById('slide-indicator'); // New element

  // --- State Variables ---
  let imgs             = [];
  let current          = 0;
  let timer            = null;
  let isPlaying        = false;
  let currentInterval  = DEFAULT_INTERVAL_MS; // Will be updated from URL param

  // --- Helper Functions ---
  function showError(msg) {
    loading.style.display   = 'none';
    errorMsg.textContent    = msg;
    errorMsg.style.display  = 'block';
    podcastTitleEl.style.display = 'none';
    audioEl.style.display = 'none';
    slideIndicator.style.display = 'none';
    console.error(msg);
  }

  // NEW: Update slide indicator text
  function updateSlideIndicator() {
    if (imgs.length > 0) {
      slideIndicator.textContent = `${current + 1} / ${imgs.length}`;
      slideIndicator.style.display = 'block';
    } else {
      slideIndicator.style.display = 'none';
    }
  }

  function showNextImage() {
    if (imgs.length <= 1) return; // No change if 0 or 1 image
    imgs[current].classList.remove('active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('active');
    updateSlideIndicator(); // Update indicator
  }

  function showPrevImage() {
    if (imgs.length <= 1) return; // No change if 0 or 1 image
    imgs[current].classList.remove('active');
    current = (current - 1 + imgs.length) % imgs.length;
    imgs[current].classList.add('active');
    updateSlideIndicator(); // Update indicator
  }

  function startAutoPlay() {
    // Prevent starting if already playing or only one image
    if (isPlaying || imgs.length <= 1) return;
    // Clear any residual timer just in case
    clearInterval(timer);
    // Start the timer with the configured interval
    timer = setInterval(showNextImage, currentInterval);
    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
  }

  function stopAutoPlay() {
    clearInterval(timer);
    timer = null; // Explicitly clear timer reference
    isPlaying = false;
    // Only show 'Play' if there are multiple images to play through
    if (imgs.length > 1) {
        playPauseBtn.textContent = 'Play';
    } else {
        playPauseBtn.textContent = 'Pause'; // Or maybe disable it?
        playPauseBtn.disabled = true; // Disable if only 1 image
    }
  }

  // Resets the autoplay timer if it's currently running
  function resetAutoPlayTimer() {
    if (isPlaying) {
        clearInterval(timer);
        timer = setInterval(showNextImage, currentInterval);
    }
  }

  async function startSlider(folderId) {
    const manifestPath = `images/${folderId}/manifest.json`;
    let list;
    try {
      const res  = await fetch(manifestPath);
      if (!res.ok) throw new Error(`Manifest nicht gefunden (${res.status})`);
      const json = await res.json();
      // Assuming manifest structure { "images": ["file1.png", "audio.wav", ...] }
      list = Array.isArray(json.images) ? json.images : [];
    } catch (e) {
      return showError(`Fehler beim Laden von manifest.json: ${e.message}`);
    }

    if (list.length === 0) {
      return showError(`Keine Medien in "${folderId}" gefunden.`);
    }

    // ◆ Handle Audio and Title
    const audioFiles = list.filter(f => f.toLowerCase().endsWith('.wav'));
    audioEl.style.display = 'none'; // Hide by default
    podcastTitleEl.style.display = 'none'; // Hide by default
    podcastTitleEl.textContent = '';

    if (audioFiles.length > 0) {
      const audioFilename = audioFiles[0]; // Use the first WAV found
      audioEl.src = `images/${folderId}/${encodeURIComponent(audioFilename)}`;
      audioEl.style.display = 'block'; // Show audio player

      // Set podcast title (remove extension)
      let title = audioFilename.replace(/\.wav$/i, ''); // Remove .wav (case-insensitive)
      podcastTitleEl.textContent = title.replace(/_/g, ' '); // Replace underscores with spaces for readability
      podcastTitleEl.style.display = 'block'; // Show title
    }
    // Filter out audio files for the image list
    list = list.filter(f => !f.toLowerCase().endsWith('.wav'));

    // Clear previous state
    if (timer) clearInterval(timer);
    container.querySelectorAll('img').forEach(x => x.remove()); // Clear old images
    imgs                  = []; // Reset image array
    loading.style.display = 'none';
    errorMsg.style.display= 'none';
    slideIndicator.style.display = 'none'; // Hide indicator initially

    // Check if there are any images left to display
    if (list.length === 0) {
        // If only audio was present, show a message or just the audio player
        container.innerHTML = '<div style="color: #ccc; text-align: center; padding-top: 40%;">Nur Audio vorhanden.</div>'; // Example message
        playPauseBtn.disabled = true; // Disable controls if no images
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return; // Stop slider setup
    }


    // ◆ Populate Images
    list.forEach(file => {
      const img = document.createElement('img');
      img.src = `images/${folderId}/${encodeURIComponent(file)}`;
      img.alt = `Bild ${imgs.length + 1} aus ${folderId}`; // Slightly better alt text
      container.appendChild(img);
      imgs.push(img);
    });

    // ◆ Initialize Slider
    current = 0;
    if (imgs.length > 0) {
      imgs[0].classList.add('active');
    }
    updateSlideIndicator(); // Show initial indicator count

    // Enable/Disable buttons based on image count
    const hasMultipleImages = imgs.length > 1;
    playPauseBtn.disabled = !hasMultipleImages;
    prevBtn.disabled = !hasMultipleImages;
    nextBtn.disabled = !hasMultipleImages;


    if (hasMultipleImages) {
        startAutoPlay(); // Start autoplay only if multiple images
    } else {
        stopAutoPlay(); // Ensure it's stopped and button is 'Play'/disabled if only one image
    }
  }

  // --- Event Listeners ---
  prevBtn.addEventListener('click',  () => {
    showPrevImage();
    resetAutoPlayTimer(); // Reset timer after manual navigation if playing
  });

  nextBtn.addEventListener('click',  () => {
    showNextImage();
    resetAutoPlayTimer(); // Reset timer after manual navigation if playing
  });

  playPauseBtn.addEventListener('click', () => {
    if (imgs.length <= 1) return; // Do nothing if only one image
    isPlaying ? stopAutoPlay() : startAutoPlay();
  });

  // --- Initialization ---
  const params   = new URLSearchParams(window.location.search);
  const folderId = params.get(URL_PARAM_FOLDER_ID);

  // Get interval from URL or use default
  const intervalParam = params.get(URL_PARAM_INTERVAL);
  if (intervalParam) {
    const parsedInterval = parseInt(intervalParam, 10);
    // Use param if it's a positive number, otherwise keep default
    if (!isNaN(parsedInterval) && parsedInterval > 0) {
      // Assuming the param is in seconds for user-friendliness, convert to ms
      currentInterval = parsedInterval * 1000;
      console.log(`Using custom interval: ${parsedInterval} seconds`);
    } else {
        console.warn(`Invalid interval parameter "${intervalParam}". Using default: ${DEFAULT_INTERVAL_MS / 1000} seconds.`);
        currentInterval = DEFAULT_INTERVAL_MS;
    }
  } else {
    currentInterval = DEFAULT_INTERVAL_MS;
  }


  if (!folderId) {
    showError(`Kein ?${URL_PARAM_FOLDER_ID}=… in der URL. Beispiel: ?${URL_PARAM_FOLDER_ID}=beduerfnisse`);
  } else {
    startSlider(folderId);
  }
});
