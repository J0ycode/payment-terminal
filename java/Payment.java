import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.BiConsumer;

/**
 * ========================================================================
 * CLASS: Payment (The Abstract Base Class)
 * ========================================================================
 * This is the parent class for all payment types. It defines the "contract"
 * or blueprint that every specific payment method (Credit Card, PayPal, etc.)
 * must follow.
 * 
 * ALGORITHM / EXECUTION FLOW:
 * 1. When a new payment object is created (e.g. new CreditCardPayment), 
 *    this class's constructor runs first.
 * 2. It automatically assigns a unique ID and records the exact time.
 * 3. It forces child classes to implement a specific method called process().
 * ========================================================================
 */
public abstract class Payment {

    // A static counter shared across all Payment objects to generate unique IDs
    private static int ticketCounter = 1000;

    // ------------------------------------------------------------------------
    // SECTION 1: SHARED STATE (Encapsulation)
    // ------------------------------------------------------------------------
    // 'protected' means these fields are hidden from the outside world,
    // but visible to child classes (like CreditCardPayment). 
    // This prevents accidental modification of transaction data.
    protected String paymentId;
    protected double amount;
    protected String currency;
    protected String status;
    protected LocalDateTime timestamp;

    // ------------------------------------------------------------------------
    // SECTION 2: THE CONSTRUCTOR
    // ------------------------------------------------------------------------
    // This runs every time ANY payment is created.
    public Payment(double amount, String currency) {
        // Validation: Prevent negative payments before they even start
        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive.");
        }
        
        // Auto-generate metadata for the transaction
        this.paymentId = "TXN" + (ticketCounter++);
        this.amount    = amount;
        this.currency  = currency;
        this.status    = "PENDING"; // All payments start as pending
        this.timestamp = LocalDateTime.now();
    }

    // ------------------------------------------------------------------------
    // SECTION 3: THE POLYMORPHIC CONTRACT (The most important part)
    // ------------------------------------------------------------------------
    /**
     * 'abstract' means there is no code block here. 
     * We are forcing every child class to write their own version of this method.
     * When the PaymentProcessor calls payment.process(), the JVM looks at the
     * actual object type at runtime and executes the correct child's version.
     * 
     * @param log A callback function allowing the payment to send text back to the UI.
     * @return true if successful, false if failed.
     */
    public abstract boolean process(BiConsumer<String, String> log);

    // ------------------------------------------------------------------------
    // SECTION 4: GETTERS & UTILITIES
    // ------------------------------------------------------------------------
    // These allow outside classes to read the data safely.
    public String getPaymentType() {
        return "Generic Payment";
    }

    public String getPaymentId()  { return paymentId; }
    public double getAmount()     { return amount; }
    public String getCurrency()   { return currency; }
    public String getStatus()     { return status; }

    public String formattedTime() {
        return timestamp.format(DateTimeFormatter.ofPattern("HH:mm:ss"));
    }

    @Override
    public String toString() {
        return String.format("[%s] %s  %,.2f %s  — %s",
                paymentId, getPaymentType(), amount, currency, status);
    }
}
