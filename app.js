const SITE_URL = 'https://scamcheck.cardeskus.com/';

// Elements
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

const footNativeShare = document.getElementById('footNativeShare');
const footWa = document.getElementById('footWa');
const footSms = document.getElementById('footSms');
const footX = document.getElementById('footX');
const footFb = document.getElementById('footFb');
const footReddit = document.getElementById('footReddit');
const footCopy = document.getElementById('footCopy');

let selectedBase64 = null;
let selectedMime = 'image/jpeg';
let deferredPrompt = null;
let lastShareMessage = `Got a weird US toll SMS or DMV notice? Check SCAM or REAL in 2 seconds for free: ${SITE_URL}`;

// ===================================================
// 1. Android & iPhone PWA Home Screen Install
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

if (isStandalone && installBtn) {
  installBtn.hidden = true;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.hidden = false;
    installBtn.textContent = 'Install';
  }
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (installBtn) installBtn.hidden = true;
});

function openInstallGuide() {
  installStepsList.innerHTML = '';
  let steps = [];

  if (isIOS) {
    installModalTitle.textContent = 'Install on iPhone / iPad';
    installModalNote.textContent = 'Add CarDesk ScamCheck to your iPhone Home Screen in 2 taps (Safari):';
    steps = [
      'Tap the <strong>Share</strong> icon (square with upward arrow) at the bottom of Safari.',
      'Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.'
    ];
  } else if (isAndroid) {
    installModalTitle.textContent = 'Install on Android';
    installModalNote.textContent = 'Add CarDesk ScamCheck directly to your Home Screen:';
    steps = [
      'Make sure this link is open in <strong>Google Chrome</strong> (not inside WhatsApp/Instagram browser).',
      'Tap the <strong>3 dots (&#8942;)</strong> at the top-right corner of Chrome.',
      'Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.'
    ];
  } else {
    installModalTitle.textContent = 'Install Desktop App';
    installModalNote.textContent = 'Add CarDesk ScamCheck to your computer:';
    steps = [
      'Click the <strong>Install icon</strong> on the right side of your Chrome or Edge address bar.',
      'Click <strong>Install</strong> to launch it as a standalone app.'
    ];
  }

  steps.forEach((html) => {
    const li = document.createElement('li');
    li.innerHTML = html;
    installStepsList.appendChild(li);
  });

  installModal.hidden = false;
}

if (installBtn) {
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
}

if (closeInstallModal) {
  closeInstallModal.addEventListener('click', () => (installModal.hidden = true));
}
if (installModal) {
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) installModal.hidden = true;
  });
}

// ===================================================
// 2. Legal Modals (Terms of Service & Privacy Policy)
// ===================================================
document.querySelectorAll('[data-open-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = document.getElementById(btn.getAttribute('data-open-modal'));
    if (modal) modal.hidden = false;
  });
});

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = document.getElementById(btn.getAttribute('data-close-modal'));
    if (modal) modal.hidden = true;
  });
});

['termsModal', 'privacyModal'].forEach((id) => {
  const modal = document.getElementById(id);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.hidden = true;
    });
  }
});

// ===================================================
// 3. Live Social Share (WhatsApp, SMS, X, FB, Reddit)
// ===================================================
function buildShareUrls(text) {
  const encText = encodeURIComponent(text);
  const encUrl = encodeURIComponent(SITE_URL);
  const titleOnly = encodeURIComponent('Free US Toll & DMV Scam Checker — SCAM or REAL in 2s (CarDesk US)');
  return {
    wa: `https://api.whatsapp.com/send?text=${encText}`,
    sms: isIOS ? `sms:&body=${encText}` : `sms:?body=${encText}`,
    x: `https://twitter.com/intent/tweet?text=${encText}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encUrl}&title=${titleOnly}`
  };
}

function updateResultShareLinks(text) {
  lastShareMessage = text;
  const urls = buildShareUrls(text);
  if (shareWa) shareWa.href = urls.wa;
  if (shareSms) shareSms.href = urls.sms;
  if (shareX) shareX.href = urls.x;
  if (shareFb) shareFb.href = urls.fb;
  if (shareReddit) shareReddit.href = urls.reddit;
}

(function initFooterShare() {
  const defaultMsg = `Got a weird US toll SMS or DMV notice? Check SCAM or REAL in 2 seconds for free: ${SITE_URL}`;
  const urls = buildShareUrls(defaultMsg);
  if (footWa) footWa.href = urls.wa;
  if (footSms) footSms.href = urls.sms;
  if (footX) footX.href = urls.x;
  if (footFb) footFb.href = urls.fb;
  if (footReddit) footReddit.href = urls.reddit;

  if (navigator.share) {
    if (nativeShareBtn) nativeShareBtn.hidden = false;
    if (footNativeShare) footNativeShare.hidden = false;
  }
})();

function triggerNativeShare(msg) {
  if (!navigator.share) return;
  navigator.share({
    title: 'CarDesk US — Free Toll & DMV Scam Checker',
    text: msg,
    url: SITE_URL
  }).catch(() => {});
}

if (nativeShareBtn) {
  nativeShareBtn.addEventListener('click', () => triggerNativeShare(lastShareMessage));
}
if (footNativeShare) {
  footNativeShare.addEventListener('click', () =>
    triggerNativeShare('Got a weird US toll SMS or DMV notice? Check SCAM or REAL in 2 seconds for free:')
  );
}

async function copyShareUrl(btnEl, originalLabel) {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    btnEl.textContent = 'Copied!';
    setTimeout(() => (btnEl.textContent = originalLabel), 1800);
  } catch (_) {
    window.prompt('Copy this link:', SITE_URL);
  }
}

if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => copyShareUrl(copyLinkBtn, 'Copy Link'));
if (footCopy) footCopy.addEventListener('click', () => copyShareUrl(footCopy, 'Copy Link'));

// ===================================================
// 4. Image Upload, Drag-Drop, Paste & Compression
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
// 5. Run AI Check & Render Dynamic Cross-Sell Verdict
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
    updateResultShareLinks(`Heads up! I just checked a suspicious US toll/DMV text and it came back SCAM. Check yours free in 2 seconds: ${SITE_URL}`);
  } else if (verdict === 'REAL') {
    verdictBanner.classList.add('is-real');
    verdictWord.textContent = 'REAL';
    ctaKicker.textContent = 'RECOMMENDED NEXT STEP • SAVE $150+';
    ctaTitle.textContent = 'This Notice Looks REAL — Don’t Overpay It';
    ctaDesc.textContent =
      'Fight unfair US parking or camera tickets in 60 seconds. Get a state-specific appeal letter, AI error audit & 4-shot evidence guide for just $9.99.';
    ctaButton.textContent = 'Build My Appeal Packet ($9.99) →';
    ctaButton.href = 'https://ticket.cardeskus.com/?ref=scamcheck_real';
    updateResultShareLinks(`Just verified a US notice in 2 seconds with this free CarDesk US tool. Check any toll SMS or DMV notice free here: ${SITE_URL}`);
  } else {
    verdictBanner.classList.add('is-suspicious');
    verdictWord.textContent = 'LIKELY SCAM';
    ctaKicker.textContent = 'CARDESK US • PAID TICKET TOOL';
    ctaTitle.textContent = 'Dealing With a Real US Ticket Instead?';
    ctaDesc.textContent =
      'Appeal unfair US parking and camera tickets in 60 seconds with CarDesk US Ticket AI — one-time $9.99.';
    ctaButton.textContent = 'Check CarDesk Ticket AI →';
    ctaButton.href = 'https://ticket.cardeskus.com/?ref=scamcheck_suspicious';
    updateResultShareLinks(`Heads up! Watch out for fake US toll & DMV texts. Check any screenshot free in 2 seconds: ${SITE_URL}`);
  }

  detectedType.textContent = data.detectedType || 'US Toll / DMV Check';
  confidenceBadge.textContent = `${data.confidence || 94}% Confidence`;
  verdictHeadline.textContent = data.headline || '';
  verdictSummary.textContent = data.summary || '';

  reasonsList.innerHTML = '';
  (data.reasons || []).slice(0, 4).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    reasonsList.appendChild(li);
  });

  stepsList.innerHTML = '';
  (data.nextSteps || []).slice(0, 3).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    stepsList.appendChild(li);
  });

  loadingCard.hidden = true;
  resultCard.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

resetBtn.addEventListener('click', () => {
  clearImage();
  smsInput.value = '';
  hideError();
  resultCard.hidden = true;
  checkerCard.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
