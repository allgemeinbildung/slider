document.addEventListener('DOMContentLoaded', () => {
  const sliderContainer = document.getElementById('image-slider-container');
  const loadingMessage = document.getElementById('loading-message');
  const errorMessage   = document.getElementById('error-message');
  let  currentImageIndex = 0;
  let  imageElements = [];
  let  intervalId    = null;

  function displayError(msg) {
    loadingMessage.style.display = 'none';
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
    console.error(msg);
  }

  async function startSlider(folderId) {
    const apiUrl = `https://api.github.com/repos/allgemeinbildung/slider`
                 + `/contents/images/${folderId}?ref=main`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`GitHub-API-Error ${res.status}`);
      const items = await res.json();
      // Nur Dateien mit Bild-Extensions:
      const imageUrls = items
        .filter(item => item.type === 'file'
                     && /\.(jpe?g|png|gif)$/i.test(item.name))
        .map(item => `https://raw.githubusercontent.com`
                    + `/allgemeinbildung/slider/main`
                    + `/images/${folderId}/${encodeURIComponent(item.name)}`);

      if (imageUrls.length === 0) {
        displayError(`Keine Bilder im Ordner '${folderId}' gefunden.`);
        return;
      }

      // Alte Instanz aufräumen
      if (intervalId) clearInterval(intervalId);
      sliderContainer.querySelectorAll('img').forEach(n=>n.remove());
      imageElements = [];
      loadingMessage.style.display = 'none';
      errorMessage.style.display   = 'none';

      // <img>-Tags anlegen
      imageUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Bild aus ${folderId}`;
        sliderContainer.appendChild(img);
        imageElements.push(img);
      });

      // Erstes Bild anzeigen
      imageElements[0].classList.add('active');
      currentImageIndex = 0;
      if (imageElements.length > 1) {
        intervalId = setInterval(() => {
          imageElements[currentImageIndex].classList.remove('active');
          currentImageIndex = (currentImageIndex + 1) % imageElements.length;
          imageElements[currentImageIndex].classList.add('active');
        }, 5000);
      }
    } catch (err) {
      displayError(`Fehler beim Laden der Bilder: ${err.message}`);
    }
  }

  // Hauptlogik
  const params   = new URLSearchParams(window.location.search);
  const folderId = params.get('folderId');
  if (folderId) {
    startSlider(folderId);
  } else {
    displayError("Kein 'folderId' in der URL angegeben. Beispiel: ?folderId=beduerfnisse");
  }
});
