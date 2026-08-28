"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { CART_STORAGE_KEY, MAX_CART_UNITS } from "@/lib/constants";
import { createOrder, fetchCheckoutSettings } from "@/lib/actions/order";
import type { CartItem, CartMutationResult, CartProductInput } from "@/types/cart";
import type { SpecialRequestPrefill } from "@/types/specialRequest";
import type { BuyerInfo, CreateOrderResult, PaymentSettings } from "@/types/order";

type CheckoutStatus = "idle" | "loading" | "success" | "error";
type CheckoutSettingsStatus = "idle" | "loading" | "error";

interface CartContextValue {
  items: CartItem[];
  totalUnits: number;
  totalAmount: number;
  maxUnits: number;
  remainingUnits: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: CartProductInput, quantity?: number) => CartMutationResult;
  updateQuantity: (productId: string, quantity: number) => CartMutationResult;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isSpecialRequestOpen: boolean;
  specialRequestPrefill: SpecialRequestPrefill | null;
  closeSpecialRequest: () => void;
  /** Se dispara al intentar añadir/incrementar un producto por encima del límite global. */
  openSpecialRequestForProduct: (
    product: { id: string; name: string },
    desiredQuantityForProduct: number
  ) => void;
  /** Se dispara desde el resumen del carrito, sin un producto concreto en el punto de mira. */
  openSpecialRequestForCart: () => void;
  /** Modal de "Compromís de compra": paso de confirmación previo a registrar el pedido. */
  isPurchaseCommitmentOpen: boolean;
  openPurchaseCommitment: () => void;
  closePurchaseCommitment: () => void;
  /** Modal "Dades del comprador i recollida": paso 2, tras aceptar el compromiso de compra. */
  isBuyerInfoOpen: boolean;
  /** Ajustos de pagament (dades bancàries + opcions de data de recollida) per al pas 2. */
  checkoutSettings: PaymentSettings | null;
  checkoutSettingsStatus: CheckoutSettingsStatus;
  openBuyerInfo: () => void;
  closeBuyerInfo: () => void;
  retryCheckoutSettings: () => void;
  isCheckoutOpen: boolean;
  checkoutStatus: CheckoutStatus;
  checkoutResult: CreateOrderResult | null;
  /** Registra el pedido (estado "pendiente_pago"), descuenta el stock y abre el pop-up de transferencia. */
  startCheckout: (buyerInfo: BuyerInfo) => void;
  closeCheckout: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sumUnits(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  // Estado (no ref) a propósito: si fuera una ref mutada de forma síncrona,
  // el efecto de guardado de más abajo podría leerla ya en `true` durante el
  // mismo commit en el que todavía no se ha aplicado `setItems(parsed)` — y
  // sobrescribiría localStorage con el array vacío inicial antes de que la
  // hidratación real llegue a pintarse. Con estado, ambos setters del mismo
  // efecto se aplican juntos en el siguiente render, así que el efecto de
  // guardado nunca ve `hydrated: true` con datos todavía sin hidratar.
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [specialRequest, setSpecialRequest] = useState<{
    open: boolean;
    prefill: SpecialRequestPrefill | null;
  }>({ open: false, prefill: null });
  const [checkout, setCheckout] = useState<{
    open: boolean;
    status: CheckoutStatus;
    result: CreateOrderResult | null;
  }>({ open: false, status: "idle", result: null });
  const [isPurchaseCommitmentOpen, setIsPurchaseCommitmentOpen] = useState(false);
  const [isBuyerInfoOpen, setIsBuyerInfoOpen] = useState(false);
  const [checkoutSettings, setCheckoutSettings] = useState<PaymentSettings | null>(null);
  const [checkoutSettingsStatus, setCheckoutSettingsStatus] =
    useState<CheckoutSettingsStatus>("idle");
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          itemsRef.current = parsed;
          // localStorage no existe durante el render de servidor, así que esta
          // hidratación solo puede ocurrir aquí, tras el montaje en cliente.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed);
        }
      }
    } catch {
      // localStorage no disponible o datos corruptos: se ignora y se empieza con carrito vacío.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Cuota excedida o almacenamiento no disponible (p. ej. navegación privada).
    }
  }, [items, hydrated]);

  useEffect(() => {
    const shouldLock =
      isOpen || specialRequest.open || isPurchaseCommitmentOpen || isBuyerInfoOpen || checkout.open;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, specialRequest.open, isPurchaseCommitmentOpen, isBuyerInfoOpen, checkout.open]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: CartProductInput, quantity = 1): CartMutationResult => {
    const current = itemsRef.current;
    const existing = current.find((item) => item.productId === product.id);
    const currentTotal = sumUnits(current);
    const remainingGlobal = MAX_CART_UNITS - currentTotal;
    const remainingStock = product.stock - (existing?.quantity ?? 0);
    const applied = Math.max(0, Math.min(quantity, remainingGlobal, remainingStock));

    if (applied <= 0) {
      return {
        ok: false,
        appliedQuantity: 0,
        reason: remainingGlobal <= 0 ? "limit" : "stock",
      };
    }

    const nextItems = existing
      ? current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + applied } : item
        )
      : [
          ...current,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            stock: product.stock,
            quantity: applied,
          },
        ];

    itemsRef.current = nextItems;
    setItems(nextItems);

    return {
      ok: true,
      appliedQuantity: applied,
      reason: applied < quantity ? (remainingGlobal <= remainingStock ? "limit" : "stock") : undefined,
    };
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number): CartMutationResult => {
    const current = itemsRef.current;
    const item = current.find((entry) => entry.productId === productId);
    if (!item) {
      return { ok: false, appliedQuantity: 0 };
    }

    if (quantity <= 0) {
      const nextItems = current.filter((entry) => entry.productId !== productId);
      itemsRef.current = nextItems;
      setItems(nextItems);
      return { ok: true, appliedQuantity: 0 };
    }

    const otherUnits = sumUnits(current) - item.quantity;
    const maxAllowed = Math.min(item.stock, MAX_CART_UNITS - otherUnits);

    if (maxAllowed <= 0) {
      return { ok: false, appliedQuantity: item.quantity, reason: "limit" };
    }

    const clamped = Math.min(Math.max(quantity, 1), maxAllowed);

    const nextItems = current.map((entry) =>
      entry.productId === productId ? { ...entry, quantity: clamped } : entry
    );
    itemsRef.current = nextItems;
    setItems(nextItems);

    return {
      ok: clamped === quantity,
      appliedQuantity: clamped,
      reason: clamped < quantity ? (clamped === item.stock ? "stock" : "limit") : undefined,
    };
  }, []);

  const removeItem = useCallback((productId: string) => {
    const nextItems = itemsRef.current.filter((item) => item.productId !== productId);
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
  }, []);

  const closeSpecialRequest = useCallback(() => {
    setSpecialRequest({ open: false, prefill: null });
  }, []);

  const openSpecialRequestForProduct = useCallback(
    (product: { id: string; name: string }, desiredQuantityForProduct: number) => {
      const current = itemsRef.current;
      const summaryMap = new Map(
        current.map((item) => [item.productId, { name: item.name, quantity: item.quantity }])
      );
      summaryMap.set(product.id, { name: product.name, quantity: desiredQuantityForProduct });

      const productsSummary = Array.from(summaryMap.values())
        .map((entry) => `${entry.name} (x${entry.quantity})`)
        .join("\n");

      const otherUnits = current.reduce(
        (sum, item) => sum + (item.productId === product.id ? 0 : item.quantity),
        0
      );

      setSpecialRequest({
        open: true,
        prefill: {
          productsSummary,
          quantity: otherUnits + desiredQuantityForProduct,
          productId: product.id,
        },
      });
    },
    []
  );

  const openSpecialRequestForCart = useCallback(() => {
    const current = itemsRef.current;
    const productsSummary = current.map((item) => `${item.name} (x${item.quantity})`).join("\n");
    setSpecialRequest({
      open: true,
      // El carret pot tenir diversos productes diferents: es preselecciona
      // el primer com a punt de partida, però l'usuari pot canviar-lo al
      // desplegable si la sol·licitud és realment sobre un altre.
      prefill: { productsSummary, quantity: sumUnits(current) + 1, productId: current[0]?.productId },
    });
  }, []);

  const openPurchaseCommitment = useCallback(() => setIsPurchaseCommitmentOpen(true), []);
  const closePurchaseCommitment = useCallback(() => setIsPurchaseCommitmentOpen(false), []);

  const loadCheckoutSettings = useCallback(() => {
    setCheckoutSettingsStatus("loading");
    fetchCheckoutSettings()
      .then((settings) => {
        setCheckoutSettings(settings);
        setCheckoutSettingsStatus("idle");
      })
      .catch(() => setCheckoutSettingsStatus("error"));
  }, []);

  const openBuyerInfo = useCallback(() => {
    setIsPurchaseCommitmentOpen(false);
    setIsBuyerInfoOpen(true);
    loadCheckoutSettings();
  }, [loadCheckoutSettings]);

  const closeBuyerInfo = useCallback(() => setIsBuyerInfoOpen(false), []);

  const retryCheckoutSettings = useCallback(() => {
    loadCheckoutSettings();
  }, [loadCheckoutSettings]);

  const closeCheckout = useCallback(() => {
    // No es pot cridar `router.refresh()` dins de l'actualitzador de
    // `setCheckout`: React invoca aquesta funció durant la fase de
    // render/reconciliació, i `router.refresh()` actualitza l'estat d'un
    // altre component (el Router), cosa que provoca l'avís "Cannot update
    // a component (Router) while rendering a different component
    // (CartProvider)". La funció actualitzadora ha de ser pura (només
    // calcula el nou estat); l'efecte es llança després, ja fora d'ella,
    // en aquest mateix gestor d'esdeveniment.
    let wasSuccess = false;
    setCheckout((current) => {
      wasSuccess = current.status === "success";
      return { open: false, status: "idle", result: null };
    });

    // `place_order` ja ha descomptat l'estoc (i, si calia, marcat el
    // producte com a esgotat) en el moment de crear la comanda, abans que
    // s'arribi a aquesta pantalla — però la pàgina del catàleg és un
    // Server Component que es va renderitzar amb l'estoc d'abans i no es
    // torna a carregar sol durant tot el flux de compra (és una capa per
    // sobre de la mateixa pàgina). `router.refresh()` torna a demanar les
    // dades del catàleg sense perdre l'estat de l'aplicació, així el
    // comprador veu l'estoc actualitzat en tancar el checkout.
    if (wasSuccess) {
      router.refresh();
    }
  }, [router]);

  const startCheckout = useCallback((buyerInfo: BuyerInfo) => {
    const snapshot = itemsRef.current.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    setIsBuyerInfoOpen(false);
    setCheckout({ open: true, status: "loading", result: null });

    createOrder(snapshot, buyerInfo)
      .then((result) => {
        setCheckout({ open: true, status: result.ok ? "success" : "error", result });
        if (result.ok) {
          itemsRef.current = [];
          setItems([]);
        }
      })
      .catch(() => {
        setCheckout({
          open: true,
          status: "error",
          result: { ok: false, error: "No s'ha pogut registrar la comanda. Torna-ho a provar." },
        });
      });
  }, []);

  const totalUnits = useMemo(() => sumUnits(items), [items]);
  const totalAmount = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalUnits,
      totalAmount,
      maxUnits: MAX_CART_UNITS,
      remainingUnits: Math.max(0, MAX_CART_UNITS - totalUnits),
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isSpecialRequestOpen: specialRequest.open,
      specialRequestPrefill: specialRequest.prefill,
      closeSpecialRequest,
      openSpecialRequestForProduct,
      openSpecialRequestForCart,
      isPurchaseCommitmentOpen,
      openPurchaseCommitment,
      closePurchaseCommitment,
      isBuyerInfoOpen,
      checkoutSettings,
      checkoutSettingsStatus,
      openBuyerInfo,
      closeBuyerInfo,
      retryCheckoutSettings,
      isCheckoutOpen: checkout.open,
      checkoutStatus: checkout.status,
      checkoutResult: checkout.result,
      startCheckout,
      closeCheckout,
    }),
    [
      items,
      totalUnits,
      totalAmount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      specialRequest,
      closeSpecialRequest,
      openSpecialRequestForProduct,
      openSpecialRequestForCart,
      isPurchaseCommitmentOpen,
      openPurchaseCommitment,
      closePurchaseCommitment,
      isBuyerInfoOpen,
      checkoutSettings,
      checkoutSettingsStatus,
      openBuyerInfo,
      closeBuyerInfo,
      retryCheckoutSettings,
      checkout,
      startCheckout,
      closeCheckout,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider.");
  }
  return context;
}
