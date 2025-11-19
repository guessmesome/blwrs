const PASS_DATA = true;

let currentSlide = 1;
const totalSlides = 4;

// Vercel Analytics tracking
function trackEvent(eventName, properties = {}) {
    if (window.vaTrack) {
        window.vaTrack(eventName, properties);
    }
    console.log('Analytics Event:', eventName, properties);
}

// Function to get URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        subid: urlParams.get('subid') || '',
        clickid: urlParams.get('clickid') || '',
        subid2: urlParams.get('subid2') || ''
    };
}

// Function to encode email to base64 JSON format
function encodeEmailToBase64(email) {
    if (!email) return '';
    
    const emailObj = { "email": email };
    const jsonString = JSON.stringify(emailObj);
    
    // Encode to base64
    return btoa(jsonString);
}

// Check if user has visited before
function checkReturnVisitor() {
    const hasVisited = localStorage.getItem('blowersVisited');
    console.log('checkReturnVisitor() called, hasVisited:', hasVisited);
    
    if (hasVisited) {
        // User has visited before, redirect immediately with saved email
        const savedEmail = localStorage.getItem('userEmail');
        console.log('Return visitor, saved email:', savedEmail);
        
        // Track return visitor
        trackEvent('Return Visitor Redirect', {
            hasEmail: !!savedEmail
        });
        
        let baseUrl;
        if (PASS_DATA) {
            const params = getUrlParams();
            baseUrl = `https://bldnw.online/hqgVLv?sub_id_1=sk46&clickid=${params.clickid}&subid=${params.subid}&subid2=${params.subid2}`;
            
            if (savedEmail) {
                const encodedEmail = encodeEmailToBase64(savedEmail);
                console.log('Return visitor encoded email:', encodedEmail);
                baseUrl += `&_fData=${encodedEmail}`;
            }
            
        } else {
            baseUrl = 'https://bldnw.online/hqgVLv?sub_id_1=sk46&clickid={clickid}&subid={subid}&subid2={subid2}&_fData={_fData}';
        }
        
        console.log('Return visitor final URL:', baseUrl);
        console.log('Redirecting return visitor...');
        
        window.location.href = baseUrl;
        return true;
    }
    
    return false;
}

// Mark user as visited
function markAsVisited() {
    localStorage.setItem('blowersVisited', 'true');
    localStorage.setItem('blowersVisitTime', new Date().getTime());
}

// Clear visitor data (for testing - can be called from browser console)
function clearVisitorData() {
    localStorage.removeItem('blowersVisited');
    localStorage.removeItem('blowersVisitTime');
    console.log('Visitor data cleared');
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        // Track slide progression
        trackEvent('Slide Transition', {
            from: currentSlide,
            to: currentSlide + 1,
            slideProgress: `${currentSlide}/${totalSlides}`
        });
        
        // Hide current slide
        document.getElementById(`slide${currentSlide}`).classList.remove('active');
        
        // Show next slide
        currentSlide++;
        document.getElementById(`slide${currentSlide}`).classList.add('active');
    }
}

function nextSlideWithEmail() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    
    // Check if email is valid
    if (email && isValidEmail(email)) {
        // Track email input
        trackEvent('Email Entered', {
            emailDomain: email.split('@')[1] || 'unknown',
            slideNumber: currentSlide
        });
        
        // Save email to localStorage
        localStorage.setItem('userEmail', email);
        nextSlide();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Email input validation for slide 3
document.addEventListener('DOMContentLoaded', function() {
    // Check for return visitor first
    if (checkReturnVisitor()) {
        return; // Will redirect, no need to continue
    }
    
    // Track first-time visitor
    const params = getUrlParams();
    trackEvent('First Time Visitor', {
        hasTrafficParams: !!(params.subid || params.clickid || params.subid2),
        subid: params.subid ? 'yes' : 'no',
        clickid: params.clickid ? 'yes' : 'no'
    });
    
    const emailInput = document.getElementById('emailInput');
    const continueBtn = document.getElementById('continueBtn3');
    
    if (emailInput && continueBtn) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            
            if (email && isValidEmail(email)) {
                continueBtn.disabled = false;
                continueBtn.classList.remove('disabled');
            } else {
                continueBtn.disabled = true;
                continueBtn.classList.add('disabled');
            }
        });
    }
});

function redirectToSite() {
    console.log('redirectToSite() called');
    markAsVisited();
    
    const savedEmail = localStorage.getItem('userEmail');
    console.log('Saved email:', savedEmail);
    
    let baseUrl;
    if (PASS_DATA) {
        const params = getUrlParams();
        console.log('URL params:', params);
        
        trackEvent('Completed Journey', {
            hasEmail: !!savedEmail,
            emailDomain: savedEmail ? savedEmail.split('@')[1] : 'none',
            hasTrafficParams: !!(params.subid || params.clickid || params.subid2),
            completedAllSlides: currentSlide === totalSlides
        });
        
        baseUrl = `https://bldnw.online/hqgVLv?sub_id_1=sk46&clickid=${params.clickid}&subid=${params.subid}&subid2=${params.subid2}`;

        if (savedEmail) {
            const encodedEmail = encodeEmailToBase64(savedEmail);
            console.log('Encoded email:', encodedEmail);
            baseUrl += `&_fData=${encodedEmail}`;
        }

    } else {
        trackEvent('Completed Journey', {
            dataPassingDisabled: true,
            completedAllSlides: currentSlide === totalSlides
        });
        
        baseUrl = 'https://bldnw.online/hqgVLv?sub_id_1=sk46&clickid={clickid}&subid={subid}&subid2={subid2}&_fData={_fData}';
    }
    
    console.log('Final URL:', baseUrl);
    console.log('Redirecting...');
    
    window.location.href = baseUrl;
}

// Touch/swipe functionality for mobile
let startX = 0;
let startY = 0;

document.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    if (!startX || !startY) {
        return;
    }

    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;

    let diffX = startX - endX;
    let diffY = startY - endY;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Swipe left (next slide)
        if (diffX > 50 && currentSlide < totalSlides) {
            nextSlide();
        }
    }

    startX = 0;
    startY = 0;
});

// Prevent scroll on mobile
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentSlide < totalSlides) {
            nextSlide();
        } else if (currentSlide === totalSlides) {
            redirectToSite();
        }
    }
});
