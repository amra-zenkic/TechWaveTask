let adsLoaded = false;
let adDisplayContainer, adsLoader, adsManager, countdownInterval;
let remainingTime = 5;

const adTagUrl =
  'https://pubads.g.doubleclick.net/gampad/ads?' +
  'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
  'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&' +
  'gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';

// HTML Elements
const contentContainer = document.createElement('div');
contentContainer.id = 'sticky-content-container';

const upperButtons = document.createElement('div');
upperButtons.id = 'upper-buttons';

const videoContainer = document.createElement('div');

const adContainer = document.createElement('div');
adContainer.className = 'sticky-ad-container';

const videoElement = document.createElement('video');
videoElement.className = 'sticky-video';

const adUI = document.createElement('div');
adUI.id = 'ad-ui';

const countdownText = document.createElement('span');
countdownText.id = 'countdown';

const skipButton = document.createElement('span');
skipButton.id = 'skip-button';

const muteButton = document.createElement('span');
muteButton.id = 'mute-button';

const closeButton = document.createElement('span');
closeButton.id = 'close-button';

// Video player setup
videoElement.controls = true;
videoElement.muted = true;
videoElement.src = 'https://storage.googleapis.com/interactive-media-ads/media/android.mp4';

// Mute button
muteButton.textContent = '🔇';
muteButton.addEventListener('click', () => {
    if (adsManager) {
        const currentVolume = adsManager.getVolume();
        const isMuted = (currentVolume === 0);
        adsManager.setVolume(isMuted ? 1 : 0);
        muteButton.textContent = isMuted ? '🔊' : '🔇';
    }
});

// Close button
closeButton.textContent = '✖';
closeButton.style.display = 'none';
closeButton.addEventListener('click', () => {
  if (adsManager) adsManager.destroy();
  videoElement.pause();
  contentContainer.style.display = 'none';
});

// Skip button
skipButton.addEventListener('click', () => {
  if (adsManager) {
    try {
      adsManager.skip();
      adsManager.destroy();
      adUI.style.display = 'none';
      videoElement.style.zIndex = 'auto';
      videoElement.controls = true;
      muteButton.style.display = 'none';
      videoElement.play();
    } catch (error) {
      console.error('Error skipping ad:', error);
    }
  }
});

// Ad UI
adUI.appendChild(countdownText);
adUI.appendChild(skipButton);

upperButtons.appendChild(muteButton);
upperButtons.appendChild(closeButton);

adContainer.appendChild(adUI);

videoContainer.appendChild(adContainer);
videoContainer.appendChild(videoElement);

contentContainer.appendChild(upperButtons);
contentContainer.appendChild(videoContainer);

document.body.appendChild(contentContainer);

// IMA SDK script
const imaScript = document.createElement('script');
imaScript.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
imaScript.onload = () => {
  adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);

  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    (event) => {
      const adsRenderingSettings = new google.ima.AdsRenderingSettings();
      adsRenderingSettings.disableUi = true;

      adsManager = event.getAdsManager(videoElement, adsRenderingSettings);

      adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (e) => {
        console.log(e.getError());
        if (adsManager) adsManager.destroy();
      });

      adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
        videoElement.pause();
        videoElement.controls = false;
        videoElement.style.zIndex = -1;
        adUI.style.display = 'block';
        startCountdown();
      });

      adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, (e) => {
        if (!e.getAd().isLinear()) videoElement.play();
      });

      adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, () => {
        adUI.style.display = 'block';
        startCountdown();
      });

      adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
        if (adsManager) adsManager.destroy();
        adUI.style.display = 'none';
        videoElement.style.zIndex = 'auto';
        videoElement.controls = true;
        closeButton.style.display = 'block';
        muteButton.style.display = 'none';
        videoElement.play();
      });
    }
  );

  adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (event) => {
    console.log(event.getError());
    if (adsManager) adsManager.destroy();
  });

  videoElement.addEventListener('ended', () => {
    adsLoader.contentComplete();
  });

  const adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = adTagUrl;
  adsRequest.linearAdSlotWidth = videoElement.clientWidth;
  adsRequest.linearAdSlotHeight = videoElement.clientHeight;

  adsLoader.requestAds(adsRequest);
};

document.head.appendChild(imaScript);

// Autoplay logic
window.addEventListener('load', () => {
  if (!adsLoaded) {
    videoElement
      .play()
      .then(() => {
        setTimeout((event) => {
          if (adsLoaded) return;
          adsLoaded = true;
          try {
            if (!adDisplayContainer.isInitialized) {
              adDisplayContainer.initialize();
            }

            const width = videoElement.clientWidth;
            const height = videoElement.clientHeight;

            adsManager.init(width, height, google.ima.ViewMode.NORMAL);
            adsManager.start();
            videoElement.pause();
          } catch (error) {
            console.error('Ad loading failed:', error);
            closeButton.style.display = 'block';
            videoElement.play();
          }
        }, 1000);
      })
      .catch((error) => {
        console.error('Autoplay blocked:', error);
      });
  }
});

// Countdown logic
function startCountdown() {
  clearInterval(countdownInterval);
  remainingTime = 5;

  countdownText.textContent = `Skip Ad in ${remainingTime}`;
  skipButton.textContent = '';
  skipButton.style.pointerEvents = 'none';

  countdownInterval = setInterval(() => {
    remainingTime--;
    countdownText.textContent = `Skip Ad in ${remainingTime}`;

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      countdownText.textContent = '';
      skipButton.textContent = 'Skip Ad';
      skipButton.style.pointerEvents = 'auto';
      closeButton.style.display = 'block';
    }
  }, 1000);
}

// Inject CSS
const css = `
  <style>
    #sticky-content-container {
      position: fixed;
      right: 20px;
      bottom: 0px;
      width: 300px;
      z-index: 10000;
      aspect-ratio: 16 / 9;
    }
    #upper-buttons {
      color: white;
      height: 30px;
      padding: 0 10px;
      font-size: 14px;
      align-items: center;
      
    }
    .sticky-video {
      width: 100%;
      height: auto;
      display: block;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    .sticky-ad-container {
      width: 100%;
      height: auto;
      display: block;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    #ad-ui {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 8px 15px;
      border-radius: 6px;
      cursor: pointer;
      z-index: 20;
    }
    #countdown {
      margin-right: 10px;
    }
    #skip-button {
      color: #fff;
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      pointer-events: none;
    }
    #mute-button, #close-button {
      width: 25px;
      text-align: center;
      font-size: 15px;
      background-color: rgba(0, 0, 0, 0.49);
      border-radius: 5px;
      color: #fff;
      cursor: pointer;
    }
      #mute-button {
          float: left;
      }
      #close-button {
          float: right;
      }
  </style>
`;
document.head.insertAdjacentHTML('beforeend', css);
