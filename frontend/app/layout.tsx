import type { Metadata } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { PurchaseOrderProvider } from "@/lib/purchaseOrderContext";
import { PurchaseOrderDrawer } from "@/components/inventory/PurchaseOrderDrawer";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mercato — Stock and demand. In balance.",
  description:
    "Forecast demand and plan stock with confidence. Compare available inventory against forecasted lead-time requirements and review replenishment orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${instrumentSerif.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#030407] text-[#F8FAFC] font-sans">
        <PurchaseOrderProvider>
          {children}
          <PurchaseOrderDrawer />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0A0F1D",
                border: "1px solid rgba(21, 88, 201, 0.45)",
                color: "#F8FAFC",
              },
            }}
          />
        </PurchaseOrderProvider>
      </body>
    </html>
  );
}
