
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  const logo = PlaceHolderImages.find(img => img.id === 'neu-logo');
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full bg-white p-1 ${className}`}>
      <Image
        src={logo?.imageUrl || '/placeholder.png'}
        alt="NEU Logo"
        width={100}
        height={100}
        className="object-contain"
        data-ai-hint="university logo"
      />
    </div>
  );
}
