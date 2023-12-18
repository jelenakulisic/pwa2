if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
  
    deferredInstallPrompt = event;
  
    installButton.style.display = 'block';
});

installButton.addEventListener('click', () => {
    deferredInstallPrompt.prompt();
  
    deferredInstallPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Korisnik je prihvatio instalaciju');
            } else {
                console.log('Korisnik nije prihvatio instalaciju');
            }
            deferredInstallPrompt = null;
        });
});

const captureButton = document.getElementById('captureButton');
const videoEl = document.getElementById('videoElement');

var errorMessageElement = document.getElementById('error-message');
var fileInput = document.getElementById('file-input');
var uploadButton = document.getElementById('upload-button');

const photosContainer = document.getElementById('photos');

captureButton.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            videoEl.style.display = 'block';
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoEl.srcObject = stream;
    
            const track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const photoBlob = await imageCapture.takePhoto();
            const imageUrl = URL.createObjectURL(photoBlob);
    
            const imgElement = document.createElement('img');
            imgElement.style.width = '30%'; 
            imgElement.style.margin= '5px'; 
            imgElement.src = imageUrl;
            photosContainer.appendChild(imgElement);

            spremiSlikuUBazu(imageUrl, onSuccess, onError)

    
            if (Notification.permission !== 'granted') {
                Notification.requestPermission().then(function (permission) {
                  if (permission === 'granted') {
                    showNotification('The photo is captured!', 'success');
                  }
                });
              } else {
                showNotification('The photo is captured!', 'success');
            }
    
            track.stop();
            videoEl.srcObject = null;
            
        } catch (error) {
            videoEl.style.display = 'none';
            errorMessageElement.textContent = 'Camera is not allowed in this browser.';
            errorMessageElement.style.display = 'block';

            // Omogući gumb za uploadanje slike
            uploadButton.style.display = 'block';

            showNotification('Camera is not allowed in this browser.', 'error');
        }
    } else {
        // Ako Camera API nije podržan, prikaži alternativnu poruku
        errorMessageElement.textContent = 'Camera API is not supported in this browser.';
        errorMessageElement.style.display = 'block';

        // Omogući gumb za uploadanje slike
        uploadButton.style.display = 'block';
    }

});

uploadButton.addEventListener('click', function() {
    fileInput.click();
  });

fileInput.addEventListener('change', function() {
    var selectedFile = fileInput.files[0];

    if (selectedFile) {
        const imageUrl = URL.createObjectURL(selectedFile);

        const imgElement = document.createElement('img');
        imgElement.style.width = '30%'; 
        imgElement.style.margin= '5px'; 
        imgElement.src = imageUrl;
        photosContainer.appendChild(imgElement);

        spremiSlikuUBazu(imageUrl, onSuccess, onError)
    }

    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(function (permission) {
          if (permission === 'granted') {
            showNotification('The photo is uploaded!', 'success');
          }
        });
      } else {
        showNotification('The photo is uploaded!', 'success');
    }
});

function showNotification(message, type) {
    const notification = new Notification('Travel Journal', {
        body: message,
        icon: type === 'success' ? 'success.png' : 'error.png', 
    });

    setTimeout(notification.close.bind(notification), 3000);
}

function spremiSlikuUBazu(url, onSuccess, onError) {
    // Dohvati sliku s URL-a
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
  
    img.onload = function() {
      // Spremi sliku u IndexedDB
      var request = indexedDB.open("MojaSlikaDB", 1);
  
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore("slike", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("url", "url", { unique: true });
      };
  
      request.onsuccess = function(event) {
        var db = event.target.result;
        var transaction = db.transaction(["slike"], "readwrite");
        var objectStore = transaction.objectStore("slike");
  
        var putRequest = objectStore.put({ url: url, slika: img.src });
  
        putRequest.onsuccess = function(event) {
          if (onSuccess) onSuccess();
        };
  
        putRequest.onerror = function(event) {
          if (onError) onError(event.target.error);
        };
      };
  
      request.onerror = function(event) {
        if (onError) onError(event.target.error);
      };
    };
  
    img.onerror = function() {
      if (onError) onError("Greška prilikom učitavanja slike.");
    };
  }

  function prikaziSlikeNaStranici() {
    var request = indexedDB.open("MojaSlikaDB", 1);
  
    request.onsuccess = function(event) {
      var db = event.target.result;
      var transaction = db.transaction(["slike"], "readonly");
      var objectStore = transaction.objectStore("slike");
      var cursorRequest = objectStore.openCursor();
  
      cursorRequest.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          // Stvori element img i dodaj ga u div "photos"
          var imgElement = document.createElement("img");
          imgElement.src = cursor.value.slika;
  
          var photosDiv = document.getElementById("photos");
          photosDiv.appendChild(imgElement);
  
          cursor.continue();
        }
      };
    };
  }

// Spremi sliku u bazu podataka i pokreni background sync
spremiSlikuUBazu("URL_SLIKE_OVDJE", function() {
    console.log("Slika spremljena u bazu podataka.");
    pokreniBackgroundSync();
  }, function(error) {
    console.error("Greška prilikom spremanja slike: " + error);
  });
  
  // Pokreni background sync
  function pokreniBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(function(registration) {
        return registration.sync.register('background-sync');
      });
    }
  }
  


  
  






