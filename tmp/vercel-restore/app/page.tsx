import { redirect } from 'next/navigation';

export default function HomePage() {
  // Public home: everyone lands on the calculator, no login required.
  redirect('/calculator');
}
