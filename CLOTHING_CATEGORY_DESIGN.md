# "Nima sotmoqchisiz?" Qismi - Dizayn va Arxitektura

## Umumiy ko'rinish

Bu qism `ClothingListingWizard.tsx` komponentida **Step 1: Kategoriya tanlash** sifatida amalga oshirilgan.

## Arxitektura

### 1. **3 bosqichli tanlov tizimi**

```
Step 1.1: Audience (Kim uchun?) 
    ↓
Step 1.2: Segment (Qanday kiyim?)
    ↓
Step 1.3: Item (Aniq turini tanlang)
    ↓
Selected Taxonomy Display
```

### 2. **State Management**

```typescript
// Taxonomy selection state
const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null)
const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
const [selectedTaxonomy, setSelectedTaxonomy] = useState<TaxonNode | null>(null)

// Computed values
const availableSegments = useMemo(() => {
  if (!selectedAudience) return []
  const segments = new Set<Segment>()
  CLOTHING_TAXONOMY.filter(t => t.audience === selectedAudience)
    .forEach(t => segments.add(t.segment))
  return SEGMENT_OPTIONS.filter(s => segments.has(s.value))
}, [selectedAudience])

const availableItems = useMemo(() => {
  if (!selectedAudience || !selectedSegment) return []
  return CLOTHING_TAXONOMY.filter(
    t => t.audience === selectedAudience && 
         t.segment === selectedSegment && 
         t.leaf
  )
}, [selectedAudience, selectedSegment])
```

### 3. **Data Structures**

#### AUDIENCE_OPTIONS
```typescript
const AUDIENCE_OPTIONS: { 
  value: Audience; 
  label: string; 
  emoji: string; 
  iconName?: keyof typeof import('../utils/icons8').Icons8 
}[] = [
  { value: 'erkak', label: 'Erkaklar', emoji: '👔', iconName: 'male' },
  { value: 'ayol', label: 'Ayollar', emoji: '👗', iconName: 'female' },
  { value: 'unisex', label: 'Unisex', emoji: '👕', iconName: 'unisex' },
  { value: 'bola', label: 'Bolalar', emoji: '👶', iconName: 'baby' }
]
```

#### SEGMENT_OPTIONS
```typescript
const SEGMENT_OPTIONS: { 
  value: Segment; 
  label: string; 
  emoji: string; 
  iconName?: keyof typeof import('../utils/icons8').Icons8 
}[] = [
  { value: 'ustki_kiyim', label: 'Ustki kiyim', emoji: '🧥', iconName: 'jacket' },
  { value: 'pastki_kiyim', label: 'Pastki kiyim', emoji: '👖', iconName: 'pants' },
  { value: 'oyoq_kiyim', label: 'Oyoq kiyim', emoji: '👟', iconName: 'shoes' },
  // ... va boshqalar
]
```

## Dizayn Detallari

### Step 1.1: Audience Selection

**Layout:**
- **Grid:** `grid-cols-2 gap-3`
- **Card Style:** 
  - `p-5 rounded-2xl`
  - `bg-white/10 backdrop-blur-sm`
  - `border border-white/10`
  - `hover:border-purple-400 hover:bg-white/20`

**Visual Elements:**
- Icon: `Icons8Icon` (32px) yoki emoji (4xl)
- Label: `text-white font-medium`

**Code:**
```tsx
{!selectedAudience && (
  <div className="space-y-3">
    <p className="text-white/60 text-sm text-center mb-4">
      Kim uchun mo'ljallangan?
    </p>
    <div className="grid grid-cols-2 gap-3">
      {AUDIENCE_OPTIONS.map(option => (
        <button
          key={option.value}
          onClick={() => {
            setSelectedAudience(option.value)
            setSelectedSegment(null)
            setSelectedTaxonomy(null)
          }}
          className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm 
                     border border-white/10 hover:border-purple-400 
                     hover:bg-white/20 transition-all flex flex-col 
                     items-center gap-2"
        >
          {option.iconName ? (
            <Icons8Icon name={option.iconName} size={32} className="opacity-90" />
          ) : (
            <span className="text-4xl">{option.emoji}</span>
          )}
          <span className="text-white font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Step 1.2: Segment Selection

**Layout:**
- **Back Button:** ArrowLeftIcon bilan orqaga qaytish
- **Grid:** `grid-cols-2 gap-3`
- **Card Style:** Xuddi Step 1.1 kabi, lekin icon 28px

**Code:**
```tsx
{selectedAudience && !selectedSegment && (
  <div className="space-y-3">
    <button 
      onClick={() => setSelectedAudience(null)}
      className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {AUDIENCE_OPTIONS.find(a => a.value === selectedAudience)?.label}
    </button>
    
    <p className="text-white/60 text-sm text-center mb-4">Qanday kiyim?</p>
    <div className="grid grid-cols-2 gap-3">
      {availableSegments.map(option => (
        <button
          key={option.value}
          onClick={() => {
            setSelectedSegment(option.value)
            setSelectedTaxonomy(null)
          }}
          className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm 
                     border border-white/10 hover:border-purple-400 
                     hover:bg-white/20 transition-all flex flex-col 
                     items-center gap-2"
        >
          {option.iconName ? (
            <Icons8Icon name={option.iconName} size={28} className="opacity-90" />
          ) : (
            <span className="text-3xl">{option.emoji}</span>
          )}
          <span className="text-white font-medium text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Step 1.3: Item Selection

**Layout:**
- **Back Button:** Segment nomi bilan orqaga qaytish
- **Grid:** `grid-cols-2 gap-3`
- **Scrollable:** `max-h-[60vh] overflow-y-auto`
- **Card Style:** Text-left, ikki qatorli (label + synonyms)

**Code:**
```tsx
{selectedAudience && selectedSegment && !selectedTaxonomy && (
  <div className="space-y-3">
    <button 
      onClick={() => setSelectedSegment(null)}
      className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {SEGMENT_OPTIONS.find(s => s.value === selectedSegment)?.label}
    </button>
    
    <p className="text-white/60 text-sm text-center mb-4">Aniq turini tanlang</p>
    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-4">
      {availableItems.map(item => (
        <button
          key={item.id}
          onClick={() => setSelectedTaxonomy(item)}
          className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm 
                     border border-white/10 hover:border-purple-400 
                     hover:bg-white/20 transition-all text-left"
        >
          <span className="text-white font-medium text-sm">{item.labelUz}</span>
          {item.synonymsUz && item.synonymsUz.length > 0 && (
            <p className="text-white/40 text-xs mt-1 truncate">
              {item.synonymsUz.slice(0, 2).join(', ')}
            </p>
          )}
        </button>
      ))}
    </div>
  </div>
)}
```

### Selected Taxonomy Display

**Layout:**
- **Gradient Card:** `bg-gradient-to-br from-purple-500/20 to-pink-500/20`
- **Border:** `border border-purple-500/30`
- **Check Icon:** Gradient circle background
- **Badges:** Audience va Segment uchun pill badges
- **Remove Button:** XMarkIcon

**Code:**
```tsx
{selectedTaxonomy && (
  <div className="space-y-4">
    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 
                    to-pink-500/20 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r 
                          from-purple-500 to-pink-500 flex items-center justify-center">
            <CheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">{selectedTaxonomy.labelUz}</p>
            <p className="text-white/60 text-xs">{selectedTaxonomy.pathUz}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedTaxonomy(null)
            setSelectedSegment(null)
            setSelectedAudience(null)
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-white/60" />
        </button>
      </div>
      
      {/* Quick info badges */}
      <div className="flex flex-wrap gap-2">
        {/* Audience badge */}
        {/* Segment badge */}
      </div>
    </div>
  </div>
)}
```

## Styling Details

### Color Palette
- **Background:** `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`
- **Cards:** `bg-white/10 backdrop-blur-sm`
- **Borders:** `border-white/10` → `hover:border-purple-400`
- **Text:** `text-white` (various opacity: `/80`, `/60`, `/40`)
- **Accent:** `purple-500`, `pink-500`

### Animations
- **Fade In:** `animate-fadeIn` (Step o'zgarganda)
- **Hover:** `hover:border-purple-400 hover:bg-white/20`
- **Transitions:** `transition-all`

### Typography
- **Headers:** `text-white/60 text-sm text-center`
- **Labels:** `text-white font-medium`
- **Secondary:** `text-white/40 text-xs`

## UX Features

1. **Breadcrumb Navigation:** Har bir bosqichda orqaga qaytish imkoniyati
2. **Visual Feedback:** Hover states, selected states
3. **Progressive Disclosure:** Bir vaqtning o'zida faqat kerakli ma'lumotlar ko'rsatiladi
4. **Search/Filter:** Hozircha yo'q, lekin qo'shish mumkin
5. **Synonyms Display:** Item selection'da sinonimlar ko'rsatiladi

## Data Flow

```
User clicks Audience
  ↓
setSelectedAudience(value)
  ↓
availableSegments computed (useMemo)
  ↓
User clicks Segment
  ↓
setSelectedSegment(value)
  ↓
availableItems computed (useMemo)
  ↓
User clicks Item
  ↓
setSelectedTaxonomy(item)
  ↓
Step 1 validated → can proceed to Step 2
```

## Integration Points

1. **CLOTHING_TAXONOMY:** `src/taxonomy/clothing.uz.ts` - Asosiy ma'lumotlar
2. **Icons8Icon:** `src/components/Icons8Icon.tsx` - Premium ikonkalar
3. **buildTagsFromSelection:** `src/taxonomy/clothing.utils.ts` - Tag generatsiya

## Performance Optimizations

1. **useMemo:** `availableSegments` va `availableItems` memoized
2. **Conditional Rendering:** Faqat kerakli qismlar render qilinadi
3. **Lazy Loading:** Scrollable item list (max-h-[60vh])

## Accessibility

- Semantic HTML buttons
- Clear labels
- Visual feedback
- Keyboard navigation (browser default)

## Future Improvements

1. Search functionality for items
2. Recent selections
3. Popular items highlighting
4. Image previews for segments
5. Multi-select for some categories
