const API_BASE = window.API_BASE || 'http://localhost:8000/api.php';

let quizData = [];
let userAnswers = [];
let currentQuestion = 0;
let selectedPaese = null;
let phase1Complete = false;

// Paesaggi di background
const landscapes = [
    { image: 'assets/img/montagna.jpg', location: 'Montagna', where: 'Paesaggio Montano' },
    { image: 'assets/img/fiume.jpg', location: 'Fiume', where: 'Paesaggio Fluviale' },
    { image: 'assets/img/lago.jpg', location: 'Lago', where: 'Paesaggio Lacustre' },
    { image: 'assets/img/città.jpg', location: 'Città', where: 'Paesaggio Urbano' },
    { image: 'assets/img/collina.jpg', location: 'Collina', where: 'Paesaggio Collinare' },
    { image: 'assets/img/mare.jpg', location: 'Mare', where: 'Paesaggio Marino' }
];

let currentLandscapeIndex = 0;

const elements = {
    home: document.getElementById('home'),
    quizContainer: document.getElementById('quizContainer'),
    paeseResult: document.getElementById('paeseResult'),
    resultsContainer: document.getElementById('resultsContainer'),
    questionTitle: document.getElementById('questionTitle'),
    questionText: document.getElementById('questionText'),
    answersContainer: document.getElementById('answersContainer'),
    progressFill: document.getElementById('progressFill'),
    prevBtn: document.getElementById('prevBtn'),
    restartBtn: document.getElementById('restartBtn'),
    startBtn: document.getElementById('startBtn'),
    contQuizBtn: document.getElementById('contQuizBtn')
};

document.addEventListener('DOMContentLoaded', () => {
    if (elements.startBtn) elements.startBtn.addEventListener('click', startQuiz);
    if (elements.prevBtn) elements.prevBtn.addEventListener('click', prevQuestion);
    if (elements.restartBtn) elements.restartBtn.addEventListener('click', () => location.reload());
    if (elements.contQuizBtn) elements.contQuizBtn.addEventListener('click', continueQuiz);

    initializeBackgroundCarousel();
    loadInitialData();
    setupMobileMenu();
});

function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            toggle.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    }
}

async function loadInitialData() {
    try {
        const res = await fetch(`${API_BASE}?route=quiz/questions`);
        if (!res.ok) throw new Error("Risposta server non valida");
        quizData = await res.json();
    } catch (err) {
        console.error("Errore caricamento dati:", err);
    }
}

function initializeBackgroundCarousel() {
    currentLandscapeIndex = Math.floor(Math.random() * landscapes.length);
    loadBackgroundImage(currentLandscapeIndex);
}

function loadBackgroundImage(index) {
    const imageDiv = document.querySelector('.background-image');
    if (imageDiv) {
        imageDiv.style.backgroundImage = `url('${landscapes[index].image}')`;
        imageDiv.classList.add('active');
    }
}

function startQuiz() {
    if (!quizData || quizData.length === 0) {
        alert("Caricamento in corso...");
        return;
    }
    currentQuestion = 0;
    phase1Complete = false;
    userAnswers = new Array(quizData.length).fill(null);
    if (elements.home) elements.home.style.display = 'none';
    elements.startBtn.classList.add('hidden');
    elements.quizContainer.classList.remove('hidden');
    loadQuestion();
}

function loadQuestion() {
    const question = quizData[currentQuestion];
    elements.questionTitle.textContent = `Fase ${currentQuestion < 3 ? '1' : '2'} • Domanda ${currentQuestion + 1}/${quizData.length}`;
    elements.questionText.textContent = question.question;
    elements.progressFill.style.width = `${((currentQuestion + 1) / quizData.length) * 100}%`;
    elements.answersContainer.innerHTML = '';

    question.answers.forEach((ans, i) => {
        const div = document.createElement('div');
        div.className = `answer-option ${userAnswers[currentQuestion] === i ? 'selected' : ''}`;
        div.textContent = ans.text;
        div.onclick = () => {
            userAnswers[currentQuestion] = i;
            loadQuestion();
            // Auto-next after a short delay for better UX
            setTimeout(nextQuestion, 400);
        };
        elements.answersContainer.appendChild(div);
    });

    // Mostra il tasto "Indietro" solo dalla seconda domanda in poi
    if (elements.prevBtn) {
        if (currentQuestion === 0) {
            elements.prevBtn.style.display = 'none';
        } else {
            elements.prevBtn.style.display = 'inline-block';
        }
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

async function nextQuestion() {
    if (userAnswers[currentQuestion] === null) return; // Non alertare se clicca troppo veloce

    if (currentQuestion === 2 && !phase1Complete) {
        await handleSelectPaese();
    } else if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        loadQuestion();
    } else if (currentQuestion === quizData.length - 1) {
        await handleFinalSubmit();
    }
}

async function handleSelectPaese() {
    try {
        elements.quizContainer.classList.add('hidden');
        const res = await fetch(`${API_BASE}?route=quiz/select-paese`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: userAnswers.slice(0, 3) })
        });
        const data = await res.json();
        if (data.success) {
            selectedPaese = data.paese_selezionato;
            phase1Complete = true;
            showPaeseResult();
        }
    } catch (err) { console.error(err); }
}

function showPaeseResult() {
    document.getElementById('paeseName').textContent = selectedPaese.nome;
    document.getElementById('paeseDescription').textContent = selectedPaese.descrizione;
    const flagImg = document.getElementById('paeseFlag');
    if (selectedPaese.flag) {
        flagImg.src = selectedPaese.flag;
        flagImg.classList.remove('hidden');
    } else {
        flagImg.classList.add('hidden');
    }
    elements.paeseResult.classList.remove('hidden');
}

function continueQuiz() {
    elements.paeseResult.classList.add('hidden');
    elements.quizContainer.classList.remove('hidden');
    currentQuestion++;
    loadQuestion();
}

async function handleFinalSubmit() {
    try {
        elements.quizContainer.classList.add('hidden');
        const res = await fetch(`${API_BASE}?route=quiz/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: userAnswers, paese_id: selectedPaese?.id })
        });
        const data = await res.json();
        if (data.success) {
            const dest = data.recommended_destination;
            document.getElementById('destinationName').textContent = dest.name;
            document.getElementById('destinationDescription').textContent = dest.description;
            const cityFlag = document.getElementById('cityFlag');
            if (dest.flag) {
                cityFlag.src = dest.flag;
                cityFlag.classList.remove('hidden');
            } else {
                cityFlag.classList.add('hidden');
            }
            elements.resultsContainer.classList.remove('hidden');
        }
    } catch (err) { console.error(err); }
}
