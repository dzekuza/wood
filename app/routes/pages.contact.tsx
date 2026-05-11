import {redirect} from 'react-router';
import type {Route} from './+types/pages.contact';

export async function loader() {
  throw redirect('/contact');
}

export default function LegacyContactRedirect() {
  return null;
}
