"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  costPrice: number;
  leadTimeDays: number;
  warehouseLocation: string;
}

interface PurchaseOrderContextType {
  items: PurchaseOrderItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToPO: (item: PurchaseOrderItem) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, qty: number) => void;
  clearPO: () => void;
  totalCost: number;
  totalUnits: number;
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

export function PurchaseOrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const addToPO = (newItem: PurchaseOrderItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === newItem.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === newItem.sku
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });

    toast.success(`Added ${newItem.quantity} units of ${newItem.name} to purchase order draft.`, {
      action: {
        label: "View draft",
        onClick: () => setIsDrawerOpen(true),
      },
    });
  };

  const removeItem = (sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
    toast.info(`Removed ${sku} from PO`);
  };

  const updateQuantity = (sku: string, qty: number) => {
    if (qty <= 0) {
      removeItem(sku);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, quantity: qty } : i))
    );
  };

  const clearPO = () => {
    setItems([]);
  };

  const totalCost = items.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <PurchaseOrderContext.Provider
      value={{
        items,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addToPO,
        removeItem,
        updateQuantity,
        clearPO,
        totalCost,
        totalUnits,
      }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
}

export function usePurchaseOrder() {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error("usePurchaseOrder must be used within a PurchaseOrderProvider");
  }
  return context;
}
