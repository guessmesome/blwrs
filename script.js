const PASS_DATA = true;

const SUPABASE_EDGE_URL = 'https://fljznpejgywacrnxlggv.supabase.co/functions/v1/get-redirect-url';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsanpucGVqZ3l3YWNybnhsZ2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODc3ODcsImV4cCI6MjA4MDY2Mzc4N30.oDc46bCj9ZPdUUUvdDTddY5un3A1_lIFUrs_UfFh6N4';
const LANDING_KEY = 'skblwrs';

let currentSlide = 1;
const totalSlides = 4;
let cachedOfferUrl = null;

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
        console.log('Using cached offer URL:', cachedOfferUrl);
        return cachedOfferUrl;
    }

    console.log('Fetching offer URL for key:', LANDING_KEY);

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

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success && data.url) {
            cachedOfferUrl = data.url;
            console.log('Offer URL loaded successfully:', cachedOfferUrl);
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

    console.log('buildFinalUrl result:', finalUrl);
    return finalUrl;
}

async function checkReturnVisitor() {
    const hasVisited = localStorage.getItem('blwrsVisited');
    console.log('checkReturnVisitor() called, hasVisited:', hasVisited);

    if (hasVisited) {
        const savedEmail = localStorage.getItem('userEmailBlwrs');
        console.log('Return visitor, saved email:', savedEmail);

        const offerUrl = await getOfferUrl();

        if (!offerUrl) {
            console.error('Could not get offer URL for return visitor');
            return false;
        }

        const finalUrl = buildFinalUrl(offerUrl, savedEmail);
        console.log('Return visitor final URL:', finalUrl);
        console.log('Redirecting return visitor...');

        window.location.href = finalUrl;
        return true;
    }

    return false;
}

function markAsVisited() {
    localStorage.setItem('blwrsVisited', 'true');
    localStorage.setItem('blwrsVisitTime', new Date().getTime());
}

function clearVisitorData() {
    localStorage.removeItem('blwrsVisited');
    localStorage.removeItem('blwrsVisitTime');
    localStorage.removeItem('userEmailBlwrs');
    console.log('Visitor data cleared');
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        document.getElementById(`slide${currentSlide}`).classList.remove('active');
        currentSlide++;
        document.getElementById(`slide${currentSlide}`).classList.add('active');
    }
}

function nextSlideWithEmail() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();

    if (email && isValidEmail(email)) {
        localStorage.setItem('userEmailBlwrs', email);
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

    const emailInput = document.getElementById('emailInput');
    const continueBtn = document.getElementById('continueBtn3');

    function validateEmailButton() {
        if (!emailInput || !continueBtn) return;
        const email = emailInput.value.trim();

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
    console.log('=== redirectToSite() START ===');
    markAsVisited();

    const savedEmail = localStorage.getItem('userEmailBlwrs');
    console.log('Saved email:', savedEmail);

    console.log('Fetching offer URL from Supabase...');
    const offerUrl = await getOfferUrl();
    console.log('Offer URL from Supabase:', offerUrl);

    if (!offerUrl) {
        console.error('Could not get offer URL');
        alert('Connection error. Please try again.');
        return;
    }

    const finalUrl = buildFinalUrl(offerUrl, savedEmail);
    console.log('=== FINAL URL ===:', finalUrl);
    console.log('Redirecting now...');

    window.location.href = finalUrl;
}

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
            nextSlide();
        }
    }

    startX = 0;
    startY = 0;
});

document.addEventListener('touchmove', function (e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentSlide < totalSlides) {
            nextSlide();
        } else if (currentSlide === totalSlides) {
            redirectToSite();
        }
    }
});
