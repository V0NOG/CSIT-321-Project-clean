import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import TwoFactorCard from "../components/UserProfile/TwoFactorCard";
import PageMeta from "../components/common/PageMeta";
import TOTPSetupCard from "../components/security/TOTPSetupCard.tsx";

export default function UserProfiles() {
  return (
    <>
      <PageMeta title="CSIT-321 | Profile Dashboard" description="Profile Dashboard - View and manage your profile details" />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Profile</h3>
        <div className="space-y-6">
          <UserMetaCard />
          <TwoFactorCard />
          <UserInfoCard />
          <UserAddressCard />
          <TOTPSetupCard />
        </div>
      </div>
    </>
  );
}