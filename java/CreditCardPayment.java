import java.util.function.BiConsumer;

/**
 * ========================================================================
 * CLASS: CreditCardPayment (The Concrete Subclass)
 * ========================================================================
 * This class 'extends' Payment, meaning it inherits all the shared fields 
 * (like amount and status) but adds data specific only to credit cards.
 * 
 * ALGORITHM / EXECUTION FLOW:
 * 1. Constructor takes in both the base data (amount) and card data.
 * 2. It passes the base data UP to the parent class via super().
 * 3. It overrides the process() method to validate the card specifically.
 * ========================================================================
 */
public class CreditCardPayment extends Payment {

    // ------------------------------------------------------------------------
    // SECTION 1: SPECIFIC STATE (Encapsulation)
    // ------------------------------------------------------------------------
    // These fields only exist for Credit Cards. PayPal doesn't have a CVV.
    private String cardNumber;
    private String cardHolderName;
    private String expiry;
    private String cvv;

    // ------------------------------------------------------------------------
    // SECTION 2: THE CONSTRUCTOR
    // ------------------------------------------------------------------------
    public CreditCardPayment(double amount, String currency,
                             String cardNumber, String cardHolderName,
                             String expiry, String cvv) {
        
        // Step 1: Call the parent (Payment) constructor to set up ID, time, and amount
        super(amount, currency);
        
        // Step 2: Save the credit card specific data
        this.cardNumber     = cardNumber;
        this.cardHolderName = cardHolderName;
        this.expiry         = expiry;
        this.cvv            = cvv;
    }

    @Override
    public String getPaymentType() {
        return "Credit Card";
    }

    // Utility: Mask the card number for security so it doesn't print in plain text
    public String maskedNumber() {
        String digits = cardNumber.replaceAll("\\s", "");
        return "•••• •••• •••• " + digits.substring(digits.length() - 4);
    }

    // ------------------------------------------------------------------------
    // SECTION 3: THE OVERRIDDEN ALGORITHM
    // ------------------------------------------------------------------------
    /**
     * This is the Polymorphism in action. When PaymentProcessor calls process(),
     * if the object is a CreditCard, THIS block of code runs.
     */
    @Override
    public boolean process(BiConsumer<String, String> log) {
        // Step 1: Log the start of the transaction
        log.accept("Cardholder  " + cardHolderName, "info");
        log.accept("Card number " + maskedNumber(), "info");

        // Step 2: Validate the card algorithmically
        // Remove spaces and check if length is at least 12, and CVV is exactly 3 digits
        String digits = cardNumber.replaceAll("\\s", "");
        boolean validCard = digits.length() >= 12 && cvv.matches("^\\d{3}$");

        // Step 3: Handle Failure State
        if (!validCard) {
            this.status = "FAILED";
            log.accept("Declined — invalid card details.", "fail");
            return false; // Exit immediately
        }

        // Step 4: Simulate network authorization
        log.accept("Contacting card network for authorization…", "info");
        
        // Fake rule: any amount over $500,000 gets declined by the bank
        boolean authorized = amount <= 500_000;  

        // Step 5: Handle Success or Final Decline
        if (authorized) {
            this.status = "SUCCESS";
            log.accept(String.format("Authorized — %.2f %s charged.", amount, currency), "ok");
            return true;
        }

        this.status = "FAILED";
        log.accept("Declined by issuer.", "fail");
        return false;
    }
}
