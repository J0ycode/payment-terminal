# Payment Terminal - Polymorphism Demonstration

A full-stack web application designed to demonstrate the power of **Object-Oriented Polymorphism** in a live, functional environment. 

This project simulates a multi-gateway payment terminal that handles distinct payment methods (Credit Card, PayPal, Bank Transfer) using a single, unified execution queue. It features a modern frontend interface connected to a Node.js/Express API, with all successful transactions permanently persisted in a MongoDB Atlas cluster.

## 🚀 Features

*   **Dynamic Polymorphic Execution:** The frontend queue manages generic "Payment" objects. When processed, the execution engine dynamically dispatches the distinct processing logic based on the underlying object type (Credit Card, PayPal, or Bank Transfer).
*   **Live Backend Integration:** The system isn't just a UI mock. Payments are validated, queued, and transmitted via HTTP POST to an Express API.
*   **Database Persistence:** Successful transactions are recorded securely in a MongoDB database using Mongoose schemas.
*   **Automated E2E Testing:** Includes a fully automated Puppeteer testing script (`test.js`) that verifies the end-to-end functionality of the terminal UI.
*   **Java Equivalents:** Includes raw `.java` files demonstrating the backend polymorphic architecture in Java.

## 🛠️ Technology Stack

*   **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Modern Flexbox/Grid layouts).
*   **Backend:** Node.js, Express.
*   **Database:** MongoDB Atlas, Mongoose.
*   **Testing:** Puppeteer (Headless Browser E2E verification).
*   **Documentation:** Mermaid.js (Sequence and Flowchart diagrams).

## 📂 Project Structure

```text
├── backend/            # Express API and Mongoose schemas (server.js, models, routes)
├── frontend/           # The Web UI (app.js, index.html, styles.css)
├── java/               # Core Java class files demonstrating polymorphism
├── pdf/                # Comprehensive Execution Flow diagrams
├── shots/              # Step-by-step UI screenshots from E2E testing
├── test.js             # Automated Puppeteer test script
└── User_Manual.pdf     # Detailed guide on operating the terminal
```

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/J0ycode/payment-terminal.git
   cd payment-terminal
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your MongoDB connection string:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/payment_terminal?retryWrites=true&w=majority
   ```
4. **Start the backend server:**
   ```bash
   npm start
   ```
   *(Alternatively, run `node server.js`)*
5. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`.

## 🧪 Running Tests
To run the automated E2E verification tests, simply execute:
```bash
node test.js
```
The script will run a headless Chromium browser, test all three payment types, verify the polymorphic queue logic, process the ledger, and save intermediate verification screenshots into the `shots/` folder.

---
*Created for presentation and educational demonstration of system architecture and OOP principles.*
