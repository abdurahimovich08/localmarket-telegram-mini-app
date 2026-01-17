/**
 * Category-Specific Synonyms
 * 
 * Each category has its own set of synonyms for better search accuracy
 */

export interface CategorySynonymConfig {
  category: string
  synonyms: Record<string, string[]>
  brands: Record<string, string[]>
  attributes: Record<string, string[]>
}

/**
 * Clothing category synonyms
 */
export const CLOTHING_SYNONYMS: CategorySynonymConfig = {
  category: 'clothing',
  synonyms: {
    // Shoes
    'krossovka': ['krassofka', 'krasofka', 'krosovka', 'krosvka', 'sport oyoq kiyim', 'sneaker', 'кроссовки', 'кроссовка'],
    'tufli': ['tufla', 'туфли', 'туфля', 'klasik oyoq kiyim'],
    'botinka': ['batinka', 'bootinki', 'ботинки', 'ботинка', 'qish oyoq kiyim'],
    'shippak': ['shlepka', 'shlepansi', 'тапочки', 'шлепки'],
    'keds': ['kedsi', 'кеды', 'kedi'],
    'sandal': ['sandaliya', 'сандалии', 'yoz oyoq kiyim'],
    
    // Tops
    'futbolka': ['futbalka', 'футболка', 't-shirt', 'tshirt', 'mayka'],
    'ko\'ylak': ['kuylak', 'koylak', 'рубашка', 'shirt', 'koylek'],
    'kurtka': ['kurtki', 'куртка', 'jacket', 'kurta'],
    'palto': ['пальто', 'coat', 'plashch'],
    'sviter': ['svetr', 'свитер', 'sweater', 'jumper', 'пуловер'],
    'hoodie': ['xudi', 'худи', 'tolstovka', 'толстовка'],
    
    // Bottoms
    'jinsi': ['jeans', 'джинсы', 'jinsa', 'jinsy'],
    'shim': ['штаны', 'брюки', 'shimlar', 'pants', 'trouser'],
    'shorty': ['short', 'шорты', 'qisqa shim'],
    'yubka': ['юбка', 'skirt', 'jupka'],
    
    // Suits & Sets
    'kostyum': ['костюм', 'suit', 'kastyum', 'forma'],
    'sport forma': ['sportivka', 'спортивный костюм', 'sportivniy', 'trenirovka kiyimi'],
    
    // Underwear
    'ichki kiyim': ['белье', 'underwear', 'kolgotki', 'колготки'],
    
    // Accessories
    'bosh kiyim': ['шапка', 'shapka', 'kepka', 'кепка', 'hat', 'cap'],
    'kamar': ['ремень', 'belt', 'kamarcha'],
    'sumka': ['сумка', 'bag', 'ryukzak', 'рюкзак', 'backpack'],
  },
  brands: {
    'nike': ['nayk', 'найк', 'naik', 'nyke'],
    'adidas': ['адидас', 'adik', 'adidass'],
    'puma': ['пума', 'pyma'],
    'reebok': ['рибок', 'ribok', 'ribak'],
    'newbalance': ['new balance', 'нью баланс', 'nyubalans', 'nb'],
    'zara': ['зара', 'zarah'],
    'h&m': ['hm', 'h and m', 'эйч энд эм'],
    'gucci': ['гуччи', 'guchi', 'guchchi'],
    'louis vuitton': ['lv', 'луи виттон', 'lui vitton'],
    'chanel': ['шанель', 'shanel'],
    'versace': ['версаче', 'versachi'],
    'armani': ['армани', 'armony'],
    'tommy hilfiger': ['томми хилфигер', 'tomi', 'hilfiger'],
    'lacoste': ['лакост', 'lakost', 'lakosta'],
    'polo': ['поло', 'ralph lauren'],
    'levis': ['левис', 'левайс', 'levi\'s'],
    'wrangler': ['вранглер', 'wranger'],
    'columbia': ['коламбия', 'columbi'],
    'the north face': ['north face', 'норт фейс', 'tnf'],
  },
  attributes: {
    'erkak': ['erkaklar', 'мужской', 'men', 'muzhskoy', 'man'],
    'ayol': ['ayollar', 'женский', 'women', 'zhenskiy', 'woman'],
    'bola': ['bolalar', 'детский', 'kids', 'detskiy', 'child', 'children'],
    'original': ['оригинал', 'orig', 'asl', 'genuine'],
    'replika': ['replica', 'copy', 'nusxa', 'реплика', 'kopiya'],
    'yangi': ['new', 'новый', 'new with tags'],
    'ishlatilgan': ['used', 'б/у', 'bu', 'second hand'],
  }
}

/**
 * Electronics category synonyms
 */
export const ELECTRONICS_SYNONYMS: CategorySynonymConfig = {
  category: 'electronics',
  synonyms: {
    'telefon': ['телефон', 'phone', 'smartphone', 'смартфон', 'mobil', 'uyali'],
    'noutbuk': ['notebook', 'ноутбук', 'laptop', 'лептоп', 'kompyuter', 'komputer'],
    'televizor': ['телевизор', 'tv', 'тв', 'televizr', 'telik'],
    'planshet': ['планшет', 'tablet', 'ipad', 'айпад'],
    'naushnik': ['наушники', 'headphones', 'quloqchin', 'airpods', 'earphones'],
    'kamera': ['camera', 'камера', 'fotoaparat', 'фотоаппарат'],
    'printer': ['принтер', 'printerlar'],
    'proyektor': ['проектор', 'projector'],
  },
  brands: {
    'samsung': ['самсунг', 'sumsung', 'samsunk'],
    'apple': ['эпл', 'iphone', 'айфон', 'macbook', 'макбук'],
    'xiaomi': ['сяоми', 'шаоми', 'mi', 'redmi', 'редми', 'poco'],
    'huawei': ['хуавей', 'huavey', 'хуавэй'],
    'oppo': ['оппо'],
    'vivo': ['виво'],
    'realme': ['реалми', 'realmi'],
    'lg': ['элджи', 'elji'],
    'sony': ['сони', 'сонй'],
    'asus': ['асус'],
    'lenovo': ['леново', 'lenova'],
    'hp': ['эйчпи', 'hewlett packard'],
    'dell': ['делл'],
    'acer': ['асер', 'эйсер'],
  },
  attributes: {
    'yangi': ['new', 'новый', 'zapechatan'],
    'bu': ['б/у', 'used', 'ishlatilgan', 'second hand'],
    'garantiya': ['гарантия', 'warranty', 'kafolat'],
  }
}

/**
 * Automotive category synonyms
 */
export const AUTOMOTIVE_SYNONYMS: CategorySynonymConfig = {
  category: 'automotive',
  synonyms: {
    'mashina': ['машина', 'car', 'avtomobil', 'автомобиль', 'avto'],
    'mototsikl': ['мотоцикл', 'motorcycle', 'moto', 'байк', 'bike'],
    'velosiped': ['велосипед', 'bicycle', 'velo', 'bike'],
    'yuk mashina': ['грузовик', 'truck', 'fura', 'kamaz'],
    'avtobus': ['автобус', 'bus'],
  },
  brands: {
    'nexia': ['нексия', 'neksiya', 'neksia', 'daewoo nexia'],
    'cobalt': ['кобальт', 'cobolt', 'kobalt'],
    'lacetti': ['лачетти', 'lachetti', 'lacety', 'gentra'],
    'malibu': ['малибу', 'malibo', 'maliby'],
    'spark': ['спарк', 'matiz', 'матиз'],
    'damas': ['дамас', 'damass'],
    'toyota': ['тойота', 'tayota', 'toiota'],
    'hyundai': ['хундай', 'хюндай', 'hundai', 'hyunday'],
    'kia': ['киа', 'kiya'],
    'mercedes': ['мерседес', 'mersedes', 'benz', 'мерс'],
    'bmw': ['бмв', 'бэха', 'bexa'],
    'audi': ['ауди', 'avdi'],
    'volkswagen': ['фольксваген', 'vw', 'vagen'],
    'ford': ['форд'],
    'honda': ['хонда', 'xonda'],
    'nissan': ['ниссан', 'nisan'],
    'mazda': ['мазда'],
    'lexus': ['лексус', 'leksus'],
  },
  attributes: {
    'yangi': ['new', 'новый', '0 probeg'],
    'probeg': ['пробег', 'mileage', 'km'],
    'avtomat': ['автомат', 'automatic', 'at'],
    'mexanika': ['механика', 'manual', 'mt', 'ruchnoy'],
  }
}

/**
 * Real Estate category synonyms
 */
export const REALESTATE_SYNONYMS: CategorySynonymConfig = {
  category: 'realestate',
  synonyms: {
    'kvartira': ['квартира', 'apartment', 'flat', 'xonadon'],
    'uy': ['дом', 'house', 'hovli', 'dom'],
    'ofis': ['офис', 'office'],
    'magazin': ['магазин', 'shop', 'dokon', 'store'],
    'yer': ['земля', 'land', 'участок', 'uchastok'],
    'garaj': ['гараж', 'garage'],
  },
  brands: {}, // No brands for real estate
  attributes: {
    'ijara': ['аренда', 'rent', 'sutkalik', 'sutkaga'],
    'sotiladi': ['продажа', 'sale', 'sotish'],
    'yangi': ['новостройка', 'novostroy', 'yangi qurilish'],
    'tamir': ['ремонт', 'repair', 'remont', 'evro remont'],
  }
}

/**
 * Get synonyms for a specific category
 */
export function getCategorySynonyms(category: string): CategorySynonymConfig | null {
  switch (category.toLowerCase()) {
    case 'clothing':
    case 'kiyim-kechak':
    case 'kiyim':
      return CLOTHING_SYNONYMS
    case 'electronics':
    case 'elektronika':
      return ELECTRONICS_SYNONYMS
    case 'automotive':
    case 'transport':
    case 'avtomobil':
      return AUTOMOTIVE_SYNONYMS
    case 'realestate':
    case 'uy-joy':
    case 'kvartira':
      return REALESTATE_SYNONYMS
    default:
      return null
  }
}

/**
 * Find all related terms for a word within a category
 */
export function findCategoryRelatedTerms(word: string, category: string): string[] {
  const config = getCategorySynonyms(category)
  if (!config) return []

  const normalizedWord = word.toLowerCase().trim()
  const related: string[] = []

  // Check synonyms
  for (const [key, values] of Object.entries(config.synonyms)) {
    if (key === normalizedWord || values.some(v => v.toLowerCase() === normalizedWord)) {
      related.push(key, ...values)
    }
  }

  // Check brands
  for (const [key, values] of Object.entries(config.brands)) {
    if (key === normalizedWord || values.some(v => v.toLowerCase() === normalizedWord)) {
      related.push(key, ...values)
    }
  }

  // Check attributes
  for (const [key, values] of Object.entries(config.attributes)) {
    if (key === normalizedWord || values.some(v => v.toLowerCase() === normalizedWord)) {
      related.push(key, ...values)
    }
  }

  // Deduplicate
  return [...new Set(related)]
}

/**
 * Get all brands for a category
 */
export function getCategoryBrands(category: string): string[] {
  const config = getCategorySynonyms(category)
  if (!config) return []
  return Object.keys(config.brands)
}

/**
 * Normalize brand name for a category
 */
export function normalizeCategoryBrand(brand: string, category: string): string {
  const config = getCategorySynonyms(category)
  if (!config) return brand.toLowerCase()

  const normalizedBrand = brand.toLowerCase().trim()

  for (const [key, values] of Object.entries(config.brands)) {
    if (key === normalizedBrand || values.some(v => v.toLowerCase() === normalizedBrand)) {
      return key
    }
  }

  return normalizedBrand
}
