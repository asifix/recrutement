const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_super_securise_changez_moi';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$V5DLv6.5q7.8Q9p0q1r2.uJkLmNpPqRrSsTtUvVwXyZzA1B2C3D4E';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Chemins des fichiers de données
const DATA_DIR = 'data';
const CANDIDATES_FILE = path.join(DATA_DIR, 'candidates.json');
const OFFER_FILE = path.join(DATA_DIR, 'offer.json');
const ABOUT_FILE = path.join(DATA_DIR, 'about.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Initialisation des fichiers de données
async function initializeDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir('uploads', { recursive: true });

    // Fichier des candidats
    try {
      await fs.access(CANDIDATES_FILE);
    } catch {
      await fs.writeFile(CANDIDATES_FILE, JSON.stringify([], null, 2));
    }

    // Fichier de l'offre d'emploi
    try {
      await fs.access(OFFER_FILE);
    } catch {
      const defaultOffer = {
        "title": "Program Coordinator (Education & Volunteer Management)",
        "content": "Umoja Wetu recherche un/e Program Coordinator pour diriger la conception, la mise en œuvre et la supervision des programmes éducatifs et des activités de gestion de volontaires. Le/la titulaire du poste travaillera en étroite collaboration avec les partenaires locaux, bénévoles et la direction pour assurer l'impact et la qualité du programme.",
        "requirements": [
          "Diplôme en éducation, gestion de projet, sciences sociales ou équivalent",
          "Minimum 2 ans d'expérience en coordination de programmes ou gestion de volontaires",
          "Capacités de leadership, communication et organisationnelles",
          "Disponibilité pour travailler sur le terrain à Bukavu",
          "Maîtrise du français et idéalement des langues locales",
          "Sensibilité aux enjeux humanitaires et communautaires"
        ],
        "location": "Bukavu, République Démocratique du Congo",
        "contract": "Contrat local selon expérience",
        "startDate": "Dès que possible",
        "date": new Date().toISOString()
      };
      await fs.writeFile(OFFER_FILE, JSON.stringify(defaultOffer, null, 2));
    }

    // Fichier À propos
    try {
      await fs.access(ABOUT_FILE);
    } catch {
      const defaultAbout = {
        "content": "Umoja Wetu est une organisation humanitaire fondée en 2022 par Monsieur Baraka Mubalama Masumbuko. Notre mission est d'unir toutes les personnes, indépendamment de leur classe sociale ou de leur état de santé, pour promouvoir l'inclusion, l'accès à l'éducation et l'engagement citoyen. Basés à Bukavu, nous développons des programmes d'éducation, de santé communautaire et d'engagement volontaire.",
        "mission": "Unir les personnes, renforcer la dignité humaine.",
        "founder": "Baraka Mubalama Masumbuko",
        "founded": "2022",
        "location": "Bukavu, République Démocratique du Congo",
        "date": new Date().toISOString()
      };
      await fs.writeFile(ABOUT_FILE, JSON.stringify(defaultAbout, null, 2));
    }

    console.log('Fichiers de données initialisés avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des fichiers:', error);
  }
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalide' });
  }
};

// Routes API

// Soumission de candidature
app.post('/api/submit', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'carteElecteur', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nom, email, telephone, message } = req.body;
    
    if (!nom || !email || !telephone) {
      return res.status(400).json({ error: 'Nom, email et téléphone sont obligatoires' });
    }

    const candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, 'utf8'));
    
    const newCandidate = {
      id: Date.now().toString(),
      nom,
      email,
      telephone,
      message: message || '',
      cvFile: req.files?.cv ? req.files.cv[0].filename : null,
      carteElecteurFile: req.files?.carteElecteur ? req.files.carteElecteur[0].filename : null,
      date: new Date().toISOString(),
      status: 'nouveau'
    };

    candidates.push(newCandidate);
    await fs.writeFile(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));

    res.json({ 
      success: true, 
      message: 'Candidature envoyée avec succès',
      candidateId: newCandidate.id
    });
  } catch (error) {
    console.error('Erreur soumission candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la candidature' });
  }
});

// Login admin - VERSION CORRIGEE
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Tentative de connexion:', { username, password: '***' });
    
    // Solution temporaire : mot de passe en clair pour debug
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000 // 12 heures
      });

      res.json({ success: true, message: 'Connexion réussie' });
    } else {
      console.log('Échec connexion - Username:', username, 'Password attendu: admin123');
      res.status(401).json({ error: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
});

// Logout admin
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Déconnexion réussie' });
});

// Vérification auth
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

// Récupérer les candidatures
app.get('/api/admin/candidates', authenticateToken, async (req, res) => {
  try {
    const candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, 'utf8'));
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture candidatures' });
  }
});

// Exporter CSV
app.get('/api/admin/export-csv', authenticateToken, async (req, res) => {
  try {
    const candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, 'utf8'));
    
    let csv = 'ID,Nom,Email,Téléphone,Date,Status\n';
    candidates.forEach(candidate => {
      csv += `"${candidate.id}","${candidate.nom}","${candidate.email}","${candidate.telephone}","${new Date(candidate.date).toLocaleDateString()}","${candidate.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidatures.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Erreur export CSV' });
  }
});

// Mettre à jour le statut
app.put('/api/admin/candidates/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, 'utf8'));
    const candidateIndex = candidates.findIndex(c => c.id === id);

    if (candidateIndex === -1) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }

    candidates[candidateIndex].status = status;
    await fs.writeFile(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));

    res.json({ success: true, candidate: candidates[candidateIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour statut' });
  }
});

// Obtenir l'offre d'emploi
app.get('/api/offer', async (req, res) => {
  try {
    const offer = JSON.parse(await fs.readFile(OFFER_FILE, 'utf8'));
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture offre' });
  }
});

// Mettre à jour l'offre d'emploi
app.put('/api/admin/offer', authenticateToken, async (req, res) => {
  try {
    const { title, content, requirements, location, contract, startDate } = req.body;
    
    const offer = {
      title,
      content,
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      location: location || "Bukavu, République Démocratique du Congo",
      contract: contract || "Contrat local selon expérience",
      startDate: startDate || "Dès que possible",
      date: new Date().toISOString()
    };

    await fs.writeFile(OFFER_FILE, JSON.stringify(offer, null, 2));
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour offre' });
  }
});

// Obtenir le texte À propos
app.get('/api/about', async (req, res) => {
  try {
    const about = JSON.parse(await fs.readFile(ABOUT_FILE, 'utf8'));
    res.json(about);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lecture about' });
  }
});

// Mettre à jour le texte À propos
app.put('/api/admin/about', authenticateToken, async (req, res) => {
  try {
    const { content, mission, founder, founded, location } = req.body;
    
    const about = {
      content,
      mission,
      founder: founder || "Baraka Mubalama Masumbuko",
      founded: founded || "2022",
      location: location || "Bukavu, République Démocratique du Congo",
      date: new Date().toISOString()
    };

    await fs.writeFile(ABOUT_FILE, JSON.stringify(about, null, 2));
    res.json({ success: true, about });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour about' });
  }
});

// Route pour servir l'application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
async function startServer() {
  await initializeDataFiles();
  
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📧 Plateforme de recrutement Umoja Wetu opérationnelle`);
  });
}

startServer().catch(console.error);
