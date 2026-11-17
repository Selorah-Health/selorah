import { useSiteContent } from '../../contexts/SiteContentContext';
import Reveal from './Reveal';
import ProductPreview from './ProductPreview';

export default function ProductPreviewSection() {
  const { content } = useSiteContent();
  const section = content.productPreview;

  if (!section.enabled) return null;

  return (
    <section
      id="preview"
      aria-labelledby="preview-heading"
      className="scroll-mt-24 overflow-hidden bg-[#F6F9FC] px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">{section.eyebrow}</p>
            <h2
              id="preview-heading"
              className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-4xl"
            >
              {section.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4B5563]">{section.body}</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <ProductPreview />
        </Reveal>
      </div>
    </section>
  );
}
