/**
 * Mamo inline checkout SDK
 * (https://assets.mamopay.com/stable/checkout-inline-2.0.0.min.js)
 *
 * In the browser console `MamoPay` works because the console runs in global scope.
 * Inside ES modules (Vite/React), use `globalThis.MamoPay` — it is the same constructor.
 */
export type MamoPayInstance = {
  addIframeToWebsite(elementId: string, paymentLink: string): void;
};

export type MamoPayConstructor = new () => MamoPayInstance;

declare global {
  /** Global constructor from the Mamo classic script (same as `globalThis.MamoPay`). */
  var MamoPay: MamoPayConstructor;

  namespace globalThis {
    var MamoPay: MamoPayConstructor;
  }
}

export {};
