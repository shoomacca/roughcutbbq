import type { Metadata } from 'next';
import IdeasClient from '@/components/ideas/IdeasClient';

export const metadata: Metadata = {
  title: 'Cook Ideas — What Can I Cook With What I Have?',
  description:
    'Pick your cooker — smoker, kamado, kettle, oven, slow cooker, pressure cooker or dehydrator — and what is in the fridge. Get matched cuts, times, temps, recipes, woods and rubs.',
};

export default function IdeasPage() {
  return <IdeasClient />;
}
