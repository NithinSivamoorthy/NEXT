import { Redirect } from 'expo-router';
const Prototype = __DEV__ ? require('../../features/dev/personalization/PersonalizationScreen').default : null;
export default function PersonalizationRoute() {
  return Prototype ? <Prototype /> : <Redirect href="/" />;
}
