// Script principal pour le frontend

// Configuration de l'API
const API_BASE = '';

// Gestion des pages
document.addEventListener('DOMContentLoaded', function() {
    // Page d'accueil
    if (document.getElementById('offer-content')) {
        loadOfferContent();
        loadAboutContent();
    }

    // Page de candidature
    if (document.getElementById('candidateForm')) {
        setupApplyForm();
    }

    // Page de login
    if (document.getElementById('loginForm')) {
        setupLoginForm();
    }

    // Page admin
    if (document.getElementById('candidatesTable')) {
        checkAdminAuth();
        setupAdminPage();
    }
});

// Charger le contenu de l'offre d'emploi
async function loadOfferContent() {
    try {
        const response = await fetch('/api/offer');
        const offer = await response.json();

        const offerContent = document.getElementById('offer-content');
        if (offerContent) {
            offerContent.innerHTML = `
                <div class="offer-hero-image">
                    <div class="offer-hero-content">
                        <h2>${offer.title}</h2>
                        <p>Rejoignez notre équipe humanitaire à Bukavu</p>
                    </div>
                </div>
                <div class="offer-card">
                    <div class="offer-meta">
                        <span><strong>📍 Lieu:</strong> ${offer.location}</span>
                        <span><strong>📄 Contrat:</strong> ${offer.contract}</span>
                        <span><strong>🚀 Démarrage:</strong> ${offer.startDate}</span>
                    </div>
                    <p>${offer.content}</p>
                    ${offer.requirements ? `
                        <h4>📋 Profil recherché :</h4>
                        <ul>
                            ${offer.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    ` : ''}
                    <div class="responsibilities">
                        <h4>🎯 Responsabilités principales :</h4>
                        <ul>
                            <li>Planifier, coordonner et superviser les activités éducatives</li>
                            <li>Recruter, former et encadrer les volontaires</li>
                            <li>Élaborer et suivre les indicateurs de performance et rapports</li>
                            <li>Assurer la liaison avec partenaires locaux et donateurs</li>
                        </ul>
                    </div>
                    <p class="offer-date">📅 Publié le ${new Date(offer.date).toLocaleDateString('fr-FR')}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement offre:', error);
    }
}

// Charger le contenu À propos
async function loadAboutContent() {
    try {
        const response = await fetch('/api/about');
        const about = await response.json();

        const aboutContent = document.getElementById('about-content');
        if (aboutContent) {
            aboutContent.innerHTML = `
                <div class="about-card">
                    <p>${about.content}</p>
                    <div class="about-details">
                        <div class="detail-item">
                            <strong>👤 Fondateur:</strong> ${about.founder}
                        </div>
                        <div class="detail-item">
                            <strong>📅 Fondée en:</strong> ${about.founded}
                        </div>
                        <div class="detail-item">
                            <strong>📍 Lieu:</strong> ${about.location}
                        </div>
                    </div>
                    ${about.mission ? `
                        <div class="mission-section">
                            <h4>Notre mission</h4>
                            <p class="mission">"${about.mission}"</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement about:', error);
    }
}

// Configuration du formulaire de candidature
function setupApplyForm() {
    const form = document.getElementById('candidateForm');
    const successMessage = document.getElementById('successMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);

            const response = await fetch('/api/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                form.style.display = 'none';
                successMessage.style.display = 'block';
            } else {
                alert('Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Erreur soumission:', error);
            alert('Erreur lors de l\'envoi de la candidature');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Configuration du formulaire de login
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Connexion...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const data = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/admin.html';
            } else {
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Erreur connexion:', error);
            errorMessage.style.display = 'block';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Vérification de l'authentification admin
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/verify');
        const result = await response.json();

        if (!result.authenticated) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        window.location.href = '/login.html';
    }
}

// Configuration de la page admin
function setupAdminPage() {
    // Navigation entre onglets
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Mettre à jour les boutons de navigation
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher l'onglet correspondant
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // Charger les données si nécessaire
            if (targetTab === 'candidates') {
                loadCandidates();
            } else if (targetTab === 'offer') {
                loadOfferForm();
            } else if (targetTab === 'about') {
                loadAboutForm();
            }
        });
    });

    // Bouton de déconnexion
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    });

    // Bouton d'export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', async function() {
        try {
            const response = await fetch('/api/admin/export-csv');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'candidatures-umoja-wetu.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur export CSV:', error);
        }
    });

    // Bouton d'actualisation
    document.getElementById('refreshBtn').addEventListener('click', loadCandidates);

    // Formulaire offre d'emploi
    document.getElementById('offerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateOffer();
    });

    // Formulaire À propos
    document.getElementById('aboutForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateAbout();
    });

    // Charger les données initiales
    loadCandidates();
    loadOfferForm();
    loadAboutForm();
}

// Charger les candidatures
async function loadCandidates() {
    try {
        const response = await fetch('/api/admin/candidates');
        const candidates = await response.json();

        updateCandidatesTable(candidates);
        updateStats(candidates);
    } catch (error) {
        console.error('Erreur chargement candidatures:', error);
    }
}

// Mettre à jour le tableau des candidatures
function updateCandidatesTable(candidates) {
    const tbody = document.getElementById('candidatesTableBody');
    
    tbody.innerHTML = candidates.map(candidate => `
        <tr>
            <td>${candidate.nom}</td>
            <td>${candidate.email}</td>
            <td>${candidate.telephone}</td>
            <td>${new Date(candidate.date).toLocaleDateString('fr-FR')}</td>
            <td>
                <select class="status-select" data-id="${candidate.id}">
                    <option value="nouveau" ${candidate.status === 'nouveau' ? 'selected' : ''}>Nouveau</option>
                    <option value="en-cours" ${candidate.status === 'en-cours' ? 'selected' : ''}>En cours</option>
                    <option value="termine" ${candidate.status === 'termine' ? 'selected' : ''}>Terminé</option>
                </select>
            </td>
            <td class="action-buttons">
                <button class="btn-primary btn-small view-candidate" data-id="${candidate.id}">Voir</button>
            </td>
        </tr>
    `).join('');

    // Gestion des changements de statut
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async function() {
            const candidateId = this.getAttribute('data-id');
            const newStatus = this.value;
            
            try {
                await fetch(`/api/admin/candidates/${candidateId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                
                loadCandidates(); // Recharger pour mettre à jour les stats
            } catch (error) {
                console.error('Erreur mise à jour statut:', error);
            }
        });
    });

    // Gestion de la visualisation des détails
    document.querySelectorAll('.view-candidate').forEach(btn => {
        btn.addEventListener('click', function() {
            const candidateId = this.getAttribute('data-id');
            showCandidateDetails(candidateId, candidates);
        });
    });
}

// Mettre à jour les statistiques
function updateStats(candidates) {
    document.getElementById('totalCandidates').textContent = candidates.length;
    document.getElementById('newCandidates').textContent = candidates.filter(c => c.status === 'nouveau').length;
    document.getElementById('pendingCandidates').textContent = candidates.filter(c => c.status === 'en-cours').length;
    document.getElementById('completedCandidates').textContent = candidates.filter(c => c.status === 'termine').length;
}

// Afficher les détails d'un candidat
function showCandidateDetails(candidateId, candidates) {
    const candidate = candidates.find(c => c.id === candidateId);
    const modal = document.getElementById('candidateModal');
    const details = document.getElementById('candidateDetails');

    details.innerHTML = `
        <div class="candidate-detail">
            <strong>Nom:</strong> ${candidate.nom}
        </div>
        <div class="candidate-detail">
            <strong>Email:</strong> ${candidate.email}
        </div>
        <div class="candidate-detail">
            <strong>Téléphone:</strong> ${candidate.telephone}
        </div>
        <div class="candidate-detail">
            <strong>Date:</strong> ${new Date(candidate.date).toLocaleString('fr-FR')}
        </div>
        <div class="candidate-detail">
            <strong>Statut:</strong> ${candidate.status}
        </div>
        ${candidate.message ? `
        <div class="candidate-detail">
            <strong>Message:</strong> ${candidate.message}
        </div>
        ` : ''}
        <div class="file-links">
            ${candidate.cvFile ? `<a href="/uploads/${candidate.cvFile}" target="_blank" class="file-link">📄 Voir le CV</a>` : ''}
            ${candidate.carteElecteurFile ? `<a href="/uploads/${candidate.carteElecteurFile}" target="_blank" class="file-link">🆔 Voir la pièce d'identité</a>` : ''}
        </div>
    `;

    modal.style.display = 'block';

    // Fermer le modal
    document.querySelector('.close').addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Charger le formulaire d'offre d'emploi
async function loadOfferForm() {
    try {
        const response = await fetch('/api/offer');
        const offer = await response.json();

        document.getElementById('offerTitle').value = offer.title || '';
        document.getElementById('offerLocation').value = offer.location || '';
        document.getElementById('offerContract').value = offer.contract || '';
        document.getElementById('offerStartDate').value = offer.startDate || '';
        document.getElementById('offerContent').value = offer.content || '';
        document.getElementById('offerRequirements').value = offer.requirements ? offer.requirements.join('\n') : '';
    } catch (error) {
        console.error('Erreur chargement offre:', error);
    }
}

// Mettre à jour l'offre d'emploi
async function updateOffer() {
    try {
        const title = document.getElementById('offerTitle').value;
        const location = document.getElementById('offerLocation').value;
        const contract = document.getElementById('offerContract').value;
        const startDate = document.getElementById('offerStartDate').value;
        const content = document.getElementById('offerContent').value;
        const requirements = document.getElementById('offerRequirements').value.split('\n').filter(req => req.trim());

        const response = await fetch('/api/admin/offer', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, requirements, location, contract, startDate })
        });

        const result = await response.json();

        if (result.success) {
            alert('Offre mise à jour avec succès!');
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur mise à jour offre:', error);
        alert('Erreur lors de la mise à jour');
    }
}

// Charger le formulaire À propos
async function loadAboutForm() {
    try {
        const response = await fetch('/api/about');
        const about = await response.json();

        document.getElementById('aboutContent').value = about.content || '';
        document.getElementById('aboutMission').value = about.mission || '';
        document.getElementById('aboutFounder').value = about.founder || '';
        document.getElementById('aboutFounded').value = about.founded || '';
        document.getElementById('aboutLocation').value = about.location || '';
    } catch (error) {
        console.error('Erreur chargement about:', error);
    }
}

// Mettre à jour le texte À propos
async function updateAbout() {
    try {
        const content = document.getElementById('aboutContent').value;
        const mission = document.getElementById('aboutMission').value;
        const founder = document.getElementById('aboutFounder').value;
        const founded = document.getElementById('aboutFounded').value;
        const location = document.getElementById('aboutLocation').value;

        const response = await fetch('/api/admin/about', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, mission, founder, founded, location })
        });

        const result = await response.json();

        if (result.success) {
            alert('Texte À propos mis à jour avec succès!');
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Erreur mise à jour about:', error);
        alert('Erreur lors de la mise à jour');
    }
}