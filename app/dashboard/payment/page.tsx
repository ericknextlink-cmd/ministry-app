"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PaymentPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setPaymentComplete(true);
    toast.success("Payment successful!");

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push("/dashboard/company");
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Payment Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to company information...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your certification payment
          </p>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-lg dark:bg-gray-950">
          {/* Payment Details Summary */}
          <div className="mb-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-950/20">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Payment Summary
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Certificate Type:</span>
                <span className="font-semibold">Electrical Works - E2</span>
              </div>
              <div className="flex justify-between">
                <span>Registration Fee:</span>
                <span className="font-semibold">¢1000</span>
              </div>
              <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600 dark:text-blue-400">¢1000</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div>
              <Label htmlFor="cardNumber" className="mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Card Number
              </Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })
                }
                className="h-12"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })
                  }
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={paymentDetails.cvv}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, cvv: e.target.value })
                  }
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="John Doe"
                value={paymentDetails.cardName}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, cardName: e.target.value })
                }
                className="h-12"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isProcessing}
              className="w-full bg-[#033783] text-white hover:bg-[#022555]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

