import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Visual Direction Board — Image Workbench',
  description: 'Divergent visual direction examples for the Visual Stage art direction.',
};

type Direction = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  mood: string;
  bestFor: string;
  risk: string;
  shellClass: string;
  heroClass: string;
  panelClass: string;
  accentClass: string;
  textClass: string;
  mutedClass: string;
  ctaClass: string;
  artClass: string;
  previewMode: 'dark-grid' | 'cinema' | 'gallery' | 'creative' | 'luxury' | 'craft';
  tags: string[];
};

const directions: Direction[] = [
  {
    id: 'lunar-precision',
    code: 'A',
    title: 'Lunar Precision',
    subtitle: 'Linear / Raycast 式暗色精密工作台',
    mood: '克制、锋利、专业，像高端创作控制台。',
    bestFor: '偏工具、偏专业用户；强调效率、可控、可靠。',
    risk: '和当前方向接近，差异不够“出圈”。',
    shellClass: 'bg-[#07080a] text-[#f7f8f8]',
    heroClass: 'bg-[radial-gradient(circle_at_18%_0%,rgba(113,112,255,0.35),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(33,180,150,0.16),transparent_28%),linear-gradient(145deg,#0d0e11,#050506)] border-white/10',
    panelClass: 'border-white/[0.08] bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
    accentClass: 'bg-[#7170ff] text-white',
    textClass: 'text-[#f7f8f8]',
    mutedClass: 'text-[#8a8f98]',
    ctaClass: 'border-white/10 bg-white/[0.06] text-[#f7f8f8]',
    artClass: 'from-[#7170ff] via-[#14161b] to-[#08d1a3]',
    previewMode: 'dark-grid',
    tags: ['暗色', '工程精密', '少色高质感'],
  },
  {
    id: 'cinema-studio',
    code: 'B',
    title: 'Cinema Studio',
    subtitle: 'Runway 式电影片场 / 大画面优先',
    mood: '沉浸、影像主导、创作感强，像在剪片/看分镜。',
    bestFor: 'AI 图像产品本体；突出“审美”和视觉成果。',
    risk: '需要更强的图像素材/动效配合，否则容易空。',
    shellClass: 'bg-black text-white',
    heroClass: 'bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.86)),radial-gradient(circle_at_68%_18%,rgba(255,255,255,0.28),transparent_18%),linear-gradient(135deg,#050505,#191919_48%,#000)] border-[#27272a]',
    panelClass: 'border-[#27272a] bg-[#111] shadow-none',
    accentClass: 'bg-white text-black',
    textClass: 'text-white',
    mutedClass: 'text-[#9a9a9a]',
    ctaClass: 'border-white/20 bg-transparent text-white',
    artClass: 'from-[#f4c56a] via-[#6e6e72] to-[#0b0b0c]',
    previewMode: 'cinema',
    tags: ['电影感', '影像第一', '黑场'],
  },
  {
    id: 'atelier-gallery',
    code: 'C',
    title: 'Atelier Gallery',
    subtitle: 'Apple / 高级画廊式白场展示',
    mood: '安静、贵、留白充分，像展示一件完成作品。',
    bestFor: '降低学习压力；给非专业用户一种“这东西很高级但不难”。',
    risk: '控制项多时要隐藏得很优雅，否则白场会显乱。',
    shellClass: 'bg-[#f5f5f7] text-[#1d1d1f]',
    heroClass: 'bg-[linear-gradient(180deg,#ffffff,#f5f5f7)] border-black/[0.06]',
    panelClass: 'border-transparent bg-white shadow-[3px_18px_60px_rgba(0,0,0,0.10)]',
    accentClass: 'bg-[#0071e3] text-white',
    textClass: 'text-[#1d1d1f]',
    mutedClass: 'text-black/55',
    ctaClass: 'border-[#0071e3] bg-transparent text-[#0066cc]',
    artClass: 'from-[#111] via-[#f4f4f6] to-[#0071e3]',
    previewMode: 'gallery',
    tags: ['白场', '高级留白', '作品中心'],
  },
  {
    id: 'creative-board',
    code: 'D',
    title: 'Creative Board',
    subtitle: 'Figma / Miro 式轻快创意板',
    mood: '开放、活泼、有探索感，像把灵感摊在桌面上。',
    bestFor: '吸引兴趣用户；把 Reference / Comparison 做得更自然。',
    risk: '如果彩色太多，容易不够专业；需要严控信息层级。',
    shellClass: 'bg-white text-black',
    heroClass: 'bg-[radial-gradient(circle_at_15%_18%,#7cf7c7,transparent_22%),radial-gradient(circle_at_86%_16%,#ff75c3,transparent_22%),radial-gradient(circle_at_50%_86%,#8b5cf6,transparent_25%),linear-gradient(135deg,#fff6a8,#ffffff_42%,#e9f7ff)] border-black/10',
    panelClass: 'border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.10)]',
    accentClass: 'bg-black text-white',
    textClass: 'text-black',
    mutedClass: 'text-black/60',
    ctaClass: 'border-black bg-white text-black',
    artClass: 'from-[#00d084] via-[#ffd02f] to-[#8b5cf6]',
    previewMode: 'creative',
    tags: ['彩色', '灵感板', '开放探索'],
  },
  {
    id: 'velvet-suite',
    code: 'E',
    title: 'Velvet Suite',
    subtitle: 'Superhuman / Luxury SaaS 式紫色礼盒',
    mood: '精致、柔和、礼盒感，像高级效率产品的创作套件。',
    bestFor: '想要“高级但亲近”；兼顾专业与非专业用户。',
    risk: '紫色品牌记忆强，若不想显得偏女性/偏软，需要更硬的材质感。',
    shellClass: 'bg-[#ffffff] text-[#292827]',
    heroClass: 'bg-[radial-gradient(circle_at_75%_12%,rgba(203,183,251,0.7),transparent_24%),linear-gradient(135deg,#1b1938,#37275f_52%,#ffffff_110%)] border-white/20',
    panelClass: 'border-[#dcd7d3] bg-white shadow-[0_20px_70px_rgba(41,40,39,0.13)]',
    accentClass: 'bg-[#e9e5dd] text-[#292827]',
    textClass: 'text-[#292827]',
    mutedClass: 'text-[#6f6962]',
    ctaClass: 'border-[#dcd7d3] bg-[#e9e5dd] text-[#292827]',
    artClass: 'from-[#1b1938] via-[#cbb7fb] to-[#e9e5dd]',
    previewMode: 'luxury',
    tags: ['轻奢', '紫色', '温柔专业'],
  },
  {
    id: 'warm-craft',
    code: 'F',
    title: 'Warm Craft',
    subtitle: 'Clay 式温暖手作 / 彩色卡片',
    mood: '亲切、有玩心、像一本可操作的创作手册。',
    bestFor: '让新用户不害怕；把复杂流程拆成有趣卡片。',
    risk: '如果目标是极致专业，可能显得偏玩具化。',
    shellClass: 'bg-[#faf9f7] text-black',
    heroClass: 'bg-[radial-gradient(circle_at_15%_18%,rgba(132,231,165,0.55),transparent_22%),radial-gradient(circle_at_88%_20%,rgba(251,189,65,0.62),transparent_24%),linear-gradient(135deg,#faf9f7,#fff)] border-[#dad4c8]',
    panelClass: 'border-[#dad4c8] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.10),0_-1px_1px_rgba(0,0,0,0.04)_inset]',
    accentClass: 'bg-[#fbbd41] text-black',
    textClass: 'text-black',
    mutedClass: 'text-[#55534e]',
    ctaClass: 'border-black bg-white text-black shadow-[-5px_5px_0_#000]',
    artClass: 'from-[#84e7a5] via-[#fbbd41] to-[#fc7981]',
    previewMode: 'craft',
    tags: ['温暖', '手作感', '彩色卡片'],
  },
];

function MiniPreview({ direction }: { direction: Direction }) {
  if (direction.previewMode === 'cinema') {
    return <div className="grid h-full min-h-[22rem] grid-rows-[1.4fr_0.8fr] gap-3">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', direction.artClass)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.38),transparent_18%),linear-gradient(180deg,transparent,rgba(0,0,0,0.82))]" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-white/60">Reference cut 03</p>
          <h3 className="mt-2 text-3xl tracking-[-0.06em] text-white">Hero frame before prompt</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <div className="h-20 rounded-xl bg-gradient-to-br from-white/25 to-white/[0.03]" />
          <p className="mt-3 text-xs text-white/55">Shot 0{item}</p>
        </div>)}
      </div>
    </div>;
  }

  if (direction.previewMode === 'gallery') {
    return <div className="grid h-full min-h-[22rem] content-center gap-4">
      <div className="mx-auto grid size-56 place-items-center rounded-[3rem] bg-[linear-gradient(145deg,#111,#3a3a3c)] shadow-[0_28px_80px_rgba(0,0,0,0.2)]">
        <div className="size-32 rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffffff,#d8d8dd_32%,#111_72%)]" />
      </div>
      <div className="mx-auto max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-black/45">Champion preview</p>
        <h3 className="mt-2 text-4xl font-semibold tracking-[-0.055em]">One image, one decision.</h3>
      </div>
      <div className="mx-auto flex gap-3">
        <span className="rounded-full bg-[#0071e3] px-4 py-2 text-sm text-white">Use this</span>
        <span className="rounded-full border border-[#0071e3] px-4 py-2 text-sm text-[#0066cc]">Compare</span>
      </div>
    </div>;
  }

  if (direction.previewMode === 'creative') {
    return <div className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] bg-white/40 p-4">
      <div className="absolute left-8 top-8 h-24 w-36 rotate-[-5deg] rounded-[1.25rem] bg-[#00d084] shadow-[0_18px_40px_rgba(0,0,0,0.12)]" />
      <div className="absolute right-8 top-12 h-32 w-28 rotate-[7deg] rounded-[1.5rem] bg-[#ffd02f] shadow-[0_18px_40px_rgba(0,0,0,0.12)]" />
      <div className="absolute bottom-16 left-14 h-32 w-32 rotate-[4deg] rounded-full bg-[#8b5cf6] shadow-[0_18px_40px_rgba(0,0,0,0.16)]" />
      <div className="absolute bottom-8 right-12 h-28 w-44 rotate-[-4deg] rounded-[1.5rem] bg-[#ff75c3] shadow-[0_18px_40px_rgba(0,0,0,0.12)]" />
      <div className="relative mx-auto mt-24 max-w-xs rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.13)]">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-black/50">Creation Case</p>
        <h3 className="mt-2 text-3xl tracking-[-0.06em]">Mood before settings</h3>
        <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-black px-3 py-1 text-white">Reference</span><span className="rounded-full border border-black px-3 py-1">Draft</span></div>
      </div>
    </div>;
  }

  if (direction.previewMode === 'luxury') {
    return <div className="grid min-h-[22rem] gap-4 rounded-[1.75rem] bg-white/15 p-4">
      <div className="rounded-[1.5rem] border border-white/20 bg-white/10 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Visual concierge</p>
        <h3 className="mt-3 text-4xl tracking-[-0.06em]">A composed suite for every creation.</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[1rem] bg-[#e9e5dd] p-4 text-[#292827]"><b>Champion</b><p className="mt-2 text-sm opacity-70">Soft confidence, no noise.</p></div>
        <div className="rounded-[1rem] border border-white/20 bg-white/10 p-4 text-white"><b>Alternatives</b><p className="mt-2 text-sm text-white/65">Curated, not crowded.</p></div>
      </div>
    </div>;
  }

  if (direction.previewMode === 'craft') {
    return <div className="grid min-h-[22rem] gap-4 rounded-[2rem] border border-[#dad4c8] bg-[#faf9f7] p-4">
      <div className="grid grid-cols-[1fr_0.8fr] gap-4">
        <div className="rounded-[1.5rem] border border-[#dad4c8] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.10)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#55534e]">Idea card</p>
          <h3 className="mt-3 text-4xl font-semibold tracking-[-0.07em]">Make it feel handmade, not hand-holdy.</h3>
        </div>
        <div className="rotate-[3deg] rounded-[1.5rem] border border-black bg-[#fbbd41] p-5 shadow-[-7px_7px_0_#000]"><b>Pick me</b></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['Matcha', 'Slushie', 'Ube'].map((label, index) => <div key={label} className={cn('rounded-2xl border border-[#dad4c8] p-3 text-sm', index === 0 ? 'bg-[#84e7a5]' : index === 1 ? 'bg-[#3bd3fd]' : 'bg-[#c1b0ff]')}>{label}</div>)}
      </div>
    </div>;
  }

  return <div className="grid min-h-[22rem] gap-4">
    <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 shadow-[inset_0_0_80px_rgba(113,112,255,0.12)]">
      <div className={cn('h-44 rounded-[1.25rem] bg-gradient-to-br', direction.artClass)} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-2 rounded-full bg-white/70" /><div className="h-2 rounded-full bg-white/25" /><div className="h-2 rounded-full bg-white/25" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><b>Champion</b><p className="mt-2 text-sm text-white/55">Precise winner state</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><b>Router</b><p className="mt-2 text-sm text-white/55">Calm system logic</p></div>
    </div>
  </div>;
}

function DirectionCard({ direction }: { direction: Direction }) {
  return <section id={direction.id} data-testid={`visual-direction-${direction.code}`} className={cn('overflow-hidden rounded-[2.5rem] border p-4 md:p-6', direction.shellClass, direction.heroClass)}>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="grid content-between gap-8 p-2 md:p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('grid size-10 place-items-center rounded-full text-sm font-semibold', direction.accentClass)}>{direction.code}</span>
            <Badge variant="outline" className={cn('rounded-full border-current/20 bg-transparent', direction.textClass)}>{direction.subtitle}</Badge>
          </div>
          <h2 className={cn('mt-6 text-4xl font-semibold leading-[0.95] tracking-[-0.075em] md:text-6xl', direction.textClass)}>{direction.title}</h2>
          <p className={cn('mt-5 max-w-xl text-base leading-7 md:text-lg', direction.mutedClass)}>{direction.mood}</p>
        </div>

        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {direction.tags.map((tag) => <span key={tag} className={cn('rounded-full border px-3 py-1 text-xs', direction.ctaClass)}>{tag}</span>)}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className={cn('rounded-[1.25rem]', direction.panelClass)}>
              <CardContent className="p-4">
                <p className={cn('text-xs uppercase tracking-[0.2em]', direction.mutedClass)}>适合</p>
                <p className={cn('mt-2 text-sm leading-6', direction.textClass)}>{direction.bestFor}</p>
              </CardContent>
            </Card>
            <Card className={cn('rounded-[1.25rem]', direction.panelClass)}>
              <CardContent className="p-4">
                <p className={cn('text-xs uppercase tracking-[0.2em]', direction.mutedClass)}>风险</p>
                <p className={cn('mt-2 text-sm leading-6', direction.textClass)}>{direction.risk}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className={cn('rounded-[2rem] border p-3 md:p-4', direction.panelClass)}>
        <MiniPreview direction={direction} />
      </div>
    </div>
  </section>;
}

export default function VisualDirectionsPage() {
  return <main data-testid="visual-directions-board" className="relative min-w-0 overflow-hidden bg-[#0b0b0c] pb-12 text-white">
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge className="rounded-full bg-white text-black">Visual Direction Board</Badge>
          <span className="text-xs uppercase tracking-[0.24em] text-white/45">Pick one direction, not a theme token</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.075em] md:text-7xl">不再被当前主题困住：先选艺术方向，再落设计系统。</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/58 md:text-lg">下面是 6 个可用于 Image Workbench / Visual Stage 的高保真风格方向。它们不是换色，而是不同的产品气质、信息密度、材质和交互姿态。</p>
          </div>
          <div className="grid gap-2 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 text-sm text-white/62">
            <b className="text-white">怎么选</b>
            <span>想要专业工具感 → A</span>
            <span>想要 AI 影像审美证明 → B</span>
            <span>想要高级但低门槛 → C / E</span>
            <span>想要更有创作兴趣和亲和力 → D / F</span>
          </div>
        </div>
        <nav aria-label="visual direction anchors" className="flex flex-wrap gap-2">
          {directions.map((direction) => <a key={direction.id} href={`#${direction.id}`} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:bg-white hover:text-black">{direction.code} · {direction.title}</a>)}
        </nav>
      </div>

      <div className="grid gap-6">
        {directions.map((direction) => <DirectionCard key={direction.id} direction={direction} />)}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-white/70">
        <b className="text-white">我的初判</b>
        <p className="mt-2 leading-7">如果目标是让产品一眼证明“会审美”，优先看 B Cinema Studio；如果目标是让非专业用户愿意开始，优先看 C Atelier Gallery 或 E Velvet Suite；如果想摆脱后台工具味但保留专业控制，A 可以作为底层系统但不要作为唯一视觉母题。</p>
      </div>
    </section>
  </main>;
}
