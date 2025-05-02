document.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.getElementById('image-slider-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    // --- Konfiguration der Bildordner ---
    // Hier musst du manuell die Bilder für jeden Ordner definieren.
    // Der Schlüssel (z.B. 'nature') muss dem Ordnernamen entsprechen UND
    // dem Wert des 'folderId'-Parameters in der URL.
    const imageSets = {
        'nature': [
            'image1.jpg',
            'image2.png',
            'image3.gif'
        ],
        'city': [
            'building.jpg',
            'street.png',
            'skyline.jpeg'
        ],
        'technology': [
            'code.jpg',
            'hardware.png'
        ]
        // Füge hier weitere Ordner und deren Bilddateinamen hinzu
        // 'ordnername': ['bild1.jpg', 'bild2.png', ...]
    };
    // --- Ende der Konfiguration ---

    let currentImageIndex = 0;
    let imageElements = [];
    let intervalId = null;

    function getFolderIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('folderId'); // Holt den Wert von ?folderId=...
    }

    function displayError(message) {
        loadingMessage.style.display = 'none';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        console.error(message);
    }

    function showNextImage() {
        if (imageElements.length === 0) return;

        // Aktuelles Bild ausblenden
        imageElements[currentImageIndex].classList.remove('active');

        // Nächsten Index berechnen (Schleife)
        currentImageIndex = (currentImageIndex + 1) % imageElements.length;

        // Nächstes Bild einblenden
        imageElements[currentImageIndex].classList.add('active');
    }

    function startSlider(folderId) {
        const imageFiles = imageSets[folderId];

        if (!imageFiles || imageFiles.length === 0) {
            displayError(`Fehler: Kein Bildset für folderId '${folderId}' gefunden oder der Ordner ist leer.`);
            return;
        }

        // Alten Intervall stoppen, falls vorhanden (z.B. bei dynamischer Änderung)
        if (intervalId) {
            clearInterval(intervalId);
        }
        // Alte Bilder entfernen
        sliderContainer.querySelectorAll('img').forEach(img => img.remove());
        imageElements = []; // Array leeren

        // Ladeanzeige ausblenden
        loadingMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        // Neue Image-Elemente erstellen und hinzufügen
        imageFiles.forEach(fileName => {
            const img = document.createElement('img');
            img.src = `images/${folderId}/${fileName}`; // Pfad zum Bild
            img.alt = `Bild aus Ordner ${folderId}`; // Alternativtext
            sliderContainer.appendChild(img);
            imageElements.push(img); // Zum Array hinzufügen
        });

        if (imageElements.length > 0) {
            // Erstes Bild sofort anzeigen
            imageElements[0].classList.add('active');
            currentImageIndex = 0;

            // Intervall für den Wechsel starten (nur wenn mehr als 1 Bild)
            if (imageElements.length > 1) {
                intervalId = setInterval(showNextImage, 5000); // 5000 ms = 5 Sekunden
            }
        } else {
            displayError(`Keine gültigen Bilder im Set für '${folderId}' gefunden.`);
        }
    }

    // Hauptlogik starten
    const folderId = getFolderIdFromUrl();

    if (folderId) {
        // Überprüfen, ob der angeforderte folderId in unserer Konfiguration existiert
        if (imageSets.hasOwnProperty(folderId)) {
             startSlider(folderId);
        } else {
             displayError(`Fehler: Ungültige folderId '${folderId}'. Verfügbare Sets: ${Object.keys(imageSets).join(', ')}`);
        }
    } else {
        displayError("Fehler: Kein 'folderId' in der URL angegeben. Beispiel: ?folderId=nature");
    }
});
