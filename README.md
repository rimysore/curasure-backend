# CuraSure

This is the backend for the CuraSure Patient & Health Insurance Management System. It handles authentication (registration & login), user management, and serves API endpoints for patients, doctors, and insurance providers.

Tech Stack
Node.js - Backend runtime
Express.js - Web framework
JSON File Storage - Temporary storage (instead of a database)
bcrypt.js - Password hashing
jsonwebtoken (JWT) - User authentication
dotenv - Environment variable management

Setup & Installation
1. Clone the Repository

- git clone https://github.iu.edu/rimysore/CuraSure.git
- cd CuraSure

2. Switch to the dev Branch

- git checkout dev

3. Install Dependencies

- npm install

4. Configure Environment Variables
Create a .env file in the root directory and add:

- PORT=5002
- JWT_SECRET=your_secret_key

5. Run the Server

- node server.js

- npm start
The backend will start at:
http://localhost:5002

API Endpoints


POST	/api/auth/register	--> Registers a new user and stores details in a JSON file
POST	/api/auth/login -->	Authenticates a user and returns a JWT token

Testing with Postman
Open Postman
Use POST requests for /api/auth/register to test register and /api/auth/login to test login
Ensure you pass email and password in the request body
For login, use the JWT token for authenticated requests

