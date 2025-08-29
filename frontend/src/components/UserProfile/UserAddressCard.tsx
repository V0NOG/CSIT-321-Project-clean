import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";
import Select from "react-select";
import countryList from "react-select-country-list";

const statesList = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, token } = useAuth();

  const [address, setAddress] = useState({
    country: "",
    cityState: "",
    postalCode: "",
  });

  const countryOptions = countryList().getData();
  const stateOptions = statesList.map((state) => ({ label: state, value: state }));

  const fetchUserAddress = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latestAddress = res.data.address || {};
      setAddress({
        country: latestAddress.country || "",
        cityState: latestAddress.cityState || "",
        postalCode: latestAddress.postalCode || "",
      });
    } catch (err) {
      console.error("Failed to fetch user address", err);
    }
  };

  useEffect(() => {
    if (token) fetchUserAddress();
  }, [token]);

  const handleEditClick = async () => {
    await fetchUserAddress();
    openModal();
  };

  const handleSave = async () => {
    try {
      await axios.put(
        "http://localhost:5050/api/user/me",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeModal();
      fetchUserAddress();
    } catch (err) {
      console.error("Failed to update address", err);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Country</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{address.country || "-"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">City/State</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{address.cityState || "-"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Postal Code</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{address.postalCode || "-"}</p>
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
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Address</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update your address details.</p>

          <form className="flex flex-col">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Country</Label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find((opt) => opt.label === address.country)}
                  onChange={(selected) =>
                    setAddress({ ...address, country: selected?.label || "" })
                  }
                  isClearable
                  isSearchable
                />
              </div>
              <div>
                <Label>City/State</Label>
                <Select
                  options={stateOptions}
                  value={stateOptions.find((opt) => opt.label === address.cityState)}
                  onChange={(selected) =>
                    setAddress({ ...address, cityState: selected?.label || "" })
                  }
                  isClearable
                  isSearchable
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
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
    </>
  );
}