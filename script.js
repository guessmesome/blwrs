const analytics = window.LANDING_ANALYTICS;
let redirecting = false, stepChanging = false;

const PASS_DATA = true;

const SUPABASE_EDGE_URL = 'https://fljznpejgywacrnxlggv.supabase.co/functions/v1/get-redirect-url';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsanpucGVqZ3l3YWNybnhsZ2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODc3ODcsImV4cCI6MjA4MDY2Mzc4N30.oDc46bCj9ZPdUUUvdDTddY5un3A1_lIFUrs_UfFh6N4';
const LANDING_KEY = 'skblwrs';

let currentSlide = 1;
const totalSlides = 4;
let cachedOfferUrl = null;

const imagesToPreload = [
    'images/bg1.jpg',
    'images/bg2.jpg',
    'images/bg3.jpg',
    'images/bg4.jpg',
    'images/logo-big.png'
];

function preloadImages() {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = imagesToPreload.length;

        imagesToPreload.forEach((src) => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loaded++;
                if (loaded >= total) {
                    resolve();
                }
            };
            img.src = src;
        });

        setTimeout(resolve, 5000);
    });
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => {
            const slide1 = document.getElementById('slide1');
            if (slide1) {
                slide1.classList.add('active', 'entering');
                analytics?.enter(1);
            }
        }, 100);
    }
}

function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        subid: urlParams.get('subid') || '',
        p7: urlParams.get('p7') || '',
        clickid: urlParams.get('clickid') || '',
        subid2: urlParams.get('subid2') || ''
    };
}

function encodeEmailToBase64(email) {
    if (!email) return '';
    const emailObj = { "email": email };
    const jsonString = JSON.stringify(emailObj);
    return btoa(jsonString);
}

async function getOfferUrl() {
    if (cachedOfferUrl) {
        return cachedOfferUrl;
    }


    try {
        const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ key: LANDING_KEY })
        });

        const data = await response.json();

        if (data.success && data.url) {
            cachedOfferUrl = data.url;
            return cachedOfferUrl;
        } else {
            console.error('Failed to get offer URL. Response:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching offer URL:', error);
        return null;
    }
}

function buildFinalUrl(baseUrl, email) {
    if (!baseUrl) return null;

    const params = getUrlParams();
    const encodedEmail = email ? encodeEmailToBase64(email) : '';

    let finalUrl = baseUrl
        .replace('{p7}', encodeURIComponent(params.p7))
        .replace('{clickid}', encodeURIComponent(params.clickid))
        .replace('{subid}', encodeURIComponent(params.subid))
        .replace('{subid2}', encodeURIComponent(params.subid2))
        .replace('{_fData}', encodedEmail);

    if (email && !baseUrl.includes('{_fData}')) {
        finalUrl += `&_fData=${encodedEmail}`;
    }

    return finalUrl;
}

async function checkReturnVisitor() {
    let visited = false;
    try { visited = !!localStorage.getItem('blwrsVisited'); } catch { return false; }
    if (!visited) return false;
    try {
        redirecting = true;
        const offerUrl = await getOfferUrl();
        if (!offerUrl) throw new Error('Offer unavailable');
        const finalUrl = buildFinalUrl(offerUrl, localStorage.getItem('userEmailBlwrs'));
        analytics?.prepareOutbound();
        window.location.assign(finalUrl);
        analytics?.outboundRedirect(true);
        return true;
    } catch {
        analytics?.redirectError(true);
        redirecting = false;
        return false;
    }
}

function markAsVisited() {
    localStorage.setItem('blwrsVisited', 'true');
    localStorage.setItem('blwrsVisitTime', new Date().getTime());
}

function clearVisitorData() {
    localStorage.removeItem('blwrsVisited');
    localStorage.removeItem('blwrsVisitTime');
    localStorage.removeItem('userEmailBlwrs');
}

function nextSlide(source = 'button') {
    if (redirecting || stepChanging || currentSlide >= totalSlides) return;
    if (currentSlide === 3 && !isValidEmail(document.getElementById('emailInput').value.trim())) return;
    if (source === 'button') analytics?.cta(currentSlide);
    const currentSlideEl = document.getElementById(`slide${currentSlide}`);
    const nextSlideEl = document.getElementById(`slide${currentSlide + 1}`);
    stepChanging = true;
    currentSlideEl.classList.remove('entering');
    currentSlideEl.classList.add('exiting');
    setTimeout(() => {
        currentSlideEl.classList.remove('active', 'exiting');
        nextSlideEl.classList.add('active', 'entering');
        currentSlide++;
        stepChanging = false;
        analytics?.enter(currentSlide);
    }, 400);
}

function nextSlideWithEmail() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();

    if (!redirecting && !stepChanging && currentSlide === 3 && email && isValidEmail(email)) {
        analytics?.observeEmail(email);
        analytics?.emailSubmitted();
        try { localStorage.setItem('userEmailBlwrs', email); } catch { /* Input remains available. */ }
        nextSlide();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

document.addEventListener('DOMContentLoaded', async function () {
    getOfferUrl();

    if (await checkReturnVisitor()) {
        return;
    }

    await preloadImages();
    hidePreloader();
    const emailInput = document.getElementById('emailInput');
    const continueBtn = document.getElementById('continueBtn3');

    function validateEmailButton() {
        if (!emailInput || !continueBtn) return;
        const email = emailInput.value.trim();
        analytics?.observeEmail(email);

            if (email && isValidEmail(email)) {
                continueBtn.disabled = false;
                continueBtn.classList.remove('disabled');
            } else {
                continueBtn.disabled = true;
                continueBtn.classList.add('disabled');
            }
    }

    if (emailInput && continueBtn) {
        emailInput.addEventListener('input', validateEmailButton);
        emailInput.addEventListener('change', validateEmailButton);
        emailInput.addEventListener('keyup', validateEmailButton);
        setTimeout(validateEmailButton, 100);
    }
});

async function redirectToSite() {
    if (redirecting || currentSlide !== 4) return;
    redirecting = true;
    analytics?.cta(4);
    const button = document.querySelector('.age-verification-btn');
    button.disabled = true;
    try {
        const offerUrl = await getOfferUrl();
        if (!offerUrl) throw new Error('Offer unavailable');
        const email = document.getElementById('emailInput').value.trim();
        const finalUrl = buildFinalUrl(offerUrl, email);
        analytics?.prepareOutbound();
        window.location.assign(finalUrl);
        analytics?.outboundRedirect();
        try { markAsVisited(); } catch { /* Tracking does not depend on storage. */ }
    } catch {
        analytics?.redirectError();
        restoreAfterOffer();
        alert('Connection error. Please try again.');
    }
}
function restoreAfterOffer() {
    redirecting = false;
    document.querySelector('.age-verification-btn').disabled = false;
}
window.addEventListener('pageshow', event => { if (event.persisted) restoreAfterOffer(); });

let startX = 0;
let startY = 0;

document.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', function (e) {
    if (!startX || !startY) {
        return;
    }

    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;

    let diffX = startX - endX;
    let diffY = startY - endY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 50 && currentSlide < totalSlides) {
            if (currentSlide !== 3) nextSlide('gesture');
        }
    }

    startX = 0;
    startY = 0;
});

document.addEventListener('touchmove', function (e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, button')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentSlide < totalSlides) {
            if (currentSlide !== 3) nextSlide('gesture');
        } else if (currentSlide === totalSlides) {
            redirectToSite();
        }
    }
});
