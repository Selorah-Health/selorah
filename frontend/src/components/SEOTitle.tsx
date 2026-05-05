import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOTitleProps {
  title: string;
}

export default function SEOTitle({ title }: SEOTitleProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | Selorah Health`;
  }, [title, location]);

  return null;
}
