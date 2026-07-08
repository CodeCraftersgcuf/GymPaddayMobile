import { lazyNativeRoute } from '@/components/LazyNativeScreen';

export default lazyNativeRoute(
  () => import('@/screens/native/StreamIncomingCall'),
  'Incoming calls',
);
