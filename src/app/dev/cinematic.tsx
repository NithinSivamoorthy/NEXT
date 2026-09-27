import { Redirect } from 'expo-router';

const Cinematic = __DEV__
  ? require('../../features/dev/cinematic/CinematicScreen').default
  : null;

export default function CinematicRoute() {
  return Cinematic ? <Cinematic /> : <Redirect href="/" />;
}
