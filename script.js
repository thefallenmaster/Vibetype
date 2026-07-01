const textDisplay = document.getElementById('text-display');
const hiddenInput = document.getElementById('hidden-input');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const restartBtn = document.getElementById('restart-btn');

// Video elements
const videoSetup = document.getElementById('video-setup');
const videoSection = document.getElementById('video-section');
const mainVideo = document.getElementById('main-video');
const videoUrlInput = document.getElementById('video-url');
const loadUrlBtn = document.getElementById('load-url-btn');
const videoUpload = document.getElementById('video-upload');
const changeVideoBtn = document.getElementById('change-video-btn');

let player;

document.addEventListener('DOMContentLoaded', () => {
    player = new Plyr('#main-video');
});

const dictionary = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", 
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", 
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", 
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", 
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", 
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", 
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", 
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", 
    "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

let words = [];
let wordElements = [];
let currentWordIndex = 0;
let currentCharIndex = 0;

let isTyping = false;
let startTime = null;
let timer = null;
let totalTyped = 0;
let correctTyped = 0;

// --- Video Setup Logic ---

function loadVideo(src) {
    if (player) {
        player.source = {
            type: 'video',
            sources: [
                {
                    src: src,
                }
            ]
        };
    } else {
        mainVideo.src = src;
    }
    
    videoSetup.style.display = 'none';
    videoSection.style.display = 'block';
    
    if (player) {
        player.play().catch(e => console.log("Autoplay prevented:", e));
    }
    hiddenInput.focus();
}

loadUrlBtn.addEventListener('click', () => {
    const url = videoUrlInput.value.trim();
    if (url) {
        loadVideo(url);
    }
});

videoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileUrl = URL.createObjectURL(file);
        loadVideo(fileUrl);
    }
});

changeVideoBtn.addEventListener('click', () => {
    if (player) {
        player.pause();
    } else {
        mainVideo.pause();
    }
    videoSection.style.display = 'none';
    videoSetup.style.display = 'block';
    videoUpload.value = '';
    videoUrlInput.value = '';
});

// --- Typing Test Logic ---

function generateWords(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(dictionary[Math.floor(Math.random() * dictionary.length)]);
    }
    return result;
}

function initTest() {
    currentWordIndex = 0;
    currentCharIndex = 0;
    isTyping = false;
    startTime = null;
    totalTyped = 0;
    correctTyped = 0;
    
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    wpmElement.innerText = "0";
    accuracyElement.innerText = "100%";
    hiddenInput.value = "";
    
    // Generate 50 words
    words = generateWords(50);
    
    renderText();
    if (videoSection.style.display !== 'none') {
        hiddenInput.focus();
    }
}

function renderText() {
    textDisplay.innerHTML = '';
    wordElements = [];
    
    words.forEach((word) => {
        const wordEl = document.createElement('div');
        wordEl.classList.add('word');
        
        const chars = word.split('');
        chars.forEach((char) => {
            const charEl = document.createElement('span');
            charEl.classList.add('char');
            charEl.innerText = char;
            wordEl.appendChild(charEl);
        });
        
        textDisplay.appendChild(wordEl);
        wordElements.push(wordEl);
    });
    
    updateActiveChar();
    textDisplay.scrollTop = 0;
}

function updateActiveChar() {
    document.querySelectorAll('.char.active').forEach(el => el.classList.remove('active'));
    
    if (currentWordIndex < words.length) {
        const currentWordEl = wordElements[currentWordIndex];
        const chars = currentWordEl.querySelectorAll('.char');
        
        if (currentCharIndex < chars.length) {
            chars[currentCharIndex].classList.add('active');
        } else if (currentCharIndex === chars.length) {
            const spaceEl = document.createElement('span');
            spaceEl.classList.add('char', 'active', 'space-char');
            spaceEl.style.width = '0.5ch'; 
            currentWordEl.appendChild(spaceEl);
        }
    }
}

function startTimer() {
    if (isTyping) return;
    isTyping = true;
    startTime = Date.now();
    
    timer = setInterval(() => {
        calculateStats();
    }, 1000);
}

function calculateStats() {
    if (!startTime) return;
    
    const timeElapsedMs = Date.now() - startTime;
    const minutesElapsed = timeElapsedMs / 60000;
    
    if (minutesElapsed > 0) {
        const wpm = Math.round((correctTyped / 5) / minutesElapsed);
        wpmElement.innerText = wpm > 0 ? wpm : 0;
    }
    
    if (totalTyped > 0) {
        const accuracy = Math.round((correctTyped / totalTyped) * 100);
        accuracyElement.innerText = `${accuracy}%`;
    }
}

function smoothScroll() {
    if (currentWordIndex >= wordElements.length) return;
    
    const currentWordEl = wordElements[currentWordIndex];
    // Keep active line visible (preferably middle of the 3 lines)
    // Each line is ~40px. 
    if (currentWordEl.offsetTop > textDisplay.scrollTop + 40) {
        textDisplay.scrollTop = currentWordEl.offsetTop - 40;
    } else if (currentWordEl.offsetTop < textDisplay.scrollTop) {
        textDisplay.scrollTop = currentWordEl.offsetTop;
    }
}

hiddenInput.addEventListener('input', (e) => {
    startTimer();
    
    const inputVal = hiddenInput.value;
    hiddenInput.value = ''; 
    
    if (!inputVal) return;
    
    if (e.inputType === 'deleteContentBackward') {
        handleBackspace();
        return;
    }
    
    const charTyped = inputVal[inputVal.length - 1];
    
    if (currentWordIndex >= words.length - 10) {
        const newWords = generateWords(20);
        words = words.concat(newWords);
        
        newWords.forEach((word) => {
            const wordEl = document.createElement('div');
            wordEl.classList.add('word');
            
            const chars = word.split('');
            chars.forEach((char) => {
                const charEl = document.createElement('span');
                charEl.classList.add('char');
                charEl.innerText = char;
                wordEl.appendChild(charEl);
            });
            
            textDisplay.appendChild(wordEl);
            wordElements.push(wordEl);
        });
    }
    
    const currentWord = words[currentWordIndex];
    const currentWordEl = wordElements[currentWordIndex];
    const chars = currentWordEl.querySelectorAll('.char:not(.space-char)');
    
    if (charTyped === ' ') {
        if (currentCharIndex > 0) {
            currentWordIndex++;
            currentCharIndex = 0;
            const spaceChar = currentWordEl.querySelector('.space-char');
            if (spaceChar) spaceChar.remove();
            
            smoothScroll();
        }
    } else {
        if (currentCharIndex < currentWord.length) {
            const expectedChar = currentWord[currentCharIndex];
            const charEl = chars[currentCharIndex];
            
            totalTyped++;
            if (charTyped === expectedChar) {
                charEl.classList.add('correct');
                correctTyped++;
            } else {
                charEl.classList.add('incorrect');
            }
            currentCharIndex++;
        } else {
            const extraChar = document.createElement('span');
            extraChar.classList.add('char', 'incorrect', 'extra');
            extraChar.innerText = charTyped;
            currentWordEl.appendChild(extraChar);
            currentCharIndex++;
            totalTyped++;
        }
    }
    
    updateActiveChar();
    calculateStats();
});

hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        e.preventDefault(); 
        handleBackspace();
    }
});

function handleBackspace() {
    if (currentWordIndex === 0 && currentCharIndex === 0) return;
    
    const currentWordEl = wordElements[currentWordIndex];
    const spaceChar = currentWordEl.querySelector('.space-char');
    if (spaceChar) spaceChar.remove();
    
    if (currentCharIndex === 0) {
        currentWordIndex--;
        const prevWordEl = wordElements[currentWordIndex];
        const chars = prevWordEl.querySelectorAll('.char:not(.space-char)');
        currentCharIndex = chars.length;
        
        const extraChars = prevWordEl.querySelectorAll('.extra');
        currentCharIndex += extraChars.length;
        smoothScroll();
    } else {
        currentCharIndex--;
        const chars = currentWordEl.querySelectorAll('.char:not(.space-char)');
        if (currentCharIndex >= words[currentWordIndex].length) {
            const extraChars = currentWordEl.querySelectorAll('.extra');
            if (extraChars.length > 0) {
                extraChars[extraChars.length - 1].remove();
            }
        } else {
            const charEl = chars[currentCharIndex];
            if (charEl.classList.contains('correct')) {
                correctTyped--;
            }
            charEl.classList.remove('correct', 'incorrect');
        }
    }
    updateActiveChar();
    calculateStats();
}

textDisplay.addEventListener('click', () => {
    hiddenInput.focus();
});

restartBtn.addEventListener('click', () => {
    initTest();
});

// Global Shortcuts and Auto-focus
document.addEventListener('keydown', (e) => {
    // Ignore if typing in URL input
    if (document.activeElement === videoUrlInput) return;
    
    // Shortcut: Escape -> Restart
    if (e.key === 'Escape') {
        e.preventDefault();
        initTest();
        return;
    }
    
    // Shortcut: Alt + C -> Change Video
    if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        changeVideoBtn.click();
        return;
    }

    // Auto-capture typing: focus hidden input automatically
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // If it's a standard letter/number, backspace, or space
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') {
            if (document.activeElement !== hiddenInput) {
                hiddenInput.focus();
            }
        }
    }
});

initTest();
