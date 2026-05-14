# GovChat 🏛️
### Governance Made Simple, Transparent, and Impactful.

GovChat is a next-generation digital governance platform designed to bridge the gap between citizens and local authorities. It empowers citizens to report issues, track resolutions in real-time, and stay informed about their community through an intuitive, AI-enhanced interface.

---

## 🌟 Key Features

### 1. Professional Spotlight Onboarding
A premium, interactive walkthrough for first-time users.
- **Guided Tours**: Smoothly highlights key UI elements (Services, Resources, Help).
- **Dynamic Cutouts**: High-fidelity spotlight effect with glassmorphic tooltips.
- **Re-run Anywhere**: A floating help button allows users to trigger the tour at any time.

### 2. AI-Powered Issue Reporting
- **Smart Routing**: Complaints are automatically analyzed and routed to the correct department.
- **Image Intelligence**: Upload photos of issues (e.g., potholes, broken streetlights) for AI-generated captions and analysis.
- **Spatial Tracking**: Pinpoint issues on a live interactive map for better community awareness.

### 3. Integrated Communication
- **AI Chatbot**: A dedicated assistant to help citizens navigate legal guidelines and portal features.
- **Real-time Notifications**: Stay updated as your complaint moves from "Pending" to "Resolved".
- **Handler Portals**: Dedicated interfaces for department officials to manage and resolve incoming tickets.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/), [Framer Motion](https://www.framer.com/motion/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Django](https://www.djangoproject.com/), [Django Rest Framework](https://www.django-rest-framework.org/) |
| **Database** | PostgreSQL / SQLite |
| **AI/ML** | Custom AI models for Image Captioning & NLP Chat |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

> [!NOTE]
> If running with HTTPS (recommended for location features), use:
> `python manage.py runserver_plus --cert-file ../keys/localhost+3.pem --key-file ../keys/localhost+3-key.pem 0.0.0.0:8000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📖 Deployment & Configuration
- **IP Configuration**: Ensure the frontend API calls in `services/api.ts` point to your correct backend IP address.
- **Initial Data**: Use the Django Admin dashboard to create initial departments and handler accounts.
- **Onboarding Reset**: To see the tutorial again, clear your local storage or update `needs_onboarding=True` for your user in the database.

---

## 🛠️ Maintenance
The project uses a centralized `REQUEST` wrapper in `frontend/services/api.ts` for all authenticated communication. Ensure JWT tokens are properly handled via the `auth.ts` service.

---

## 📄 License
This project is developed for local governance enhancement. All rights reserved.


my ip address was 192.168.1.6 , what you must do is get your pc ip addr then replace all those with yours

192.168.1.3 // sriram
172.17.6.97 // rvce
12.9 77.6 cubbon
12.5 77.3 lalabhag
bescom 3
complaint id 25
First create dummy departments in django-admin dashboard