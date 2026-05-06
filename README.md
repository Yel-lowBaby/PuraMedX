# 🏥 PuraMedX API

PuraMedX is a healthcare management API designed to streamline interactions between patients, doctors, and administrators.

This API supports secure authentication using JWT (access and refresh tokens), role-based authorization, appointment booking and management, secure medical report uploads via Cloudinary, and real-time access to patient medical history.

---

## 🚀 Features

- 🔐 JWT Authentication (Access + Refresh tokens)
- 👤 Role-based access (Patient, Doctor, Admin)
- 📅 Appointment booking & cancellation
- 📝 Doctor notes (clinical records)
- 📁 Secure report uploads (Cloudinary)
- 🔗 Signed URLs for protected file access
- 📊 Patient medical history
- 🔍 Filtering & pagination
- 📬 Email notifications (booking, cancellation, reminders)
- 🧠 Doctor dashboard analytics
- 🔒 Relationship-based access control
- 👑 Admin bootstrap & controlled creation

---

## 🧱 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- Cloudinary (file storage)
- Nodemailer (email service)
- JWT (authentication)

---

## 📦 Installation

```bash
git clone https://github.com/Yel-lowBaby/PuraMedX.git
cd puramedx-api
npm install

---

⚙️ Environment Setup

Create a .env file using:
cp .env.example .env

Then update values accordingly.

---

▶️ Run Server
npm run dev

---

🔐 Authentication

All protected routes require:
Authorization: Bearer <access_token>

---

📌 API Endpoints Overview

Auth
	•	POST /api/v1/auth/register
	•	POST /api/v1/auth/login
    •	POST /api/v1/auth/refresh-token
	•	POST /api/v1/auth/logout

Appointments
	•	POST /api/v1/appointments
	•	PATCH /api/v1/appointments/:id/cancel

Reports
	•	POST /api/v1/appointments/:id/upload
	•	GET /api/v1/appointments/:id/reports
	•	DELETE /api/v1/appointments/:id/report/:reportId


Patient
	•	GET /api/v1/patients
	•	GET /api/v1/patients/me/history
	

Doctor
	•	GET /api/v1/doctors
	•	GET /api/v1/doctors/dashboard
	•	GET /api/v1/doctors/all
	•	GET /api/v1/doctors/doctorId
	•	GET /api/v1/doctors/patient/:patientId/history
	•	PATCH /api/v1/appointments/:id/notes
	

Admin
	•	POST /api/v1/admin/create-admin

---

🧠 Design Highlights
	•	🔒 Secure file access via signed URLs
	•	⚖️ Role + relationship-based authorization
	•	🧩 Modular architecture (controllers, services, middleware)
	•	📊 Optimized queries with pagination

---

📬 Email System
	•	Appointment confirmation
	•	Cancellation notification
	•	Automated reminders (cron)

---

👑 Admin System
	•	First admin created via bootstrap
	•	Further admins created by existing admins only
	•	No public admin registration

---

📌 Future Improvements
	•	Department-based access control
	•	Real-time notifications
	•	Audit logging
	•	Frontend integration

---

## 📸 API Screenshots

This project includes visual demonstrations of all key API endpoints tested via Postman.

You can view them here:

👉 [View Screenshots](https://github.com/Yel-lowBaby/PuraMedX/tree/master/assets/screenshots)

---

👨‍💻 Author

Built by Olayinka Adedapo Abioye