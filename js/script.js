let currentStep = 1;
const totalSteps = 4;

function generateClickId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `click_${timestamp}_${random}`;
}

function getOrCreateClickId() {
  const storedClickId = localStorage.getItem('clickId');
  if (storedClickId) {
    return storedClickId;
  } else {
    const newClickId = generateClickId();
    localStorage.setItem('clickId', newClickId);
    return newClickId;
  }
}

function resetClickId() {
  localStorage.removeItem('clickId');
  userClickId = getOrCreateClickId();
  console.log('Click ID reset. New click ID:', userClickId);
}

let userClickId = getOrCreateClickId();


document.addEventListener("DOMContentLoaded", function () {
  showStep(1);
});

function showStep(stepNumber) {
  for (let i = 1; i <= totalSteps; i++) {
    const el = document.getElementById(`step${i}`);
    if (!el) continue;
    if (i === stepNumber) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  }
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight" || event.key === "Enter") {
    nextStep();
  } else if (event.key === "ArrowLeft") {
    prevStep();
  }
});

const email = document.getElementById("email");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submitBtn");

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function updateState() {
  const val = email.value.trim();

  if (val === "") {
    submitBtn.disabled = true;
    msg.textContent = "";
    msg.classList.remove("visible");
    email.classList.remove("invalid");
    email.setCustomValidity("");
    return;
  }

  if (emailRegex.test(val)) {
    submitBtn.disabled = false;
    msg.textContent = "";
    msg.classList.remove("visible");
    email.classList.remove("invalid");
    email.setCustomValidity("");
  } else {
    submitBtn.disabled = true;
    msg.textContent = "Invalid email format";
    msg.classList.add("visible");
    email.classList.add("invalid");
    email.setCustomValidity("Invalid email format");
  }
}

email.addEventListener("input", updateState);

email.addEventListener("blur", () => {
  if (email.value.trim() === "") {
    msg.textContent = "This field is required";
    msg.classList.add("visible");
    email.classList.add("invalid");
    submitBtn.disabled = true;
    email.setCustomValidity("This field is required");
  } else {
    updateState();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  email.value = "";
  msg.textContent = "";
  msg.classList.remove("visible");
  email.classList.remove("invalid");
  submitBtn.disabled = true;
  email.setCustomValidity("");
  email.setAttribute("autocomplete", "off");
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    email.value = "";
    msg.textContent = "";
    msg.classList.remove("visible");
    email.classList.remove("invalid");
    submitBtn.disabled = true;
    email.setCustomValidity("");
  }
});

function redirectWithEmail() {
  const value = email.value.trim();
  if (!emailRegex.test(value)) {
    return;
  }

  const jsonString = JSON.stringify({ email: value });
  const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

  const urlParams = new URLSearchParams(window.location.search);
  const subid = urlParams.get('subid') || '{subid}';
  const clickid = userClickId;
  const subid2 = urlParams.get('subid2') || '{subid2}';

  console.log('clickid:', clickid);
  
  

  const targetUrl =
    "https://ef-to-wz.com/tds/ae?tds_campaign=s7788kru&tdsId=s7788kru_r&s1=int&utm_source=int&utm_term=6&p7={p7}&_fData=" +
    encodeURIComponent(base64Data) +
    "&affid=cf9f103c&subid=" + subid + "&clickid=" + clickid + "&subid2=" + subid2;
  window.location.href = targetUrl;
}

submitBtn.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (email.checkValidity()) {
    redirectWithEmail();
  } else {
    updateState();
  }
});

const innerLink = document.querySelector(".link");
if (innerLink) {
  innerLink.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (email.checkValidity()) {
      redirectWithEmail();
    } else {
      updateState();
    }
  });
}
