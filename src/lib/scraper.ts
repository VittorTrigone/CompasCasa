import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  imageUrl: string;
  store: string;
  cashPrice: number | null;
  installmentPrice: number | null;
}

function parseMeli($: cheerio.CheerioAPI): { cashPrice: number | null; installmentPrice: number | null } {
  let cashPrice = null;
  let installmentPrice = null;
  const itempropPrice = $('[itemprop="price"]').attr('content');
  if (itempropPrice) {
    cashPrice = parseFloat(itempropPrice);
  } else {
    const fraction = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text();
    if (fraction) {
      cashPrice = parseFloat(fraction.replace(/\./g, ''));
    }
  }

  installmentPrice = cashPrice;
  const subtitles = $('.ui-pdp-price__subtitles').text();
  if (subtitles) {
    const match = subtitles.match(/(\d+)x\s*.*?([\d.,]+)/i);
    if (match) {
      const times = parseInt(match[1]);
      const value = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));
      installmentPrice = parseFloat((times * value).toFixed(2));
    }
  }

  return { cashPrice, installmentPrice };
}

function parseAmazon($: cheerio.CheerioAPI): { cashPrice: number | null; installmentPrice: number | null } {
  let cashPrice = null;
  const whole = $('.a-price-whole').first().text();
  const fraction = $('.a-price-fraction').first().text();
  if (whole) {
    cashPrice = parseFloat(whole.replace(/\./g, '').replace(',', '.') + (fraction || '00'));
  }
  return { cashPrice, installmentPrice: cashPrice };
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Falha ao acessar o link');
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  let store = 'Outra';
  if (url.includes('mercadolivre.com.br')) store = 'Mercado Livre';
  else if (url.includes('amazon.com.br')) store = 'Amazon';
  else if (url.includes('magazineluiza.com.br')) store = 'Magalu';
  else if (url.includes('casasbahia.com.br')) store = 'Casas Bahia';
  else if (url.includes('shopee.com.br')) store = 'Shopee';

  let title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Sem título';
  title = title.replace(/\s*-\s*R\$.*$/, ''); // Remove price from Meli og:title if present
  let imageUrl = $('meta[property="og:image"]').attr('content') || '';
  
  let prices = { cashPrice: null as number | null, installmentPrice: null as number | null };

  try {
    if (store === 'Mercado Livre') {
      prices = parseMeli($);
    } else if (store === 'Amazon') {
      prices = parseAmazon($);
    }
    // Magalu, Shopee and Casas Bahia heavily use React/Vue hydration and usually block non-browser requests
    // So we rely on open graph tags and manual price input if they fail.
  } catch(e) {
    console.error('Error parsing prices', e);
  }

  return {
    title: title.substring(0, 150),
    imageUrl,
    store,
    cashPrice: prices.cashPrice,
    installmentPrice: prices.installmentPrice,
  };
}
