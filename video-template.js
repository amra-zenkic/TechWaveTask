// video elements and containers
const videoContainer = document.createElement('div')
const adContainer = document.createElement('div')
const videoElement = document.createElement('video')

// css for sticky player
const stickyCSS = `
    <style>
        .sticky-video-container {
            position: fixed;
            right: 20px;
            bottom: 0px;
            width: 300px;
            z-index: 10000;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            aspect-ratio: 16 / 9;
        }

        .sticky-video {
            width: 100%;
            height: auto;
            display: block;
        }

        .sticky-ad-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }

    </style>`
document.head.insertAdjacentHTML('beforeend', stickyCSS)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Konfiguracija
let adsManager, adsLoader, adDisplayContainer;
const adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dskippablelinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';

// Inicijalizacija playera
function initVideoPlayer() {
    // Kreiraj strukturu
    videoContainer.className = 'sticky-video-container';
    adContainer.className = 'sticky-ad-container';
    
    videoElement.className = 'sticky-video';
    videoElement.controls = true;
    videoElement.muted = true;
    videoElement.src = 'https://storage.googleapis.com/interactive-media-ads/media/android.mp4'; // video that we want to play
    
    videoContainer.appendChild(adContainer);
    videoContainer.appendChild(videoElement);
    document.body.appendChild(videoContainer);

    // loading google ima sdk
    const imaScript = document.createElement('script');
    imaScript.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
    document.head.appendChild(imaScript);

    // Inicijalizacija IMA
    imaScript.onload = () => {
        adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
        adsLoader = new google.ima.AdsLoader(adDisplayContainer);

        adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
            onAdsManagerLoaded
        );

        const adsRequest = new google.ima.AdsRequest();
        adsRequest.adTagUrl = adTagUrl;
        adsRequest.linearAdSlotWidth = 300;
        adsRequest.linearAdSlotHeight = 150;
        adsLoader.requestAds(adsRequest);
    };

    // Sticky scroll handler
    let headerHeight = document.querySelector('.navbar').offsetHeight;
    window.addEventListener('scroll', () => {
        //videoContainer.style.top = `${window.scrollY + headerHeight + 20}px`;
        videoContainer.style.bottom = `${20}px`;

    });
}

// Event handleri za IMA
function onAdsManagerLoaded(event) {
    adsManager = event.getAdsManager(videoElement);
    adsManager.init(300, 150, google.ima.ViewMode.NORMAL);
    
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
        videoElement.pause();
    });
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
        videoElement.play();
    });
    
    // Pokreni reklame nakon korisničke interakcije
    document.addEventListener('click', () => {
        adDisplayContainer.initialize();
        try {
            adsManager.start();
        } catch (error) {
            videoElement.play();
        }
    }, {once: true});
}

function onAdError(error) {
    console.error('Ad error:', error);
    videoElement.play();
}

// Pokreni inicijalizaciju
setTimeout(initVideoPlayer, 1000); // Osiguraj da je DOM spreman

