

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


#API testing for Dashboards 
Here's a test document with URLs for testing each endpoint and the associated JSON body for each route you've created so far. You can use this document for your API testing.

---

## **1. Doctor Profile Routes**

### **POST /api/doctor**
Create a doctor profile.

**URL:**
```
POST http://localhost:5002/api/doctor
```

**Request Body:**
```json
{
  "name": "Dr. John Doe",
  "specialization": "Cardiologist",
  "hospital": "City Hospital",
  "rating": 4.5,
  "experience": 15,
  "profilePicture": "https://example.com/profile.jpg",
  "available": true
}
```

### **GET /api/doctor/:id**
Get doctor profile by ID.

**URL:**
```
GET http://localhost:5002/api/doctor/{doctorId}
```

---

## **2. Patient Feedback Routes**

### **POST /api/feedback**
Submit feedback for a doctor (only for visited doctors).

**URL:**
```
POST http://localhost:5002/api/feedback
```

**Request Body:**
```json
{
  "doctorId": "60d47d5f3f2205d71e881e1b",
  "patientId": "60d47d5f3f2205d71e881e2c",
  "rating": 4,
  "review": "Great doctor, very helpful."
}
```

### **GET /api/feedback/:doctorId**
Get feedback for a doctor.

**URL:**
```
GET http://localhost:5002/api/feedback/{doctorId}
```

---

## **3. COVID-19 Questionnaire Routes**

### **POST /api/covid-questionnaire**
Submit COVID-19 symptom responses.

**URL:**
```
POST http://localhost:5002/api/covid-questionnaire
```

**Request Body:**
```json
{
  "patientId": "60d47d5f3f2205d71e881e2c",
  "hasSymptoms": true,
  "symptoms": ["fever", "cough"],
  "wantsTest": true
}
```

### **GET /api/covid-questionnaire/:patientId**
Get COVID-19 questionnaire responses for a specific patient.

**URL:**
```
GET http://localhost:5002/api/covid-questionnaire/{patientId}
```

---

## **4. Appointment Routes**

### **POST /api/appointment**
Create a new appointment for a patient with a doctor.

**URL:**
```
POST http://localhost:5002/api/appointment
```

**Request Body:**
```json
{
  "doctorId": "60d47d5f3f2205d71e881e1b",
  "patientId": "60d47d5f3f2205d71e881e2c",
  "date": "2025-04-01T14:00:00Z",
  "status": "scheduled"
}
```

### **GET /api/appointment/:appointmentId**
Get details of a specific appointment.

**URL:**
```
GET http://localhost:5002/api/appointment/{appointmentId}
```

---

## **5. Hospital Bed Management Routes**

### **POST /api/hospital-beds**
Initialize hospital bed count.

**URL:**
```
POST http://localhost:5002/api/hospital-beds
```

**Request Body:**
```json
{
  "hospitalId": "60d47d5f3f2205d71e881e3a",
  "totalBeds": 100
}
```

### **GET /api/hospital-beds/:hospitalId**
Get bed availability for a specific hospital.

**URL:**
```
GET http://localhost:5002/api/hospital-beds/{hospitalId}
```

### **PUT /api/hospital-beds/:hospitalId/update**
Update bed availability (Doctor admits/discharges a patient).

**URL:**
```
PUT http://localhost:5002/api/hospital-beds/{hospitalId}/update
```

**Request Body:**
```json
{
  "change": -1
}
```

---

## **6. Hospital Routes**

### **POST /api/hospitals**
Add a new hospital to the system.

**URL:**
```
POST http://localhost:5002/api/hospitals
```

**Request Body:**
```json
{
  "name": "City Hospital",
  "location": "New York, USA",
  "contact": "1234567890",
  "bedsAvailable": 100
}
```

### **GET /api/hospitals**
Get list of all hospitals.

**URL:**
```
GET http://localhost:5002/api/hospitals
```

### **GET /api/hospital/:hospitalId/bed-availability**
Check bed availability for a specific hospital.

**URL:**
```
GET http://localhost:5002/api/hospital/{hospitalId}/bed-availability
```

---

### **Testing Notes:**

- Replace `{doctorId}`, `{patientId}`, `{appointmentId}`, `{hospitalId}` with actual IDs when testing the endpoints.
- Ensure that all routes are tested using the correct HTTP method (`GET`, `POST`, `PUT`).
- Use Postman or `curl` to test the API requests.
- For **GET** requests, make sure no request body is passed. Just use query parameters or path parameters.

---

### Test Document for Search and Filter APIs

#### **1. Search Doctors by Name and Specialization**

**Endpoint**: `GET /api/doctors/search`
- **Description**: Search for doctors based on their name and specialization.
- **Query Parameters**:
    - `name` (optional): The name of the doctor.
    - `specialization` (optional): The specialization of the doctor.

**Example Request**:
```http
GET http://localhost:5002/api/doctors/search?name=John&specialization=Cardiology
```

**Example Response**:
```json
[
  {
    "_id": "67e2187da2f7bf107bf7b398",
    "name": "Dr. John Doe",
    "specialization": "Cardiology",
    "hospital": "ABC Hospital",
    "rating": 4.5,
    "experience": 10,
    "profilePicture": "https://example.com/path/to/profile_picture.jpg",
    "available": true,
    "covidCare": true
  }
]
```

---

#### **2. Search Doctors by COVID-19 Care Support**

**Endpoint**: `GET /api/doctors/covid-support`
- **Description**: Fetch a list of doctors who support COVID-19 patient care.

**Example Request**:
```http
GET http://localhost:5002/api/doctors/covid-support
```

**Example Response**:
```json
[
  {
    "_id": "67e2187da2f7bf107bf7b398",
    "name": "Dr. John Doe",
    "specialization": "Cardiology",
    "hospital": "ABC Hospital",
    "rating": 4.5,
    "experience": 10,
    "profilePicture": "https://example.com/path/to/profile_picture.jpg",
    "available": true,
    "covidCare": true
  },
  {
    "_id": "67e2187da2f7bf107bf7b399",
    "name": "Dr. Jane Smith",
    "specialization": "Internal Medicine",
    "hospital": "XYZ Hospital",
    "rating": 4.0,
    "experience": 8,
    "profilePicture": "https://example.com/path/to/profile_picture2.jpg",
    "available": true,
    "covidCare": true
  }
]
```

---

#### **3. Fetch Available Appointment Times for a Doctor**

**Endpoint**: `GET /api/doctors/:doctorId/available-times`
- **Description**: Get the available appointment times for a specific doctor.
- **Path Parameters**:
    - `doctorId`: The ID of the doctor whose available times are to be fetched.

**Example Request**:
```http
GET http://localhost:5002/api/doctors/67e2187da2f7bf107bf7b398/available-times
```

**Example Response**:
```json
{
  "availableTimes": [
    "2025-04-05T10:00:00Z",
    "2025-04-05T11:00:00Z",
    "2025-04-06T14:00:00Z"
  ]
}
```

---

#### **4. Book an Appointment for a Doctor**

**Endpoint**: `POST /api/appointments`
- **Description**: Book an appointment for a patient with a specific doctor at a given time.
- **Request Body**:
    - `doctorId`: The ID of the doctor.
    - `patientId`: The ID of the patient.
    - `date`: The appointment date and time.
    - `email`: The email of the patient (to send confirmation email).

**Example Request**:
```json
{
  "doctorId": "67e2187da2f7bf107bf7b398",
  "patientId": "67e1c363aff66ea854ed52cb",
  "date": "2025-04-05T10:00:00Z",
  "email": "patient@example.com"
}
```

**Example Response**:
```json
{
  "message": "Appointment booked successfully",
  "data": {
    "doctorId": "67e2187da2f7bf107bf7b398",
    "patientId": "67e1c363aff66ea854ed52cb",
    "date": "2025-04-05T10:00:00Z",
    "status": "Scheduled",
    "_id": "67e22228dbbe1fd43ba8528c",
    "createdAt": "2025-03-25T03:25:28.816Z",
    "__v": 0
  }
}
```

---

#### **5. Search Doctors by Availability**

**Endpoint**: `GET /api/doctors/available`
- **Description**: Search for doctors who are currently available.

**Example Request**:
```http
GET http://localhost:5002/api/doctors/available
```

**Example Response**:
```json
[
  {
    "_id": "67e2187da2f7bf107bf7b398",
    "name": "Dr. John Doe",
    "specialization": "Cardiology",
    "hospital": "ABC Hospital",
    "rating": 4.5,
    "experience": 10,
    "profilePicture": "https://example.com/path/to/profile_picture.jpg",
    "available": true,
    "covidCare": true
  }
]
```

---

#### **6. Update Doctor Profile (Including Profile Picture)**

**Endpoint**: `PUT /api/doctors/:id`
- **Description**: Update the doctor's profile information including the profile picture URL.
- **Path Parameters**:
    - `id`: The ID of the doctor whose profile is to be updated.
- **Request Body**:
    - `name`: The name of the doctor.
    - `specialization`: The specialization of the doctor.
    - `hospital`: The hospital where the doctor works.
    - `rating`: The doctor's rating.
    - `experience`: The doctor's years of experience.
    - `profilePicture`: URL of the profile picture.
    - `available`: Boolean value representing whether the doctor is available or not.
    - `covidCare`: Boolean value representing whether the doctor supports COVID-19 care.

**Example Request**:
```json
{
  "name": "Dr. John Doe",
  "specialization": "Cardiology",
  "hospital": "ABC Hospital",
  "rating": 4.7,
  "experience": 12,
  "profilePicture": "https://example.com/path/to/updated_profile_picture.jpg",
  "available": true,
  "covidCare": true
}
```

**Example Response**:
```json
{
  "message": "Doctor profile updated successfully",
  "data": {
    "_id": "67e2187da2f7bf107bf7b398",
    "name": "Dr. John Doe",
    "specialization": "Cardiology",
    "hospital": "ABC Hospital",
    "rating": 4.7,
    "experience": 12,
    "profilePicture": "https://example.com/path/to/updated_profile_picture.jpg",
    "available": true,
    "covidCare": true
  }
}
```

---

### **Testing Instructions**:
1. **Search Doctors**: Use `GET /api/doctors/search` to search doctors by name and specialization.
2. **Filter COVID-19 Support**: Use `GET /api/doctors/covid-support` to get a list of doctors supporting COVID-19 care.
3. **Available Times for a Doctor**: Use `GET /api/doctors/:doctorId/available-times` to fetch the available appointment slots for a doctor.
4. **Book an Appointment**: Use `POST /api/appointments` to book an appointment with a doctor.
5. **Check Available Doctors**: Use `GET /api/doctors/available` to check for available doctors.
6. **Update Doctor Profile**: Use `PUT /api/doctors/:id` to update a doctor's profile (including profile picture).

### **Postman Setup**:
1. Set the request method (GET/POST/PUT) as needed.
2. Enter the appropriate URL for the API.
3. For GET requests, set the query parameters or path variables (e.g., `doctorId`, `specialization`).
4. For POST and PUT requests, include the appropriate JSON body in the request body section.
5. Check the response for the status code and JSON response to ensure correct functionality.

---



This README provides a complete overview of the project structure, system design, and setup instructions. Let me know if you need any refinements! 🚀
