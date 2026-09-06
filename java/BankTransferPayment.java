import java.util.function.BiConsumer;

/**
 * ========================================================================
 * CLASS: BankTransferPayment (The Concrete Subclass)
 * ========================================================================
 * A third implementation of Payment. Bank transfers require routing numbers.
 * 
 * ALGORITHM / EXECUTION FLOW:
 * 1. Takes routing and account numbers.
 * 2. Simulates an interbank settlement process instead of instant authorization.
 * ========================================================================
 */
public class BankTransferPayment extends Payment {

    // ------------------------------------------------------------------------
    // SECTION 1: SPECIFIC STATE (Encapsulation)
    // ------------------------------------------------------------------------
    private String bankName;
    private String accountNumber;
    private String routingCode;

    // ------------------------------------------------------------------------
    // SECTION 2: THE CONSTRUCTOR
    // ------------------------------------------------------------------------
    public BankTransferPayment(double amount, String currency,
                               String bankName, String accountNumber,
                               String routingCode) {
        
        // Initialize the base class
        super(amount, currency);
        
        // Save specific fields
        this.bankName      = bankName;
        this.accountNumber = accountNumber;
        this.routingCode   = routingCode;
    }

    @Override
    public String getPaymentType() {
        return "Bank Transfer";
    }

    // Utility: Mask the account number for security logging
    public String maskedAccount() {
        return "XXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    // ------------------------------------------------------------------------
    // SECTION 3: THE OVERRIDDEN ALGORITHM
    // ------------------------------------------------------------------------
    @Override
    public boolean process(BiConsumer<String, String> log) {
        // Step 1: Log start
        log.accept("Bank        " + bankName, "info");
        log.accept("Account     " + maskedAccount(), "info");
        log.accept("Routing     " + routingCode, "info");

        // Step 2: Validate - ensure account and routing numbers aren't empty
        boolean validDetails = accountNumber.length() >= 6 && routingCode.length() > 0;
        
        if (!validDetails) {
            this.status = "FAILED";
            log.accept("Declined — invalid bank details.", "fail");
            return false;
        }

        // Step 3: Simulate clearing house / interbank communication
        log.accept("Initiating interbank settlement…", "info");
        
        // Fake rule: Bank transfers under $1,000,000 clear successfully
        boolean settled = amount <= 1_000_000;  

        // Step 4: Finalize
        if (settled) {
            this.status = "SUCCESS";
            log.accept(String.format("Settled — %.2f %s transferred.", amount, currency), "ok");
            return true;
        }

        this.status = "FAILED";
        log.accept("Rejected by receiving bank.", "fail");
        return false;
    }
}
