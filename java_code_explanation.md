# Payment Terminal: Java Polymorphism Deep-Dive
*Project Presentation Guide*

This document provides a line-by-line, section-by-section breakdown of the Java implementation of the Payment Terminal. The core concept demonstrated here is **Object-Oriented Polymorphism** — specifically, how a single queue can process different payment types without needing to know what they are.

---

## 1. The Abstract Base Class (`Payment.java`)

The `Payment` class is the foundation of the architecture. It defines the blueprint that all specific payment types must follow. By making the class `abstract`, we ensure that a generic "Payment" cannot be instantiated on its own.

### Key Sections:
*   **Lines 18-22:** 
    ```java
    protected String paymentId;
    protected double amount;
    protected String currency;
    protected String status;
    protected LocalDateTime timestamp;
    ```
    These are the shared fields. Using the `protected` modifier ensures that child classes (like `CreditCardPayment`) can access them, but outside classes cannot manipulate them directly.

*   **Lines 24-33 (The Constructor):** 
    This block automatically generates a unique `paymentId` using a static counter (`TXN1000`, `TXN1001`), sets the status to `PENDING`, and captures the exact time the payment was created. It also includes validation to prevent negative amounts.

*   **Lines 44 (The Polymorphic Contract):**
    ```java
    public abstract boolean process(BiConsumer<String, String> log);
    ```
    This is the most important line in the entire project. By declaring `process()` as `abstract`, we force every subclass to implement its own version of this method. The `BiConsumer` acts as a callback so the payment can send log messages back to the UI.

---

## 2. The Concrete Subclasses (e.g., `CreditCardPayment.java`)

Classes like `CreditCardPayment`, `PayPalPayment`, and `BankTransferPayment` use the `extends` keyword to inherit from `Payment`.

### Key Sections (from `CreditCardPayment`):
*   **Fields:** 
    `private String cardNumber, cardHolderName, expiry, cvv;`
    These fields are unique to credit cards. PayPal doesn't have a CVV; it has an email. This demonstrates **Encapsulation** — data specific to a payment type stays isolated within that class.

*   **The Constructor:** 
    ```java
    super(amount, currency);
    ```
    This line calls the parent `Payment` constructor to handle the shared fields (amount, ID) before initializing the credit card specific fields.

*   **The Overridden `process()` Method:**
    ```java
    @Override
    public boolean process(BiConsumer<String, String> log) { ... }
    ```
    This is where the unique logic lives. The credit card override checks if the CVV is valid (length of 3 or 4). If it's valid, it sets the status to `SUCCESS`. The `@Override` annotation tells the compiler that we are fulfilling the contract defined in `Payment.java`.

---

## 3. The Execution Engine (`PaymentProcessor.java`)

This class manages the queue and history. It is the actual demonstration of **Dynamic Dispatch** (Runtime Polymorphism).

### Key Sections:
*   **Line 29 (The Queue):**
    ```java
    private List<Payment> queue = new ArrayList<>();
    ```
    Notice that the list holds `Payment` objects, not specific credit cards or PayPal objects. Because of polymorphism, a single list can hold a mix of all child classes simultaneously.

*   **Lines 44-52 (The Processing Loop):**
    ```java
    for (Payment payment : queue) {
        // ... logging setup ...
        boolean success = payment.process(log);
        // ...
    }
    ```
    **This is the climax of the presentation.** The processor loops through the generic `Payment` list and calls `payment.process()`. 
    
    *Crucially, there are no `if-else` or `switch` statements asking "Are you a CreditCard?".* 
    
    The Java Virtual Machine (JVM) inspects the object at runtime, determines its *actual* class, and executes the correct overridden method. If the object is a `PayPalPayment`, the PayPal logic runs. If it's a `BankTransferPayment`, the Bank logic runs. 

*   **Lines 81-133 (The `main` Method Demo):**
    This section builds a test scenario. It instantiates `PaymentProcessor`, adds four different payments to the queue (including one designed to fail), and calls `processAll()`. It then formats and prints the results to the console, proving that the polymorphic engine works exactly as intended.
