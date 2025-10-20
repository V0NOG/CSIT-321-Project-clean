// frontend/src/components/UserProfile/UserMetaCard.tsx
import { useAuth } from "../../context/AuthContext";

export default function UserMetaCard() {
  const { user } = useAuth();

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="order-3 xl:order-2 text-center xl:text-left">
            <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              {user?.firstName} {user?.lastName}
            </h4>
            <div className="flex flex-col items-center gap-1 xl:flex-row xl:gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.bio || "—"}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.address?.cityState || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}