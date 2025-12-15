'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toastError, toastSuccess } from '@/lib/toast';
import { ArrowLeft, Edit2, Trash2, Power } from 'lucide-react';
import Image from 'next/image';

const RELIGIONS = [
  'Hindu', 'Muslim - Shia', 'Muslim - Sunni', 'Muslim - Others', 'Christian', 'Sikh',
  'Jain - Digambar', 'Jain - Swetambar', 'Jain - Others', 'Parsi', 'Buddhist', 'Jewish', 'Inter-Religion'
];

const NAKSHATRAS = [
  'Aswathi', 'Bharani', 'Karthika', 'Rohini', 'Makayiram', 'Thiruvathira', 'Punartham',
  'Pooyam', 'Ayilyam', 'Makam', 'Pooram', 'Uthram', 'Atham', 'Chithira', 'Chothy',
  'Vishakham', 'Anizham', 'Thrikketta', 'Moolam', 'Pooradam', 'Uthradam', 'Thiruvonam',
  'Avittam', 'Chathayam', 'Pooruruttathi', 'Uthrattathi', 'Revathi'
];

const RAASIS = [
  'Mesham', 'Vrushabham', 'Mithunam', 'Karkatakam', 'Simham', 'Kanni',
  'Tulam', 'Vrishchikam', 'Dhanus', 'Makaram', 'Kumbam', 'Meenam'
];

const INTERESTS = [
  'Painting', 'Coding', 'Poetry', 'Reading', 'Writing', 'Photography', 'Music',
  'Dancing', 'Cooking', 'Traveling', 'Gardening', 'Sports', 'Fitness', 'Yoga',
  'Meditation', 'Gaming', 'Movies', 'Theater', 'Volunteering', 'Fashion'
];

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      const response = await adminApi.getUserById(userId);
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updateData) => adminApi.updateUser(userId, updateData),
    onSuccess: () => {
      toastSuccess('User updated successfully');
      setIsEditMode(false);
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => adminApi.deactivateUser(userId),
    onSuccess: () => {
      toastSuccess('User deactivated successfully');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateUser(userId),
    onSuccess: () => {
      toastSuccess('User activated successfully');
      refetch();
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to activate user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(userId),
    onSuccess: () => {
      toastSuccess('User deleted successfully');
      router.push('/admin/users');
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to delete user');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading user. Please try again.</p>
      </div>
    );
  }

  const user = data;
  if (!user) return null;

  const handleSaveEdit = () => {
    updateMutation.mutate(editData);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({...prev, [field]: value}));
  };

  const handleNestedChange = (parent, field, value) => {
    setEditData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, item) => {
    setEditData(prev => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(item)) {
        return {...prev, [field]: currentArray.filter(i => i !== item)};
      } else {
        return {...prev, [field]: [...currentArray, item]};
      }
    });
  };

  const displayValue = (value) => value || '-';

  return (
    <div className="flex justify-center">
      <div className="max-w-4xl space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-viga text-secondary">{user.fullName}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditData({...user});
                  setIsEditMode(true);
                }}
              >
                <Edit2 size={16} className="mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* User Status and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Account Status</p>
                <Badge variant={user.isActive ? 'default' : 'secondary'} className="w-fit">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap">
                {user.isActive ? (
                  <Button
                    variant="outline"
                    className="text-amber-600 hover:text-white"
                    onClick={() => setShowDeactivateDialog(true)}
                  >
                    <Power size={16} className="mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="text-success"
                    onClick={() => activateMutation.mutate()}
                    disabled={activateMutation.isPending}
                  >
                    <Power size={16} className="mr-2" />
                    Activate
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="text-destructive hover:text-white"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture */}
        {user.profilePicture?.url && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-48 h-48">
                <Image
                  src={user.profilePicture.url}
                  alt={user.fullName}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Mode */}
        {isEditMode ? (
          <Card className="border-primary bg-white">
            <CardHeader>
              <CardTitle>Edit User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="grid w-full grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'basic'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Basic
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'profile'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('professional')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'professional'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => setActiveTab('family')}
                    className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ease-in-out ${
                      activeTab === 'family'
                        ? 'bg-primary text-black'
                        : 'bg-white text-black border-2 border-black shadow-md'
                    }`}
                  >
                    Family & Misc
                  </button>
                </div>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <Input
                        value={editData?.fullName || ''}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input
                        type="email"
                        value={editData?.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                      <Input value={user.mobileNumber} disabled />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile</label>
                      <Input
                        value={editData?.alternateMobileNumber || ''}
                        onChange={(e) => handleInputChange('alternateMobileNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SNGS Membership #</label>
                      <Input
                        value={editData?.sngsMembershipNumber || ''}
                        onChange={(e) => handleInputChange('sngsMembershipNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <Input
                        type="date"
                        value={editData?.dateOfBirth ? new Date(editData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('dateOfBirth', new Date(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <Select value={editData?.gender || ''} onValueChange={(val) => handleInputChange('gender', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Seeking Gender</label>
                      <Select value={editData?.seekingGender || ''} onValueChange={(val) => handleInputChange('seekingGender', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Profile Details Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                      <Select value={editData?.maritalStatus || ''} onValueChange={(val) => handleInputChange('maritalStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Never Married">Never Married</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Awaiting Divorce">Awaiting Divorce</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                      <Input
                        value={editData?.motherTongue || ''}
                        onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                      <Input
                        value={editData?.height || ''}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <Input
                        type="number"
                        value={editData?.weight || ''}
                        onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complexion</label>
                      <Select value={editData?.complexion || 'none'} onValueChange={(val) => handleInputChange('complexion', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select complexion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Very Fair">Very Fair</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Wheatish">Wheatish</SelectItem>
                          <SelectItem value="Wheatish Brown">Wheatish Brown</SelectItem>
                          <SelectItem value="Dark">Dark</SelectItem>
                          <SelectItem value="Very Dark">Very Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Physical Status</label>
                      <Select value={editData?.physicalStatus || ''} onValueChange={(val) => handleInputChange('physicalStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Physically Challenged">Physically Challenged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                      <Select value={editData?.bloodGroup || 'none'} onValueChange={(val) => handleInputChange('bloodGroup', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="Don't Know">Don&apos;t Know</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                      <Select value={editData?.diet || 'none'} onValueChange={(val) => handleInputChange('diet', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                          <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                      <Select value={editData?.religion || ''} onValueChange={(val) => handleInputChange('religion', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIGIONS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                      <Input
                        value={editData?.caste || ''}
                        onChange={(e) => handleInputChange('caste', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nakshatra</label>
                      <Select value={editData?.nakshatra || ''} onValueChange={(val) => handleInputChange('nakshatra', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nakshatra" />
                        </SelectTrigger>
                        <SelectContent>
                          {NAKSHATRAS.map(n => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Raasi</label>
                      <Select value={editData?.raasi || ''} onValueChange={(val) => handleInputChange('raasi', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select raasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {RAASIS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent value="professional" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                      <Input
                        value={editData?.education || ''}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                      <Input
                        value={editData?.occupation || ''}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                      <Select value={editData?.employmentType || ''} onValueChange={(val) => handleInputChange('employmentType', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salaried - Private">Salaried - Private</SelectItem>
                          <SelectItem value="Salaried - Government">Salaried - Government</SelectItem>
                          <SelectItem value="Self Employed">Self Employed</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Defense">Defense</SelectItem>
                          <SelectItem value="Not Working">Not Working</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (Min)</label>
                      <Input
                        type="number"
                        value={editData?.annualIncome?.min || ''}
                        onChange={(e) => handleNestedChange('annualIncome', 'min', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income (Max)</label>
                      <Input
                        type="number"
                        value={editData?.annualIncome?.max || ''}
                        onChange={(e) => handleNestedChange('annualIncome', 'max', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <Input
                        value={editData?.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <Input
                        value={editData?.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <Input
                        value={editData?.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info</label>
                      <Textarea
                        value={editData?.additionalInfo || ''}
                        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Family & Misc Tab */}
                <TabsContent value="family" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Family Status</label>
                      <Select value={editData?.familyStatus || ''} onValueChange={(val) => handleInputChange('familyStatus', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Middle Class">Middle Class</SelectItem>
                          <SelectItem value="Upper Middle Class">Upper Middle Class</SelectItem>
                          <SelectItem value="Rich / Affluent">Rich / Affluent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Residential Status</label>
                      <Select value={editData?.residentialStatus || 'none'} onValueChange={(val) => handleInputChange('residentialStatus', val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Owned">Owned</SelectItem>
                          <SelectItem value="Rented">Rented</SelectItem>
                          <SelectItem value="Sub-tenant">Sub-tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Father Name</label>
                      <Input
                        value={editData?.fatherName || ''}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Father Occupation</label>
                      <Input
                        value={editData?.fatherOccupation || ''}
                        onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Name</label>
                      <Input
                        value={editData?.motherName || ''}
                        onChange={(e) => handleInputChange('motherName', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mother Occupation</label>
                      <Input
                        value={editData?.motherOccupation || ''}
                        onChange={(e) => handleInputChange('motherOccupation', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
                      <Textarea
                        value={editData?.hobbies || ''}
                        onChange={(e) => handleInputChange('hobbies', e.target.value)}
                        className="min-h-20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {INTERESTS.map(interest => (
                          <label key={interest} className="flex items-center gap-2">
                            <Checkbox
                              checked={(editData?.interests || []).includes(interest)}
                              onCheckedChange={() => handleArrayChange('interests', interest)}
                            />
                            <span className="text-sm">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">About Myself</label>
                      <Textarea
                        value={editData?.aboutMyself || ''}
                        onChange={(e) => handleInputChange('aboutMyself', e.target.value)}
                        className="min-h-20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">About</label>
                      <Textarea
                        value={editData?.about || ''}
                        onChange={(e) => handleInputChange('about', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // View Mode
          <>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <p className="text-gray-900 font-medium">{displayValue(user.fullName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{displayValue(user.email)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <p className="text-gray-900">{displayValue(user.mobileNumber)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Mobile</label>
                    <p className="text-gray-900">{displayValue(user.alternateMobileNumber)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <p className="text-gray-900">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <p className="text-gray-900 capitalize">{displayValue(user.gender)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seeking Gender</label>
                    <p className="text-gray-900 capitalize">{displayValue(user.seekingGender)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <p className="text-gray-900">{displayValue(user.maritalStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Tongue</label>
                    <p className="text-gray-900">{displayValue(user.motherTongue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <p className="text-gray-900">{displayValue(user.height)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <p className="text-gray-900">{displayValue(user.weight)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complexion</label>
                    <p className="text-gray-900">{displayValue(user.complexion)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Physical Status</label>
                    <p className="text-gray-900">{displayValue(user.physicalStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <p className="text-gray-900">{displayValue(user.bloodGroup)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                    <p className="text-gray-900">{displayValue(user.diet)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                    <p className="text-gray-900">{displayValue(user.religion)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caste</label>
                    <p className="text-gray-900">{displayValue(user.caste)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nakshatra</label>
                    <p className="text-gray-900">{displayValue(user.nakshatra)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raasi</label>
                    <p className="text-gray-900">{displayValue(user.raasi)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <p className="text-gray-900">{displayValue(user.education)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                    <p className="text-gray-900">{displayValue(user.occupation)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <p className="text-gray-900">{displayValue(user.employmentType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                    <p className="text-gray-900">
                      {user.annualIncome?.displayText || `${user.annualIncome?.currency || 'INR'} ${user.annualIncome?.min || 0} - ${user.annualIncome?.max || 0}` || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <p className="text-gray-900">{displayValue(user.country)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <p className="text-gray-900">{displayValue(user.state)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <p className="text-gray-900">{displayValue(user.city)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info</label>
                    <p className="text-gray-900">{displayValue(user.additionalInfo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family & Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Family & Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Family Status</label>
                    <p className="text-gray-900">{displayValue(user.familyStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Residential Status</label>
                    <p className="text-gray-900">{displayValue(user.residentialStatus)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Father Name</label>
                    <p className="text-gray-900">{displayValue(user.fatherName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Father Occupation</label>
                    <p className="text-gray-900">{displayValue(user.fatherOccupation)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Name</label>
                    <p className="text-gray-900">{displayValue(user.motherName)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mother Occupation</label>
                    <p className="text-gray-900">{displayValue(user.motherOccupation)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
                    <p className="text-gray-900">{displayValue(user.hobbies)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                    <p className="text-gray-900">{user.interests?.length > 0 ? user.interests.join(', ') : '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Myself</label>
                    <p className="text-gray-900">{displayValue(user.aboutMyself)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">About</label>
                    <p className="text-gray-900">{displayValue(user.about)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Joined Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profiles Liked</p>
                    <p className="text-lg font-semibold">{user.likedCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Liked By</p>
                    <p className="text-lg font-semibold">{user.likedByCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete User?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All user data will be permanently deleted from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete User
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>

        {/* Deactivate Confirmation Dialog */}
        <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
              <AlertDialogDescription>
                This user will not be able to log in or appear in profile searches. They can be reactivated later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction
              onClick={() => {
                deactivateMutation.mutate();
                setShowDeactivateDialog(false);
              }}
              className="bg-amber-600 text-white"
            >
              Deactivate
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
