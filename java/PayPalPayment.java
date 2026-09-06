import java.util.function.BiConsumer;

/**
 * ========================================================================
 * CLASS: PayPalPayment (The Concrete Subclass)
 * ========================================================================
 * Similar to CreditCardPayment, this extends the Payment base class.
 * However, PayPal uses emails and passwords, not card numbers.
 * 
 * ALGORITHM / EXECUTION FLOW:
 * 1. Constructor saves email/password, sends amount up to parent class.
 * 2. Overrides process() to perform PayPal-specific validation (like 
 *    checking for an '@' symbol in the email).
 * ========================================================================
 */
public class PayPalPayment extends Payment {

    // ------------------------------------------------------------------------
    // SECTION 1: SPECIFIC STATE (Encapsulation)
    // ------------------------------------------------------------------------
    private String email;
    private String password;

    // ------------------------------------------------------------------------
    // SECTION 2: THE CONSTRUCTOR
    // ------------------------------------------------------------------------
    public PayPalPayment(double amount, String currency,
                         String email, String password) {
        
        // Pass the generic data up to the parent Payment class
        super(amount, currency);
        
        // Save the PayPal specific data locally
        this.email    = email;
        this.password = password;
    }

    @Override
    public String getPaymentType() {
        return "PayPal";
    }

    // ------------------------------------------------------------------------
    // SECTION 3: THE OVERRIDDEN ALGORITHM
    // ------------------------------------------------------------------------
    /**
     * This shares the exact same method signature as CreditCardPayment.process(),
     * but the internal logic is entirely different. The PaymentProcessor doesn't 
     * care *how* this works, only that it *does* work.
     */
    @Override
    public boolean process(BiConsumer<String, String> log) {
        // Step 1: Log info
        log.accept("PayPal account  " + email, "info");

        // Step 2: Validation algorithm - ensure email has an @ and password isn't empty
        boolean validAccount = email.contains("@") && password.length() >= 4;
        
        // Step 3: Handle Failure
        if (!validAccount) {
            this.status = "FAILED";
            log.accept("Declined — invalid PayPal credentials.", "fail");
            return false;
        }

        // Step 4: Simulate OAuth/PayPal redirection
        log.accept("Redirecting to PayPal for authentication…", "info");
        
        // Fake rule: transactions over $250,000 fail due to insufficient simulated balance
        boolean confirmed = amount <= 250_000;  

        // Step 5: Finalize
        if (confirmed) {
            this.status = "SUCCESS";
            log.accept(String.format("Confirmed — %.2f %s sent via PayPal.", amount, currency), "ok");
            return true;
        }

        this.status = "FAILED";
        log.accept("Declined — insufficient PayPal balance.", "fail");
        return false;
    }
}
