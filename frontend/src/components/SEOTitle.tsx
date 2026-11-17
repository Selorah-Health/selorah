import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOTitleProps {
  title: string;
  description?: string;
}

export default function SEOTitle({ title, description }: SEOTitleProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | Selorah Health`;

    if (!description) return;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description, location]);

  return null;
}
