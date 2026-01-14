import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useAppMode } from '../contexts/AppModeContext'
import type { Store, Service } from '../types'
import { 
  ClipboardDocumentIcon, 
  ShareIcon, 
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  InformationCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { initTelegram } from '../lib/telegram'

interface PersonalLinksProps {
  stores: Store[]
  services: Service[]
  hasListings: boolean
  botUsername?: string
}

export default function PersonalLinks({ stores, services, hasListings, botUsername = 'UZCHAT24BOT' }: PersonalLinksProps) {
  const navigate = useNavigate()
  const { user } = useUser()
  const { setAppMode } = useAppMode()
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showHowToInstall, setShowHowToInstall] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = (text: string, type: 'link' | 'text') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(text)
      setTimeout(() => setCopiedLink(null), 2000)
    } else {
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 2000)
    }
  }

  const handleShare = (link: string, title: string) => {
    const webApp = initTelegram()
    if (webApp) {
      webApp.sendData(JSON.stringify({
        type: 'share',
        text: `${title}\n\n${link}`
      }))
    } else {
      // Fallback: copy to clipboard
      handleCopy(link, 'link')
    }
  }

  const handlePreview = (type: 'store' | 'service', id: string) => {
    if (type === 'store') {
      setAppMode({ kind: 'store', storeId: id })
    } else {
      setAppMode({ kind: 'service', serviceId: id })
    }
    navigate('/?ctx=' + type + ':' + id)
  }

  const generateStoreLink = (storeId: string) => {
    return `https://t.me/${botUsername}?start=store_${storeId}`
  }

  const generateServiceLink = (serviceId: string) => {
    // For services, we use service_id
    return `https://t.me/${botUsername}?start=service_${serviceId}`
  }

  const generateStoreText = (store: Store) => {
    return `🛍 ${store.name} do'koni\n\nBuyurtma berish uchun linkni bosing va bot'da tugmani bosing 👇`
  }

  const generateServiceText = () => {
    return `🛠 Xizmatlarim: narxlar va buyurtma 👇`
  }

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Mijozlarga ulashish</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Mijozlar faqat sizning do'kon/xizmatlaringizni ko'radi.
      </p>

      {/* Store Link */}
      {stores.length > 0 && stores[0] ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BuildingStorefrontIcon className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">{stores[0].name} do'koni</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Kanalga ulashing — mijozlar faqat shu do'konni ko'radi
              </p>
              <p className="text-xs text-amber-600 mt-1 italic">
                ⚠️ Linkni bosganda bot'ga o'tadi, u yerda tugmani bosing
              </p>
              <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200 break-all">
                {generateStoreLink(stores[0].store_id)}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-2">
              <button
                onClick={() => handleCopy(generateStoreLink(stores[0].store_id), 'link')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Nusxa olish"
              >
                <ClipboardDocumentIcon className={`w-4 h-4 ${copiedLink === generateStoreLink(stores[0].store_id) ? 'text-green-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => handleShare(generateStoreLink(stores[0].store_id), generateStoreText(stores[0]))}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Ulashish"
              >
                <ShareIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePreview('store', stores[0].store_id)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Ko'rish"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {/* Copy Text Button */}
          <button
            onClick={() => handleCopy(generateStoreText(stores[0]) + '\n' + generateStoreLink(stores[0].store_id), 'text')}
            className="w-full mt-2 py-2 px-3 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            {copiedText === generateStoreText(stores[0]) + '\n' + generateStoreLink(stores[0].store_id) ? 'Nusxalandi!' : 'Matnni nusxalash'}
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-500">🏪 Do'kon linki yo'q</span>
          </div>
          <button
            onClick={() => navigate('/create-store')}
            className="w-full mt-2 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Do'kon ochish
          </button>
        </div>
      )}

      {/* Service Link */}
      {services.length > 0 ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <WrenchScrewdriverIcon className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">Mening xizmatlarim</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Portfolio kabi: xizmatlar ro'yxati + contact
              </p>
              <p className="text-xs text-amber-600 mt-1 italic">
                ⚠️ Linkni bosganda bot'ga o'tadi, u yerda tugmani bosing
              </p>
              <div className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200 break-all">
                {generateServiceLink(services[0].service_id)}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-2">
              <button
                onClick={() => handleCopy(generateServiceLink(services[0].service_id), 'link')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Nusxa olish"
              >
                <ClipboardDocumentIcon className={`w-4 h-4 ${copiedLink === generateServiceLink(services[0].service_id) ? 'text-green-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => handleShare(generateServiceLink(services[0].service_id), generateServiceText())}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Ulashish"
              >
                <ShareIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePreview('service', services[0].service_id)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Ko'rish"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {/* Copy Text Button */}
          <button
            onClick={() => handleCopy(generateServiceText() + '\n' + generateServiceLink(services[0].service_id), 'text')}
            className="w-full mt-2 py-2 px-3 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            {copiedText === generateServiceText() + '\n' + generateServiceLink(services[0].provider_telegram_id) ? 'Nusxalandi!' : 'Matnni nusxalash'}
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-500">🛠 Xizmat linki yo'q</span>
          </div>
          <button
            onClick={() => navigate('/create-service')}
            className="w-full mt-2 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Xizmat yaratish
          </button>
        </div>
      )}

      {/* How It Works Accordion */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900">Qanday ishlaydi?</span>
          </div>
          {showHowItWorks ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {showHowItWorks && (
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">1</span>
              <p>Linkni nusxalang</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">2</span>
              <p>Kanal/Instagram bio/Story'ga joylang</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-xs">3</span>
              <p>Mijoz linkni bossa → bot'ga o'tadi, u yerda "Do'konni Ochish" tugmasini bosing → Mini App ochiladi ✅</p>
            </div>
          </div>
        )}
      </div>

      {/* How To Install Accordion */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowHowToInstall(!showHowToInstall)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900">Qanday o'rnataman?</span>
          </div>
          {showHowToInstall ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {showHowToInstall && (
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📌 Kanalga pin qilish:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                <li>Kanal postiga linkni joylash</li>
                <li>Postni "Pin" qilish</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📝 Kanal bio:</h4>
              <p className="text-gray-700 ml-2">Kanal description'ga link qo'yish</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📸 Telegram story:</h4>
              <p className="text-gray-700 ml-2">Story'ga link + CTA</p>
            </div>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-900 mb-2">Nega foydali?</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✅</span>
            <span>Mijozlar chalg'imaydi (faqat siz)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✅</span>
            <span>Buyurtmalar ko'payadi</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✅</span>
            <span>Statistikani dashboard'da ko'rasiz</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
