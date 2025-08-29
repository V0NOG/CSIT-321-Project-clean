// vendors.tsx with modals, filters, and token auth
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import { PencilIcon, TrashIcon, PlusIcon, FilterIcon } from "lucide-react";

export default function VendorsTable() {
  const [vendors, setVendors] = useState([]);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ name: "", contactEmail: "" });

  const token = localStorage.getItem("userToken");

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("userToken"); // assuming it's stored here
      const res = await axios.get("http://localhost:5050/api/vendors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };


  useEffect(() => {
    fetchVendors();
  }, []);

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:5050/api/vendors/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchVendors();
  };

  const handleEditOpen = (vendor: any) => {
    setEditingVendor({ ...vendor });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditingVendor({ name: "", contactEmail: "" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    if (isEditing) {
      await axios.put(`http://localhost:5050/api/vendors/${editingVendor._id}`, editingVendor, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await axios.post("http://localhost:5050/api/vendors", editingVendor, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setModalOpen(false);
    fetchVendors();
  };

  const filteredVendors = vendors.filter((v) => {
    const nameMatch = filters.name === "" || v.name.toLowerCase().includes(filters.name.toLowerCase());
    const emailMatch = filters.contactEmail === "" || v.contactEmail.toLowerCase().includes(filters.contactEmail.toLowerCase());
    return nameMatch && emailMatch;
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAddOpen}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Vendor
          </Button>
          <Button size="sm" onClick={() => setFilterModalOpen(true)}>
            <FilterIcon className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contact Email</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800 dark:text-white/90">
                    {vendor.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {vendor.contactEmail}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditOpen(vendor)} className="text-gray-500 hover:text-blue-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(vendor._id)} className="text-gray-500 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{isEditing ? "Edit Vendor" : "Add Vendor"}</h4>
          <form className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label>Name</Label>
              <Input
                value={editingVendor?.name || ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Contact Email</Label>
              <Input
                value={editingVendor?.contactEmail || ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, contactEmail: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2 text-right mt-4">
              <Button size="sm" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleModalSave}>{isEditing ? "Save" : "Add"}</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} className="max-w-md">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Filter Vendors</h4>
          <form className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input value={filters.contactEmail} onChange={(e) => setFilters({ ...filters, contactEmail: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setFilterModalOpen(false)}>Close</Button>
              <Button size="sm" onClick={() => setFilterModalOpen(false)}>Apply</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}