import java.util.function.BiConsumer;

/**
 * CreditCardPayment — overrides process() for card payments.
 *
 * Extends Payment and adds card-specific fields: cardNumber,
 * cardHolderName, expiry, and cvv.  Its process() override validates
 * card details, masks the card number, and simulates a network
 * authorization check.
 */
public class CreditCardPayment extends Payment {

    private String cardNumber;
    private String cardHolderName;
    private String expiry;
    private String cvv;

    public CreditCardPayment(double amount, String currency,
                             String cardNumber, String cardHolderName,
                             String expiry, String cvv) {
        super(amount, currency);
        this.cardNumber     = cardNumber;
        this.cardHolderName = cardHolderName;
        this.expiry         = expiry;
        this.cvv            = cvv;
    }

    @Override
    public String getPaymentType() {
        return "Credit Card";
    }

    public String maskedNumber() {
        String digits = cardNumber.replaceAll("\\s", "");
        return "•••• •••• •••• " + digits.substring(digits.length() - 4);
    }

    /**
     * This OVERRIDE is what actually executes when PaymentProcessor
     * calls payment.process() on a CreditCardPayment instance.
     */
    @Override
    public boolean process(BiConsumer<String, String> log) {
        log.accept("Cardholder  " + cardHolderName, "info");
        log.accept("Card number " + maskedNumber(), "info");

        String digits = cardNumber.replaceAll("\\s", "");
        boolean validCard = digits.length() >= 12 && cvv.matches("^\\d{3}$");

        if (!validCard) {
            this.status = "FAILED";
            log.accept("Declined — invalid card details.", "fail");
            return false;
        }

        log.accept("Contacting card network for authorization…", "info");
        boolean authorized = amount <= 500_000;  // simulated network response

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
