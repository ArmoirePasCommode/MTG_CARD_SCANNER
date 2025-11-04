# Guide de configuration GCP/Firebase - MTG Card Scanner

Ce guide vous accompagne étape par étape pour configurer votre backend Firebase sur Google Cloud Platform.

## 📋 Prérequis

- Un compte Google (Gmail)
- Node.js 20+ installé sur votre machine
- npm ou yarn installé

---

## 🔧 Étape 1 : Installation des outils Firebase CLI

Ouvrez votre terminal (PowerShell sur Windows) et exécutez :

```bash
npm install -g firebase-tools
```

Vérifiez l'installation :

```bash
firebase --version
```

---

## 🔐 Étape 2 : Connexion à Firebase

Connectez-vous à votre compte Firebase :

```bash
firebase login
```

Cela ouvrira votre navigateur pour vous authentifier. Acceptez les permissions.

---

## 🆕 Étape 3 : Créer un projet Firebase dans la Console Web

**Option A : Via la Console Firebase (recommandé)**

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur **"Ajouter un projet"** ou **"Create a project"**
3. Entrez un nom de projet (ex: `mtg-card-scanner`)
4. Cliquez sur **"Continuer"**
5. **Désactivez** Google Analytics (ou gardez-le si vous le souhaitez) → **"Créer le projet"**
6. Attendez quelques secondes que le projet soit créé
7. Cliquez sur **"Continuer"**

**Option B : Via Firebase CLI**

```bash
firebase projects:create mtg-card-scanner --display-name "MTG Card Scanner"
```

---

## 🗂️ Étape 4 : Initialiser Firebase dans votre projet local

Dans le terminal, naviguez vers votre dossier projet :

```bash
cd C:\Users\eliot\Desktop\Ynov\MTG_CARD_SCANNER
```

Initialisez Firebase :

```bash
firebase init
```

**Répondez aux questions comme suit :**

1. **"Which Firebase features do you want to set up?"**
   - Sélectionnez **Functions** (espace pour cocher/décocher, Entrée pour valider)
   - Sélectionnez **Firestore** (si proposé)
   - Sélectionnez **Storage** (si proposé)
   - Puis **Entrée**

2. **"Please select an option"** → **"Use an existing project"**
   - Sélectionnez le projet que vous venez de créer (`mtg-card-scanner`)

3. **"What language would you like to use to write Cloud Functions?"** → **JavaScript**

4. **"Do you want to use ESLint?"** → **Yes** (ou No si vous préférez)

5. **"Do you want to install dependencies with npm now?"** → **Yes**

6. **"File functions/package.json already exists. Overwrite?"** → **No** (gardez le fichier existant)

7. **"Do you want to set up Firestore?"** → **Yes**

8. **"What file should be used for Firestore Rules?"** → Appuyez sur **Entrée** (par défaut)

9. **"What file should be used for Firestore indexes?"** → Appuyez sur **Entrée** (par défaut)

10. **"Do you want to set up Cloud Storage?"** → **Yes**

11. **"What file should be used for Storage Rules?"** → Appuyez sur **Entrée** (par défaut)

---

## 🌍 Étape 5 : Activer les APIs nécessaires dans GCP

### Option A : Via la Console GCP (recommandé pour débutants)

1. Allez sur https://console.cloud.google.com/
2. Sélectionnez votre projet (`mtg-card-scanner`) en haut à gauche
3. Allez dans **"APIs & Services"** → **"Library"** (ou "Bibliothèque")
4. Recherchez et activez une par une ces APIs :
   - **Cloud Functions API**
   - **Cloud Build API**
   - **Artifact Registry API**
   - **Cloud Run API**
   - **Cloud Firestore API**
   - **Cloud Storage API**
   - **Identity Toolkit API**

   Pour chaque API : Cliquez sur le nom → **"Activer"** ou **"Enable"**

### Option B : Via gcloud CLI (plus rapide si vous avez gcloud installé)

```bash
# Installer gcloud CLI si nécessaire : https://cloud.google.com/sdk/docs/install

gcloud config set project mtg-card-scanner
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable identitytoolkit.googleapis.com
```

---

## 🔥 Étape 6 : Configurer Firestore Database

1. Allez sur https://console.firebase.google.com/project/mtg-card-scanner/firestore
2. Cliquez sur **"Créer une base de données"** ou **"Create database"**
3. Choisissez **"Mode Natif"** (Native mode)
4. Sélectionnez la région **"europe-west1 (Belgium)"** (ou celle de votre choix)
5. Cliquez sur **"Suivant"** → **"Activer"**

⚠️ **Important** : Notez la région choisie. Si vous choisissez une autre région que `europe-west1`, modifiez la région dans `functions/index.js` :

```javascript
exports.api = functions
  .region('votre-region')  // Changez ici
  .https.onRequest(app);
```

---

## 📦 Étape 7 : Configurer Cloud Storage

1. Allez sur https://console.firebase.google.com/project/mtg-card-scanner/storage
2. Cliquez sur **"Commencer"** ou **"Get started"**
3. Lisez les règles de sécurité → **"Suivant"**
4. Choisissez la région **"europe-west1 (Belgium)"** (même région que Firestore)
5. Cliquez sur **"Terminé"** ou **"Done"**

Le bucket par défaut sera créé automatiquement (nom : `mtg-card-scanner.appspot.com` ou similaire).

### Configuration du bucket pour les URLs signées

1. Allez sur https://console.cloud.google.com/storage/browser
2. Cliquez sur votre bucket (ex: `mtg-card-scanner.appspot.com`)
3. Allez dans l'onglet **"Permissions"** ou **"Permissions"**
4. Vérifiez que **"Uniform bucket-level access"** est **ACTIVÉ** (recommandé pour les URLs signées)
5. Si ce n'est pas activé, cliquez sur **"Edit"** → Cochez **"Enable uniform bucket-level access"** → **"Save"**

---

## 🔑 Étape 8 : Configurer Firebase Authentication

1. Allez sur https://console.firebase.google.com/project/mtg-card-scanner/authentication
2. Cliquez sur **"Commencer"** ou **"Get started"**
3. Allez dans l'onglet **"Sign-in method"** ou **"Méthodes de connexion"**
4. Cliquez sur **"Email/Password"** → **"Activer"** → **"Enregistrer"**

Vous pouvez activer d'autres méthodes si nécessaire (Google, Apple, etc.).

---

## 👤 Étape 9 : Configurer les permissions IAM (Important pour les URLs signées)

Le compte de service des Cloud Functions doit avoir les permissions pour :
- Écrire dans Firestore
- Écrire dans Storage
- **Générer des URLs signées (nécessite Service Account Token Creator)**

### Via Console GCP :

1. Allez sur https://console.cloud.google.com/iam-admin/iam?project=mtg-card-scanner
2. Trouvez le compte de service de votre projet (format : `PROJECT_NUMBER-compute@developer.gserviceaccount.com` ou `PROJECT_ID@appspot.gserviceaccount.com`)
3. Cliquez sur l'icône crayon (Modifier) à droite
4. Cliquez sur **"Ajouter un autre rôle"** ou **"Add another role"**
5. Ajoutez ces rôles si absents :
   - **Storage Object Admin** (pour lire/écrire dans Storage)
   - **Service Account Token Creator** (pour générer des URLs signées)
   - **Cloud Datastore User** (pour Firestore, généralement déjà présent)

6. Cliquez sur **"Enregistrer"** ou **"Save"**

### Alternative : Via gcloud CLI

```bash
# Trouvez votre PROJECT_NUMBER
gcloud projects describe mtg-card-scanner --format="value(projectNumber)"

# Remplacez PROJECT_NUMBER dans la commande ci-dessous
gcloud projects add-iam-policy-binding mtg-card-scanner \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding mtg-card-scanner \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

---

## 💳 Étape 10 : Activer la facturation (Nécessaire pour Cloud Functions)

⚠️ **Important** : Cloud Functions nécessite le plan Blaze (pay-as-you-go) même pour les tests.

1. Allez sur https://console.firebase.google.com/project/mtg-card-scanner/usage/details
2. Cliquez sur **"Upgrade"** ou **"Passer au plan Blaze"**
3. Suivez les instructions pour activer la facturation

💡 **Note** : Vous avez un crédit gratuit de 300$ et un free tier généreux, donc pour un projet de test, vous ne devriez pas être facturé.

---

## 📝 Étape 11 : Configuration locale du projet

Dans votre terminal, liez votre projet local au projet Firebase :

```bash
firebase use mtg-card-scanner
```

Vérifiez la configuration :

```bash
firebase projects:list
```

Vous devriez voir votre projet avec un astérisque (*) indiquant qu'il est actif.

---

## 📦 Étape 12 : Installer les dépendances

Installez les dépendances npm dans le dossier functions :

```bash
cd functions
npm install
```

---

## 🚀 Étape 13 : Déployer les fonctions

Toujours dans le dossier `functions`, déployez :

```bash
npm run deploy
```

Ou depuis la racine du projet :

```bash
cd ..
firebase deploy --only functions
```

⏱️ **Cela peut prendre 2-5 minutes** la première fois.

Une fois terminé, vous verrez l'URL de votre API :

```
Function URL (api): https://europe-west1-mtg-card-scanner.cloudfunctions.net/api
```

📝 **Notez cette URL**, vous en aurez besoin dans votre application React Native.

---

## ✅ Étape 14 : Vérifier que tout fonctionne

### Test de santé

```bash
curl https://europe-west1-mtg-card-scanner.cloudfunctions.net/api/health
```

Vous devriez recevoir : `{"ok":true}`

### Test d'authentification (nécessite un token)

Vous pouvez tester avec Postman ou un autre outil, mais pour cela, vous aurez besoin d'un token Firebase Auth (généré côté client React Native).

---

## 🔍 Vérification finale

✅ Projet Firebase créé  
✅ Firebase CLI installé et connecté  
✅ Projet local initialisé avec `firebase init`  
✅ APIs GCP activées (Functions, Build, Storage, Firestore, Identity Toolkit)  
✅ Firestore créé en mode Natif  
✅ Storage bucket créé  
✅ Firebase Auth activé (Email/Password)  
✅ Permissions IAM configurées (Storage Object Admin + Service Account Token Creator)  
✅ Facturation activée (plan Blaze)  
✅ Dépendances installées (`npm install` dans `functions/`)  
✅ Fonctions déployées  

---

## 🐛 Dépannage

### Erreur : "Permission denied" lors du déploiement
→ Vérifiez que vous êtes bien connecté : `firebase login`

### Erreur : "API not enabled"
→ Retournez à l'étape 5 et activez toutes les APIs listées

### Erreur : "Billing required"
→ Activez la facturation (étape 10)

### Erreur lors de l'upload : "403 Forbidden"
→ Vérifiez les permissions IAM (étape 9) - surtout **Service Account Token Creator**

### Les URLs signées ne fonctionnent pas
→ Vérifiez que le rôle **Service Account Token Creator** est bien assigné au compte de service des Functions

---

## 📚 Prochaines étapes

1. Testez les endpoints depuis votre app React Native
2. Configurez les règles de sécurité Firestore/Storage si nécessaire (actuellement tout passe par l'API sécurisée)
3. Ajoutez la gestion d'erreurs côté client
4. Intégrez l'API Scryfall pour la reconnaissance automatique

---

## 📞 Support

- Documentation Firebase : https://firebase.google.com/docs
- Documentation Cloud Functions : https://firebase.google.com/docs/functions
- Support Firebase : https://firebase.google.com/support


