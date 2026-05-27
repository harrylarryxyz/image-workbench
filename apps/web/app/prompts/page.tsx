import Link from 'next/link';
import { apiGet } from '../../lib/api';

export default async function PromptsPage() {
  const prompts = await apiGet<any[]>('/prompts').catch((error) => [{ error: String(error) }]);
  return <section>
    <div className="hero">
      <p className="eyebrow">Prompt Library</p>
      <h1>提示词库</h1>
      <p className="sub">保存常用 prompt 和风格模板。点击“套用”会带着 prompt 回到 Generate 页面。</p>
    </div>
    <div className="actions" style={{marginTop: 16}}>
      <form action="/api/prompts/seed" method="post"><button className="pill" type="submit">初始化内置模板</button></form>
    </div>
    <div className="grid" style={{marginTop: 20}}>
      <form className="card" action="/api/prompts" method="post">
        <p className="eyebrow">New Prompt</p>
        <label>标题</label>
        <input name="title" placeholder="例如：产品海报模板" />
        <label>Tags，用逗号分隔</label>
        <input name="tags" placeholder="poster, product" />
        <label>Prompt</label>
        <textarea name="content" placeholder="输入提示词模板，支持 [subject] 这样的占位符" />
        <button className="btn" type="submit">保存 Prompt</button>
      </form>
      <div className="gallery">
        {prompts.map((prompt, i) => {
          const reuseHref = `/?prompt=${encodeURIComponent(prompt.content ?? '')}`;
          return <div className="card" key={prompt.id ?? i}>
            <h3>{prompt.title ?? 'Prompt'}</h3>
            <p>{prompt.content ?? prompt.error}</p>
            <div className="actions">
              <Link className="pill" href={reuseHref}>套用</Link>
              {prompt.tags?.map((tag: string) => <span className="pill" key={tag}>{tag}</span>)}
            </div>
            <div className="muted">{prompt.source ?? 'manual'} · {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString() : ''}</div>
          </div>;
        })}
      </div>
    </div>
  </section>;
}
