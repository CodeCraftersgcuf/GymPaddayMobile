export const categories = [
  { id: 'gym', title: 'Gym', icon: 'barbell', color: '#FF0000' },
  { id: 'supplement', title: 'Supplement', icon: 'medical', color: '#0066FF' },
  { id: 'wears', title: 'Wears', icon: 'shirt', color: '#00AA00' },
  { id: 'others', title: 'Others', icon: 'grid', color: '#8B00FF' },
];
interface ListingItem {
  id: string;
  title: string;
  price: string;
  seller: string;
  timeAgo: string;
  image: string;
  isTopAd?: boolean;
  category: string;
}

export const mockListings: ListingItem[] = [
  {
    id: '1',
    title: '20KG Dumb Bells',
    price: 'N25,000',
    seller: 'Alucard',
    timeAgo: '5 min ago',
    image: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg',
    isTopAd: true,
    category: 'gym',
  },
  {
    id: '2',
    title: '50KG Dumb Bells',
    price: 'N45,000',
    seller: 'Alucard',
    timeAgo: '5 min ago',
    image: 'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg',
    isTopAd: true,
    category: 'gym',
  },
  {
    id: '3',
    title: 'Thread Mill - black',
    price: 'N825,000',
    seller: 'Alucard',
    timeAgo: '5 min ago',
    image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg',
    isTopAd: true,
    category: 'gym',
  },
  {
    id: '4',
    title: '20KG Dumb Bells',
    price: 'N25,000',
    seller: 'Alucard',
    timeAgo: '6 min ago',
    image: 'https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg',
    category: 'gym',
  },
  {
    id: '5',
    title: '20KG Dumb Bells',
    price: 'N25,000',
    seller: 'Alucard',
    timeAgo: '6 min ago',
    image: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
    category: 'gym',
  },
  {
    id: '6',
    title: '20KG Dumb Bells',
    price: 'N25,000',
    seller: 'Alucard',
    timeAgo: '6 min ago',
    image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
    category: 'gym',
  },
  {
    id: '7',
    title: '20KG Dumb Bells',
    price: 'N25,000',
    seller: 'Alucard',
    timeAgo: '6 min ago',
    image: 'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg',
    category: 'gym',
  },
];