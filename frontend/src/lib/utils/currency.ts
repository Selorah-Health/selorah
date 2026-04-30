export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
  countryName: string;
}

export async function detectCurrency(): Promise<CurrencyInfo> {
  // Last resort fallback based on browser locale
  const getLocaleFallback = (): { code: string; symbol: string; country: string } => {
    const locale = navigator.language || (navigator as any).userLanguage || 'en-US';
    if (locale.includes('NG')) return { code: 'NGN', symbol: '₦', country: 'Nigeria' };
    if (locale.includes('KE')) return { code: 'KES', symbol: 'KSh', country: 'Kenya' };
    if (locale.includes('GH')) return { code: 'GHS', symbol: 'GH₵', country: 'Ghana' };
    if (locale.includes('ZA')) return { code: 'ZAR', symbol: 'R', country: 'South Africa' };
    return { code: 'USD', symbol: '$', country: 'United States' };
  };

  try {
    // 1. Try Multiple Geo APIs in parallel for speed and reliability
    const geoEndpoints = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json',
      'http://ip-api.com/json'
    ];

    let geoData: any = null;

    for (const url of geoEndpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data.currency || data.country) {
          geoData = {
            currency: data.currency || (data.country === 'NG' ? 'NGN' : 'USD'),
            country_name: data.country_name || data.country || 'United States'
          };
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!geoData) {
      const fallback = getLocaleFallback();
      geoData = { currency: fallback.code, country_name: fallback.country };
    }

    const currencyCode = geoData.currency || 'USD';
    const countryName = geoData.country_name || 'United States';

    // 2. Fetch Exchange Rates
    const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const rateData = await rateResponse.json();
    
    const rate = rateData.rates[currencyCode] || 1;

    // 3. Define Symbols
    const symbols: Record<string, string> = {
      'USD': '$',
      'NGN': '₦',
      'EUR': '€',
      'GBP': '£',
      'KES': 'KSh',
      'GHS': 'GH₵',
      'ZAR': 'R',
      'CAD': 'C$',
      'AUD': 'A$',
    };

    return {
      code: currencyCode,
      symbol: symbols[currencyCode] || currencyCode,
      rate,
      countryName
    };
  } catch (error) {
    console.error('Currency detection failed:', error);
    const fallback = getLocaleFallback();
    return { 
      code: fallback.code, 
      symbol: fallback.symbol, 
      rate: fallback.code === 'NGN' ? 1500 : 1, 
      countryName: fallback.country 
    };
  }
}
