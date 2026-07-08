import { lazyNativeRoute } from '@/components/LazyNativeScreen';

export default lazyNativeRoute(
  () => import('@/screens/native/daily-call-screen'),
  'Calls',
);
