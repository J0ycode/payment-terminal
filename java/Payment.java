import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.BiConsumer;

/**
 * Payment — the abstract base class.
 * 
 * Every payment type shares these fields: paymentId, amount, currency,
 * status, and timestamp.  The abstract method {@code process()} must be
 * overridden by every subclass — this is the single method
 * PaymentProcessor calls, and the reason polymorphism works:
 * PaymentProcessor never needs to know which override actually runs.
 */
public abstract class Payment {

    private static int ticketCounter = 1000;

    protected String paymentId;
    protected double amount;
    protected String currency;
    protected String status;
    protected LocalDateTime timestamp;

    public Payment(double amount, String currency) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive.");
        }
        this.paymentId = "TXN" + (ticketCounter++);
        this.amount    = amount;
        this.currency  = currency;
        this.status    = "PENDING";
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Abstract method: every subclass MUST override this.
     * This is the single method PaymentProcessor calls — and the
     * reason dynamic polymorphism works.
     *
     * @param log  a logging callback accepting (message, kind)
     *             where kind is "info", "ok", or "fail"
     * @return true if the payment succeeded, false otherwise
     */
    public abstract boolean process(BiConsumer<String, String> log);

    /** Overridable label — subclasses override it. */
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
