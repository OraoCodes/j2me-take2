
import { Helmet } from "react-helmet";

interface MetaTagsProps {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
}

export const MetaTags = ({ title, description, imageUrl, url }: MetaTagsProps) => {
  const absoluteImageUrl = imageUrl ? 
    (imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`) 
    : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {absoluteImageUrl && (
        <meta property="og:image" content={absoluteImageUrl} />
      )}
      {absoluteImageUrl && (
        <meta name="twitter:image" content={absoluteImageUrl} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
