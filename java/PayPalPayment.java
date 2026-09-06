import java.util.function.BiConsumer;

/**
 * PayPalPayment — the same method, a different body.
 *
 * PayPalPayment has nothing to do with card numbers — it stores an
 * email and password instead — but it still implements process() with
 * the exact same method signature as CreditCardPayment.  That's the
 * crux of polymorphism: one shared method name, independent
 * implementations, each free to do whatever makes sense for that
 * payment type.
 */
public class PayPalPayment extends Payment {

    private String email;
    private String password;

    public PayPalPayment(double amount, String currency,
                         String email, String password) {
        super(amount, currency);
        this.email    = email;
        this.password = password;
    }

    @Override
    public String getPaymentType() {
        return "PayPal";
    }

    /**
     * Same method NAME as CreditCardPayment.process(), completely
     * different BODY.  That's polymorphism: one shared interface,
     * many independent implementations.
     */
    @Override
    public boolean process(BiConsumer<String, String> log) {
        log.accept("PayPal account  " + email, "info");

        boolean validAccount = email.contains("@") && password.length() >= 4;
        if (!validAccount) {
            this.status = "FAILED";
            log.accept("Declined — invalid PayPal credentials.", "fail");
            return false;
        }

        log.accept("Redirecting to PayPal for authentication…", "info");
        boolean confirmed = amount <= 250_000;  // simulated balance check

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
