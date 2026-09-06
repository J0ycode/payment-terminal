import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * PaymentProcessor — where the polymorphism is actually used.
 *
 * This is the class that matters most for the lesson.  Its queue is a
 * plain {@code List<Payment>} — it can hold a mix of CreditCardPayment,
 * PayPalPayment, and BankTransferPayment objects side by side, with no
 * tagging or type-checking.
 *
 * {@code processAll()} loops over that list and calls
 * {@code payment.process(log)} on each entry.  Java resolves that call
 * using the object's real class at runtime (dynamic dispatch), so the
 * correct override always runs — PaymentProcessor itself never asks
 * "what kind of payment is this?" anywhere in its code.
 *
 * This file also contains the {@code main()} method, so you can compile
 * and run it directly to see the polymorphism in action:
 *
 * <pre>
 *   javac *.java
 *   java PaymentProcessor
 * </pre>
 */
public class PaymentProcessor {

    private List<Payment> queue   = new ArrayList<>();
    private List<Payment> history = new ArrayList<>();

    public void addPayment(Payment payment) {
        queue.add(payment);
    }

    /**
     * Dynamic dispatch happens on the next line: {@code payment.process(log)}
     * resolves to a different method body depending on what {@code payment}
     * really is, decided at runtime — not by anything written here.
     */
    public List<ProcessResult> processAll() {
        List<ProcessResult> results = new ArrayList<>();

        for (Payment payment : queue) {
            List<String[]> lines = new ArrayList<>();
            BiConsumer<String, String> log = (text, kind) ->
                    lines.add(new String[]{ text, kind });

            boolean success = payment.process(log);
            history.add(payment);
            results.add(new ProcessResult(payment, lines, success));
        }
        queue.clear();
        return results;
    }

    public double totalSuccessful() {
        return history.stream()
                .filter(p -> "SUCCESS".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    // ---- Inner class for result bundling ----
    public static class ProcessResult {
        public final Payment payment;
        public final List<String[]> lines;
        public final boolean success;

        public ProcessResult(Payment payment, List<String[]> lines, boolean success) {
            this.payment = payment;
            this.lines   = lines;
            this.success = success;
        }
    }


    /* =================================================================
       MAIN — Console demo of polymorphism in action
       ================================================================= */
    public static void main(String[] args) {
        PaymentProcessor processor = new PaymentProcessor();

        // Add a mix of payment types to the same queue
        processor.addPayment(new CreditCardPayment(
                1500, "USD", "4111 1111 1111 1234", "Alex Rivera", "12/29", "123"));

        processor.addPayment(new PayPalPayment(
                750, "EUR", "alex@example.com", "hunter22"));

        processor.addPayment(new BankTransferPayment(
                20000, "INR", "Northfield Union Bank", "123456789012", "NFUB0004521"));

        // Also add one that will fail (invalid CVV)
        processor.addPayment(new CreditCardPayment(
                300, "USD", "5500 0000 0000 0004", "Bad Card", "01/30", "ab"));

        System.out.println("═══════════════════════════════════════════════════════");
        System.out.println("  PAYMENT PROCESSOR — Polymorphism Demo (Java)");
        System.out.println("═══════════════════════════════════════════════════════");
        System.out.println();

        // Process all — each payment's OWN process() override runs
        List<ProcessResult> results = processor.processAll();

        for (ProcessResult r : results) {
            String bar = r.success ? "✓ SUCCESS" : "✗ DECLINED";
            System.out.println("───────────────────────────────────────────────────────");
            System.out.printf("  %s  │  %s  │  %s %s%n",
                    r.payment.getPaymentId(),
                    r.payment.getPaymentType(),
                    String.format("%,.2f", r.payment.getAmount()),
                    r.payment.getCurrency());
            System.out.println("───────────────────────────────────────────────────────");

            for (String[] line : r.lines) {
                String prefix = switch (line[1]) {
                    case "ok"   -> "  ✓ ";
                    case "fail" -> "  ✗ ";
                    default     -> "    ";
                };
                System.out.println(prefix + line[0]);
            }
            System.out.println("  ▸ " + bar);
            System.out.println();
        }

        System.out.println("═══════════════════════════════════════════════════════");
        System.out.printf("  Total successful: $%,.2f%n", processor.totalSuccessful());
        System.out.printf("  Payments processed: %d%n", results.size());
        System.out.println("═══════════════════════════════════════════════════════");
    }
}
