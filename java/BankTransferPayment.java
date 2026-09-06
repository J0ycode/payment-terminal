import java.util.function.BiConsumer;

/**
 * BankTransferPayment — a third, independent implementation.
 *
 * Bank transfers need bank name, account number, and routing code.
 * Settlement works differently from a card or PayPal charge — it
 * simulates an interbank settlement step none of the other types have.
 * Same process() interface, yet again a completely different body.
 */
public class BankTransferPayment extends Payment {

    private String bankName;
    private String accountNumber;
    private String routingCode;

    public BankTransferPayment(double amount, String currency,
                               String bankName, String accountNumber,
                               String routingCode) {
        super(amount, currency);
        this.bankName      = bankName;
        this.accountNumber = accountNumber;
        this.routingCode   = routingCode;
    }

    @Override
    public String getPaymentType() {
        return "Bank Transfer";
    }

    public String maskedAccount() {
        return "XXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    @Override
    public boolean process(BiConsumer<String, String> log) {
        log.accept("Bank        " + bankName, "info");
        log.accept("Account     " + maskedAccount(), "info");
        log.accept("Routing     " + routingCode, "info");

        boolean validDetails = accountNumber.length() >= 6 && routingCode.length() > 0;
        if (!validDetails) {
            this.status = "FAILED";
            log.accept("Declined — invalid bank details.", "fail");
            return false;
        }

        log.accept("Initiating interbank settlement…", "info");
        boolean settled = amount <= 1_000_000;  // simulated settlement response

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
