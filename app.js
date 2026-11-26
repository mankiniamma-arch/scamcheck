const SITE_URL = 'https://scamcheck.cardeskus.com/';

// Elements
const splashScreen = document.getElementById('splashScreen');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const previewBox = document.getElementById('previewBox');
const previewImg = document.getElementById('previewImg');
const removeImgBtn = document.getElementById('removeImgBtn');
const smsInput = document.getElementById('smsInput');
const checkBtn = document.getElementById('checkBtn');
const errorMsg = document.getElementById('errorMsg');

const checkerCard = document.getElementById('checkerCard');
const loadingCard = document.getElementById('loadingCard');
const resultCard = document.getElementById('resultCard');
const resetBtn = document.getElementById('resetBtn');

const verdictBanner = document.getElementById('verdictBanner');
const verdictWord = document.getElementById('verdictWord');
const verdictHeadline = document.getElementById('verdictHeadline');
const verdictSummary = document.getElementById('verdictSummary');
const detectedType = document.getElementById('detectedType');
const confidenceBadge = document.getElementById('confidenceBadge');
const reasonsList = document.getElementById('reasonsList');
const stepsList = document.getElementById('stepsList');

const ctaKicker = document.getElementById('ctaKicker');
const ctaTitle = document.getElementById('ctaTitle');
const ctaDesc = document.getElementById('ctaDesc');
const ctaButton = document.getElementById('ctaButton');

const installBtn = document.getElementById('installBtn');
const installModal = document.getElementById('installModal');
const installModalTitle = document.getElementById('installModalTitle');
const installModalNote = document.getElementById('installModalNote');
const installStepsList = document.getElementById('installStepsList');
const closeInstallModal = document.getElementById('closeInstallModal');

const nativeShareBtn = document.getElementById('nativeShareBtn');
const shareWa = document.getElementById('shareWa');
const shareSms = document.getElementById('shareSms');
const shareX = document.getElementById('shareX');
const shareFb = document.getElementById('shareFb');
const shareReddit = document.getElementById('shareReddit');
const copyLinkBtn = document.getElementById('copyLinkBtn');

const footWa = document.getElementById('footWa');
const footX = document.getElementById('footX');
const footFb = document.getElementById('footFb');
const footReddit = document.getElementById('footReddit');
const footCopy = document.getElementById('footCopy');

let selectedBase64 = null;
let selectedMime = 'image/jpeg';
let deferredPrompt = null;
let lastShareMessage = `Free US Toll & DMV Scam Checker — check if any toll SMS or car notice is SCAM or REAL in 2 seconds: ${SITE_URL}`;

// ===================================================
// 1. 1.8s Premium Splash Screen (Tap to skip early)
// ===================================================
function hideSplash() {
  if (!splashScreen || splashScreen.classList.contains('splash-hide')) return;
  splashScreen.classList.add('splash-hide');
  setTimeout(() => {
    splashScreen.style.display = 'none';
  }, 480);
}

setTimeout(hideSplash, 1800);
if (splashScreen) {
  splashScreen.addEventListener('click', hideSplash);
}

// ===================================================
// 2. Auto-Build Crisp 180x180 PNG Apple Touch Icon
// ===================================================
(function buildAppleIcon() {
  try {
    const link = document.getElementById('appleTouchIcon');
    if (!link) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00f0ff"/><stop offset="100%" stop-color="#ff00e5"/></linearGradient></defs><rect width="100" height="100" fill="#070a18"/><g transform="translate(0,14)" stroke-linecap="round" stroke-linejoin="round"><path d="M 18 30 L 28 14 Q 50 9 72 14 L 82 30 Z" fill="#0f1b33" stroke="url(#g)" stroke-width="2.8"/><path d="M 8 48 L 11 34 Q 15 30 22 30 L 78 30 Q 85 30 89 34 L 92 48 Q 92 54 86 54 L 14 54 Q 8 54 8 48 Z" fill="#0c1428" stroke="url(#g)" stroke-width="3"/><path d="M 14 39 L 29 41 L 26 45 L 13 44 Z" fill="#00f0ff"/><path d="M 86 39 L 71 41 L 74 45 L 87 44 Z" fill="#ff00e5"/><rect x="35" y="42" width="30" height="7" rx="2" fill="none" stroke="url(#g)" stroke-width="2"/><rect x="14" y="54" width="15" height="7" rx="2" fill="#090d1a" stroke="#00f0ff" stroke-width="2.2"/><rect x="71" y="54" width="15" height="7" rx="2" fill="#090d1a" stroke="#ff00e5" stroke-width="2.2"/></g></svg>`;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 180;
      c.height = 180;
      c.getContext('2d').drawImage(img, 0, 0, 180, 180);
      link.href = c.toDataURL('image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  } catch (_) {}
})();

// ===================================================
// 3. Bulletproof Android & iPhone PWA Install
// ===================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const ua = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
const isAndroid = /Android/i.test(ua);
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

if (isStandalone) {
  installBtn.hidden = true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
  installBtn.textContent = 'Install App';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installBtn.hidden = true;
});

function openInstallGuide() {
  installStepsList.innerHTML = '';
  let steps = [];

  if (isIOS) {
    installModalTitle.textContent = 'Install on iPhone / iPad';
    installModalNote.textContent = 'Open in Safari and follow these 2 quick steps:';
    steps = [
      'Tap the <strong>Share</strong> icon at the bottom of Safari.',
      'Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.'
    ];
  } else if (isAndroid) {
    installModalTitle.textContent = 'Install on Android';
    installModalNote.textContent = 'If the automatic popup did not appear, install in 2 taps:';
    steps = [
      'Make sure this page is open in <strong>Google Chrome</strong> (not inside WhatsApp or Instagram).',
      'Tap the <strong>3 dots (&#8942;)</strong> at the top-right corner of Chrome.',
      'Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.'
    ];
  } else {
    installModalTitle.textContent = 'Install Desktop App';
    installModalNote.textContent = 'Add CarDesk ScamCheck to your computer:';
    steps = [
      'Click the <strong>Install icon</strong> on the right side of your Chrome or Edge address bar.',
      'Click <strong>Install</strong> to open it like a standalone app.'
    ];
  }

  steps.forEach((html) => {
    const li = document.createElement('li');
    li.innerHTML = html;
    installStepsList.appendChild(li);
  });

  installModal.hidden = false;
}

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      installBtn.hidden = true;
    }
  } else {
    openInstallGuide();
  }
});

closeInstallModal.addEventListener('click', () => (installModal.hidden = true));
installModal.addEventListener('click', (e) => {
  if (e.target === installModal) installModal.hidden = true;
});

// ===================================================
// 4. Social Share Links Setup
// ===================================================
function updateShareLinks(text) {
  lastShareMessage = text;
  const encText = encodeURIComponent(text);
  const encUrl = encodeURIComponent(SITE_URL);
  const titleOnly = encodeURIComponent('Free US Toll & DMV Scam Checker — SCAM or REAL in 2s');

  shareWa.href = `https://wa.me/?text=${encText}`;
  shareSms.href = isIOS ? `sms:&body=${encText}` : `sms:?body=${encText}`;
  shareX.href = `https://twitter.com/intent/tweet?text=${encText}`;
  shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
  shareReddit.href = `https://www.reddit.com/submit?url=${encUrl}&title=${titleOnly}`;
}

(function initFooterShare() {
  const defaultMsg = `Got a weird US toll SMS or DMV notice? Check SCAM or REAL in 2 seconds for free: ${SITE_URL}`;
  const encText = encodeURIComponent(defaultMsg);
  const encUrl = encodeURIComponent(SITE_URL);
  const titleOnly = encodeURIComponent('Free US Toll & DMV Scam Checker (CarDesk US)');

  footWa.href = `https://wa.me/?text=${encText}`;
  footX.href = `https://twitter.com/intent/tweet?text=${encText}`;
  footFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
  footReddit.href = `https://www.reddit.com/submit?url=${encUrl}&title=${titleOnly}`;

  if (navigator.share) {
    nativeShareBtn.hidden = false;
  }
})();

nativeShareBtn.addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({
      title: 'CarDesk US — Free Toll & DMV Scam Checker',
      text: lastShareMessage,
      url: SITE_URL
    }).catch(() => {});
  }
});

async function copyShareUrl(btnEl, originalLabel) {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    btnEl.textContent = 'Copied!';
    setTimeout(() => (btnEl.textContent = originalLabel), 1800);
  } catch (_) {
    window.prompt('Copy this link:', SITE_URL);
  }
}

copyLinkBtn.addEventListener('click', () => copyShareUrl(copyLinkBtn, 'Copy Link'));
footCopy.addEventListener('click', () => copyShareUrl(footCopy, 'Copy Link'));

// ===================================================
// 5. Image Upload, Drag-Drop, Paste & Compression
// ===================================================
['dragenter', 'dragover'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) handleImageFile(file);
});

window.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) handleImageFile(file);
      break;
    }
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleImageFile(file);
});

removeImgBtn.addEventListener('click', clearImage);

function clearImage() {
  selectedBase64 = null;
  fileInput.value = '';
  previewImg.src = '';
  previewBox.hidden = true;
  dropZone.hidden = false;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function hideError() {
  errorMsg.hidden = true;
  errorMsg.textContent = '';
}

function handleImageFile(file) {
  hideError();
  if (!file.type.startsWith('image/')) {
    showError('Please upload a valid screenshot or photo.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      selectedBase64 = dataUrl.split(',')[1];
      selectedMime = 'image/jpeg';

      previewImg.src = dataUrl;
      dropZone.hidden = true;
      previewBox.hidden = false;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ===================================================
// 6. Run AI Check & Render Dynamic Cross-Sell Verdict
// ===================================================
checkBtn.addEventListener('click', async () => {
  hideError();
  const smsText = smsInput.value.trim();

  if (!selectedBase64 && !smsText) {
    showError('Upload a screenshot/photo or paste the message text first.');
    return;
  }

  checkerCard.hidden = true;
  resultCard.hidden = true;
  loadingCard.hidden = false;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: selectedBase64,
        mimeType: selectedMime,
        smsText
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Could not complete check. Please try again.');
    }

    renderResult(data);
  } catch (err) {
    loadingCard.hidden = true;
    checkerCard.hidden = false;
    showError(err.message || 'Connection issue. Please try again.');
  }
});

function renderResult(data) {
  const verdict = (data.verdict || 'SUSPICIOUS').toUpperCase();
  verdictBanner.classList.remove('is-scam', 'is-real', 'is-suspicious');

  if (verdict === 'SCAM') {
    verdictBanner.classList.add('is-scam');
    verdictWord.textContent = 'SCAM';
    ctaKicker.textContent = 'CARDESK US • PAID TICKET TOOL';
    ctaTitle.textContent = 'Safe From This Scam — Got a Real Ticket?';
    ctaDesc.textContent =
      'Whenever you get a real US parking, red-light, or speed camera ticket, build a state-specific appeal packet in 60 seconds for $9.99.';
    ctaButton.textContent = 'Open CarDesk Ticket AI →';
    ctaButton.href = 'https://ticket.cardeskus.com/?ref=scamcheck_scam';
    updateShareLinks(`Heads up! I just checked a suspicious US toll/DMV text and it came back SCAM. Check yours free in 2 seconds: ${SITE_URL}`);
  } else if (verdict === 'REAL') {
    verdictBanner.classList.add('is-real');
    verdictWord.textContent = 'REAL';
    ctaKicker.textContent = 'RECOMMENDED NEXT STEP • SAVE $150+';
    ctaTitle.textContent = 'This Notice Looks REAL — Don’t Overpay It';
    ctaDesc.textContent =
      'Fight unfair US parking or camera tickets in 60 seconds. Get a state-specific appeal letter, AI error audit & 4-shot evidence guide for just $9.99.';
    ctaButton.textContent = 'Build My Appeal Packet ($9.99) →';
    ctaButton.href = 'https://ticket.cardeskus.com/?ref=scamcheck_real';
    updateShareLinks(`Just verified a US notice in 2 seconds with this free CarDesk US tool. Check any toll SMS or DMV notice free here: ${SITE_URL}`);
  } else {
    verdictBanner.classList.add('is-suspicious');
    verdictWord.textContent = 'LIKELY SCAM';
    ctaKicker.textContent = 'CARDESK US • PAID TICKET TOOL';
    ctaTitle.textContent = 'Dealing With a Real US Ticket Instead?';
    ctaDesc.textContent =
      'Appeal unfair US parking and camera tickets in 60 seconds with CarDesk US Ticket AI — one-time $9.99.';
    ctaButton.textContent = 'Check CarDesk Ticket AI →';
    ctaButton.href = 'https://ticket.cardeskus.com/?ref=scamcheck_suspicious';
    updateShareLinks(`Heads up! Watch out for fake US toll & DMV texts. Check any screenshot free in 2 seconds: ${SITE_URL}`);
  }

  detectedType.
