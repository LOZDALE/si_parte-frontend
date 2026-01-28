/**
 * app.js - Gestione Quiz
 * Posizione: /frontend/assets/js/app.js
 */
const API_BASE = window.API_BASE || 'http://localhost:8000/api.php';

let quizData = [];
let userAnswers = [];
let currentQuestion = 0;
let selectedPaese = null;
let phase1Complete = false;

// Paesaggi di background rotanti
const landscapes = [
  {
    image: 'assets/img/montagna.jpg',
    location: 'Montagna',
    where: 'Paesaggio Montano'
  },
  {
    image: 'assets/img/fiume.jpg',
    location: 'Fiume',
    where: 'Paesaggio Fluviale'
  },
  {
    image: 'assets/img/lago.jpg',
    location: 'Lago',
    where: 'Paesaggio Lacustre'
  },
  {
    image: 'assets/img/città.jpg',
    location: 'Città',
    where: 'Paesaggio Urbano'
  },
  {
    image: 'assets/img/collina.jpg',
    location: 'Collina',
    where: 'Paesaggio Collinare'
  },
  {
    image: 'assets/img/mare.jpg',
    location: 'Mare',
    where: 'Paesaggio Marino'
  }
];

let currentLandscapeIndex = 0;
let tooltipTimeout = null;

const elements = {
    home: document.getElementById('home'),
    quizContainer: document.getElementById('quizContainer'),
    resultsContainer: document.getElementById('resultsContainer'),
    questionTitle: document.getElementById('questionTitle'),
    questionText: document.getElementById('questionText'),
    answersContainer: document.getElementById('answersContainer'),
    progressFill: document.getElementById('progressFill'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('restartBtn'),
    startBtn: document.getElementById('startBtn')
};

document.addEventListener('DOMContentLoaded', () => {
    if (elements.startBtn) elements.startBtn.addEventListener('click', startQuiz);
    if (elements.nextBtn) elements.nextBtn.addEventListener('click', nextQuestion);
    if (elements.prevBtn) elements.prevBtn.addEventListener('click', prevQuestion);
    if (elements.restartBtn) elements.restartBtn.addEventListener('click', () => location.reload());
    
    // Inizializza il background carousel
    initializeBackgroundCarousel();
    loadInitialData();
});

async function loadInitialData() {
    try {
        const res = await fetch(`${API_BASE}?route=quiz/questions`);
        if (!res.ok) throw new Error("Risposta server non valida");
        quizData = await res.json();
        console.log("Quiz caricato!");
    } catch (err) {
        console.error("Errore critico:", err);
    }
}

function initializeBackgroundCarousel() {
    const carousel = document.getElementById('backgroundCarousel');
    if (!carousel) return;

    // Carica l'immagine iniziale randomica
    currentLandscapeIndex = Math.floor(Math.random() * landscapes.length);
    loadBackgroundImage(currentLandscapeIndex);

    // Gestisci il tooltip al passaggio del mouse
    carousel.addEventListener('mouseenter', () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
            showLocationTooltip();
        }, 2000);
    });

    carousel.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeout);
        hideLocationTooltip();
    });
}

function loadBackgroundImage(index) {
    const imageDiv = document.querySelector('.background-image');
    if (imageDiv) {
        imageDiv.style.backgroundImage = `url('${landscapes[index].image}')`;
        imageDiv.dataset.location = landscapes[index].location;
        imageDiv.dataset.where = landscapes[index].where;
        imageDiv.classList.add('active');
        
        // Aggiorna il location-info permanente
        const locationName = document.getElementById('locationName');
        const locationWhere = document.getElementById('locationWhere');
        if (locationName) locationName.textContent = landscapes[index].location;
        if (locationWhere) locationWhere.textContent = landscapes[index].where;
    }
}

function showLocationTooltip() {
    const tooltip = document.querySelector('.location-tooltip');
    if (tooltip) {
        const location = landscapes[currentLandscapeIndex].location;
        const where = landscapes[currentLandscapeIndex].where;
        tooltip.innerHTML = `<strong>${location}</strong><br/>${where}`;
        tooltip.style.opacity = '1';
    }
}

function hideLocationTooltip() {
    const tooltip = document.querySelector('.location-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

function startQuiz() {
    if (!quizData || quizData.length === 0) {
        alert("Caricamento in corso... riprova tra qualche secondo.");
        return;
    }
    currentQuestion = 0;
    phase1Complete = false;
    userAnswers = new Array(quizData.length).fill(null);
    if (elements.home) elements.home.style.display = 'none';
    elements.quizContainer.classList.remove('hidden');
    loadQuestion();
}

function loadQuestion() {
    const question = quizData[currentQuestion];
    elements.questionTitle.textContent = `Domanda ${currentQuestion + 1} di ${quizData.length}`;
    elements.questionText.textContent = question.question;
    elements.progressFill.style.width = `${((currentQuestion + 1) / quizData.length) * 100}%`;
    elements.answersContainer.innerHTML = '';

    question.answers.forEach((ans, i) => {
        const btn = document.createElement('div');
        btn.className = `answer-option ${userAnswers[currentQuestion] === i ? 'selected' : ''}`;
        btn.textContent = ans.text;
        btn.onclick = () => { userAnswers[currentQuestion] = i; loadQuestion(); };
        elements.answersContainer.appendChild(btn);
    });

    elements.prevBtn.disabled = currentQuestion === 0;
    if (currentQuestion === 2 && !phase1Complete) {
        elements.nextBtn.textContent = 'Scopri il Paese';
    } else {
        elements.nextBtn.textContent = currentQuestion === quizData.length - 1 ? 'Vedi Risultato' : 'Prossima';
    }
}

function prevQuestion() { if (currentQuestion > 0) { currentQuestion--; loadQuestion(); } }

async function nextQuestion() {
    if (userAnswers[currentQuestion] === null) return alert("Scegli una risposta!");
    if (currentQuestion === 2 && !phase1Complete) {
        await handleSelectPaese();
    } else if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        loadQuestion();
    } else {
        await handleFinalSubmit();
    }
}

async function handleSelectPaese() {
    try {
        const res = await fetch(`${API_BASE}?route=quiz/select-paese`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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
    elements.quizContainer.classList.add('hidden');
    let container = document.getElementById('paeseResult') || document.createElement('div');
    container.id = 'paeseResult';
    container.className = 'card p-4 text-center my-4';
    elements.quizContainer.parentNode.insertBefore(container, elements.resultsContainer);
    container.innerHTML = `<h2>Paese ideale: ${selectedPaese.nome}</h2><p>${selectedPaese.descrizione || ''}</p>
                           <button onclick="window.contQuiz()" class="btn btn-primary">Personalizza Città</button>`;
    window.contQuiz = () => { container.classList.add('hidden'); elements.quizContainer.classList.remove('hidden'); currentQuestion++; loadQuestion(); };
}

async function handleFinalSubmit() {
    try {
        const res = await fetch(`${API_BASE}?route=quiz/submit`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answers: userAnswers, paese_id: selectedPaese?.id })
        });
        const data = await res.json();
        elements.quizContainer.classList.add('hidden');
        elements.resultsContainer.classList.remove('hidden');
        const d = data.recommended_destination || {name: "Fine del viaggio", description: "Grazie per aver partecipato!"};
        document.getElementById('destinationName').textContent = d.name;
        document.getElementById('destinationDescription').textContent = d.description;
    } catch (err) { console.error(err); }
}