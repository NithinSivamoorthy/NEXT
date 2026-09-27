import { Redirect } from 'expo-router';
import { ResetScreen } from '../../features/product/Screens';
export default function DevReset(){return __DEV__?<ResetScreen/>:<Redirect href="/"/>;}
