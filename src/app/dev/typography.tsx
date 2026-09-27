import { Redirect } from 'expo-router';

// Keep the audition module and its font imports out of the production branch.
const Audition = __DEV__
  ? require('../../features/dev/typography/TypographyAudition').default
  : null;

export default function TypographyRoute() {
  return Audition ? <Audition /> : <Redirect href="/" />;
}
