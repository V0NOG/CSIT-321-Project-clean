// pages/units.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Button from "../../ui/button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import { PencilIcon, TrashIcon, PlusIcon, FilterIcon } from "lucide-react";

export default function UnitsTable() {
  const [units, setUnits] = useState([]);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ code: "", title: "" });

  const token = localStorage.getItem("userToken");

  const fetchUnits = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/units", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnits(res.data);
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:5050/api/units/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUnits();
  };

  const handleEditOpen = (unit: any) => {
    setEditingUnit({ ...unit });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditingUnit({ code: "", title: "", description: "" });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    if (isEditing) {
      await axios.put(`http://localhost:5050/api/units/${editingUnit._id}`, editingUnit, config);
    } else {
      await axios.post("http://localhost:5050/api/units", editingUnit, config);
    }
    setModalOpen(false);
    fetchUnits();
  };

  const filteredUnits = units.filter((u) => {
    const codeMatch = filters.code === "" || u.code.toLowerCase().includes(filters.code.toLowerCase());
    const titleMatch = filters.title === "" || u.title.toLowerCase().includes(filters.title.toLowerCase());
    return codeMatch && titleMatch;
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAddOpen}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Unit
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
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Title</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Description</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredUnits.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800 dark:text-white/90">
                    {unit.code}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {unit.title}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {unit.description}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditOpen(unit)} className="text-gray-500 hover:text-blue-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(unit._id)} className="text-gray-500 hover:text-red-600">
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
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{isEditing ? "Edit Unit" : "Add Unit"}</h4>
          <form className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label>Code</Label>
              <Input
                value={editingUnit?.code || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, code: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Title</Label>
              <Input
                value={editingUnit?.title || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Description</Label>
              <Input
                value={editingUnit?.description || ""}
                onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })}
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
          <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Filter Units</h4>
          <form className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input value={filters.code} onChange={(e) => setFilters({ ...filters, code: e.target.value })} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} />
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