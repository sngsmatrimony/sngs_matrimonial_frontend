import ProfileDetailView from '@/components/profile/ProfileDetailView';

export const metadata = {
  title: 'Profile | SNGS Matrimonial',
  description: 'View profile details',
};

export default async function ProfilePage({ params }) {
  const { id } = await params;
  return <ProfileDetailView profileId={id} />;
}
