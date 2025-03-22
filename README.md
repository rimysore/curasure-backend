

---

# **CuraSure - Patient & Health Insurance Management System**  

CuraSure is a comprehensive **Patient & Health Insurance Management System** that allows patients, doctors, and insurance providers to interact efficiently. The system provides appointment booking, medical history access, insurance quotes, COVID-19 tracking, and secure authentication.  

## **Table of Contents**
- [Features](#features)  
- [Project Structure](#project-structure)  
- [Technology Stack](#technology-stack)  
- [System Design](#system-design)  
- [Setup & Installation](#setup--installation)  
- [API Endpoints](#api-endpoints)  
- [Testing with Postman](#testing-with-postman)  

---

## **Features**
- **User Authentication** (Registration, Login, JWT-based authorization)  
- **Role-based Access Control** (Patients, Doctors, Insurance Providers)  
- **Patient Management** (Update health records, book appointments)  
- **Doctor’s Portal** (View assigned patients' medical history)  
- **Insurance Provider Portal** (Offer insurance plans based on patient data)   
- **Secure & Scalable Backend** (Node.js, JSON file storage for now)  

---

## **Project Structure**
```
CuraSure/
│-- backend/       # Authentication and validation middleware
│   ├── routes/            # Express routes for APIs
│   ├── utils/             # Helper functions
│   ├── data/              # JSON file storage (for now, replacing DB)
│   ├── .env               # Environment variables
│   ├── server.js          # Main entry point for backend
│   ├── package.json       # Dependencies & scripts
│             # (To be developed) React.js frontend
│-- README.md              # Project documentation
```

---

## **Technology Stack**
### **Backend**
- **Node.js** - Runtime environment  
- **Express.js** - Web framework  
- **JSON File Storage** - Temporary data storage (to be replaced with MongoDB)  
- **bcrypt.js** - Password hashing  
- **jsonwebtoken (JWT)** - User authentication  
- **dotenv** - Environment configuration  

### **Frontend** (Planned)
- **React.js** - UI development  
- **Redux** - State management  

---

## **System Design**
### **1. User Authentication & Role Management**
- Users can register as **Patients, Doctors, or Insurance Providers**  
- **JWT authentication** ensures secure access  
- **Role-based access** limits user actions  

### **2. Patient Management**
- Patients can update their medical history  
- Book appointments with doctors  
- View insurance quotes  

### **3. Doctor’s Portal**
- Doctors can access medical history of assigned patients  
- Virtual assistance for COVID-19 patients  

### **4. Insurance Provider Portal**
- View patient profiles to suggest insurance plans  
- Provide quotes based on health data  

### **5. COVID-19 Tracking**
- Monitor admitted patients and available hospital beds  
- Automated symptom assessment for remote assistance  

---

## **Setup & Installation**
### **1. Clone the Repository**
```bash
git clone https://github.iu.edu/rimysore/CuraSure.git
cd CuraSure
```

### **2. Switch to `dev` Branch**
```bash
git checkout dev
```

### **3. Install Dependencies**
```bash
npm install
npm install mongoose
npm install axios
```

### **4. Configure Environment Variables**
Create a `.env` file in the backend directory and add:  
```
PORT=5002
JWT_SECRET=your_secret_key
```

### **5. Run the Server**
```bash
node server.js
```
or  
```bash
npm start
```
Backend will run at: **http://localhost:5002**  

---

## **API Endpoints**
### **Authentication**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Registers a new user and stores details in JSON |
| `POST` | `/api/auth/login` | Authenticates a user and returns a JWT token |

### **Patient**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET`  | `/api/patient/me` | View patient profile |

---

## **Testing with Postman**
1. Open **Postman**  
2. Use `POST` requests for `/api/auth/register` and `/api/auth/login`  
3. Ensure you pass **email** and **password** in the request body  
4. For login, use the JWT token for authenticated requests  

---

## **Future Enhancements**
- **Database Integration (MongoDB)** for better data management  
- **Frontend Development (React.js)** for user interface  
- **Docker** for scalability  

---

This README provides a complete overview of the project structure, system design, and setup instructions. Let me know if you need any refinements! 🚀
