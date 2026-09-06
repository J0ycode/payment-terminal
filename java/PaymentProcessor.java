import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * ========================================================================
 * CLASS: PaymentProcessor (The Execution Engine)
 * ========================================================================
 * This is where the magic of Polymorphism is actually used. 
 * This class holds a queue of payments and processes them one by one.
 * 
 * ALGORITHM / EXECUTION FLOW:
 * 1. addPayment() puts a payment into the generic queue.
 * 2. processAll() loops through the queue.
 * 3. For each item, it calls payment.process().
 * 4. The JVM uses Dynamic Dispatch to figure out if it's a CreditCard,
 *    PayPal, or Bank object, and runs that specific code.
 * 5. It saves the results to history and clears the queue.
 * ========================================================================
 */
public class PaymentProcessor {

    // ------------------------------------------------------------------------
    // SECTION 1: THE DATA STRUCTURES
    // ------------------------------------------------------------------------
    // Notice that the list type is `Payment`. It is NOT `CreditCardPayment`.
    // Because of inheritance, a List of Payments can hold ANY child class.
    private List<Payment> queue   = new ArrayList<>();
    private List<Payment> history = new ArrayList<>();

    // ------------------------------------------------------------------------
    // SECTION 2: QUEUE MANAGEMENT
    // ------------------------------------------------------------------------
    public void addPayment(Payment payment) {
        queue.add(payment);
    }

    // ------------------------------------------------------------------------
    // SECTION 3: THE POLYMORPHIC ENGINE (Crucial for presentation)
    // ------------------------------------------------------------------------
    public List<ProcessResult> processAll() {
        List<ProcessResult> results = new ArrayList<>();

        // Loop through every generic Payment in the queue
        for (Payment payment : queue) {
            List<String[]> lines = new ArrayList<>();
            
            // This is a logging callback to capture output from the payment classes
            BiConsumer<String, String> log = (text, kind) ->
                    lines.add(new String[]{ text, kind });

            // 🌟 DYNAMIC DISPATCH HAPPENS HERE 🌟
            // We do NOT write: if (payment instanceof CreditCard) { ... }
            // We just call process(). Java automatically looks at the object in memory,
            // sees its true identity, and runs the correct override.
            boolean success = payment.process(log);
            
            // Move from queue to history
            history.add(payment);
            results.add(new ProcessResult(payment, lines, success));
        }
        
        // Empty the queue for the next batch
        queue.clear();
        return results;
    }

    // ------------------------------------------------------------------------
    // SECTION 4: DATA AGGREGATION
    // ------------------------------------------------------------------------
    public double totalSuccessful() {
        // Uses Java Streams to filter only SUCCESS payments and add up their amounts
        return history.stream()
                .filter(p -> "SUCCESS".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    // ------------------------------------------------------------------------
    // SECTION 5: INNER CLASS (Data Transfer Object)
    // ------------------------------------------------------------------------
    // A simple container to hold the results of a processed transaction
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

    // ========================================================================
    // MAIN METHOD: CONSOLE DEMO
    // ========================================================================
    // This allows you to run the Java code directly from the terminal to 
    // prove the architecture works perfectly.
    public static void main(String[] args) {
        PaymentProcessor processor = new PaymentProcessor();

        // 1. Add a mix of entirely different payment types to the exact same queue
        processor.addPayment(new CreditCardPayment(
                1500, "USD", "4111 1111 1111 1234", "Alex Rivera", "12/29", "123"));

        processor.addPayment(new PayPalPayment(
                750, "EUR", "alex@example.com", "hunter22"));

        processor.addPayment(new BankTransferPayment(
                20000, "INR", "Northfield Union Bank", "123456789012", "NFUB0004521"));

        // 2. Add a broken one to test the failure algorithm (bad CVV)
        processor.addPayment(new CreditCardPayment(
                300, "USD", "5500 0000 0000 0004", "Bad Card", "01/30", "ab"));

        System.out.println("═══════════════════════════════════════════════════════");
        System.out.println("  PAYMENT PROCESSOR — Polymorphism Demo (Java)");
        System.out.println("═══════════════════════════════════════════════════════");
        System.out.println();

        // 3. Fire the engine!
        List<ProcessResult> results = processor.processAll();

        // 4. Print the formatted results
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
