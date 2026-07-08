import { lazyNativeRoute } from '@/components/LazyNativeScreen';

export default lazyNativeRoute(
  () => import('@/screens/native/StreamCallInitiateScreen'),
  'Video calls',
);
