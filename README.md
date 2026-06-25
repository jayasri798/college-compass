# College Compass - Web Admin Dashboard

College Compass is an indoor navigation and campus mapping platform designed for university campuses. This web dashboard serves as the administrative control console to manage buildings, floors, rooms, and entry-gate QR codes.

---

## 🚀 Key Features

- **Google Authentication:** Secure administration login utilizing Firebase Authentication.
- **Live Firestore Sync:** Real-time database updates for rooms, class lists, offices, and lab mappings.
- **Responsive Layout:** Adaptive sidebar console, statistics overview panels, and searchable room tables styled with Tailwind CSS.
- **Firestore Seeding Tool:** Console utility to automatically seed and reset college layout parameters (Main Block, Floor 3) instantly.
- **CI/CD Automation:** Integrated GitHub Actions workflow to build and deploy to Firebase Hosting on branch merge.

---

## 🛠️ Tech Stack

- **Frontend Framework:** Angular (v17+ Standalone Components)
- **Styling Engine:** Tailwind CSS (v4 Utility-First CSS variables layout)
- **Backend Infrastructure:** Firebase Core
  - **Database:** Cloud Firestore (NoSQL Document Hierarchy)
  - **Authentication:** Firebase Auth (Google Sign-In Provider)
  - **Hosting:** Firebase Hosting (Optimized CDN distribution)
- **CI/CD:** GitHub Actions

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed on your system.

### 2. Install Dependencies
Run the package installation with peer dependency bypass for Firebase:
```bash
npm install --legacy-peer-deps
```

### 3. Configure Firebase Credentials
Replace the placeholders in `src/environments/environment.ts` and `src/environments/environment.development.ts` with your actual Firebase project settings copied from the Project Console:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};
```

### 4. Run Development Server
Run the local development server:
```bash
npm start
```
Open [http://localhost:4200/](http://localhost:4200/) in your browser. The application supports Hot-Reload and will recompile automatically on file changes.

### 5. Production Build
Compile production assets:
```bash
npm run build
```
Production assets are generated in `dist/college-compass/browser/`.

---

## 🗄️ Database Architecture

The application implements a hierarchical NoSQL layout:

```
buildings (Collection)
 └── MainBlock (Document)
      └── floors (Subcollection)
           └── Floor3 (Document)
                └── rooms (Subcollection)
                     ├── room-301 (Document: IoT Lab)
                     ├── room-302 (Document: CSE HOD Cabin)
                     └── ...
```

- **Live Streaming:** The rooms list is connected directly to `buildings/MainBlock/floors/Floor3/rooms`. When rooms are added or changed via the Firebase Console or client applications, they sync instantly on this dashboard table.
- **QR Code Indexing:** A root collection `qr_codes` links entrance-gate QR codes to the target rooms on specific floors.
