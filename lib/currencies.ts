import currenciesData from "./currencies.json";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  name_plural: string;
}

type CurrencyData = {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  name_plural: string;
};

type CurrenciesJson = Record<string, CurrencyData>;

// Convert JSON data to array format
export const CURRENCIES: Currency[] = Object.entries(
  currenciesData as CurrenciesJson
).map(([code, data]) => ({
  code,
  name: data.name,
  symbol: data.symbol,
  symbol_native: data.symbol_native,
  decimal_digits: data.decimal_digits,
  rounding: data.rounding,
  name_plural: data.name_plural,
}));

// Sort currencies alphabetically by code for easier selection
export const SORTED_CURRENCIES = [...CURRENCIES].sort((a, b) =>
  a.code.localeCompare(b.code)
);

// Helper function to get currency by code
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

// Helper function to format currency display for dropdowns
export function formatCurrencyDisplay(currency: Currency): string {
  return `${currency.code} (${currency.symbol})`;
}
