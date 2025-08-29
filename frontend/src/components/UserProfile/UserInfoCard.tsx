import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, token } = useAuth();

  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });

  const fetchUserData = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInfo(res.data); // Update info with latest data
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  };

  useEffect(() => {
    if (token) fetchUserData();
  }, [token]);

  const handleEditClick = async () => {
    await fetchUserData(); // Ensure form is pre-filled with latest
    openModal();
  };

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:5050/api/user/me", info, {
        headers: { Authorization: `Bearer ${token}` },
      });
      closeModal();
      fetchUserData(); // Refresh info after saving
    } catch (err) {
      console.error("Failed to update user info", err);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">First Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{info.firstName || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Last Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{info.lastName || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{info.email || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{info.phone || "-"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Bio</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{info.bio || "-"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleEditClick}
          className="flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-medium shadow-theme-xs lg:w-auto"
        >
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Personal Information
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your personal details.</p>

          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={info.firstName}
                  onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={info.lastName}
                  onChange={(e) => setInfo({ ...info, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={info.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                />
              </div>
              <div className="lg:col-span-2">
                <Label>Bio</Label>
                <Input
                  type="text"
                  value={info.bio}
                  onChange={(e) => setInfo({ ...info, bio: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}