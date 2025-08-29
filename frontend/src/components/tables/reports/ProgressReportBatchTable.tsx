import { useEffect, useState } from "react";
import axios from "axios";
import { PencilIcon, TrashIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Input from "../../form/input/InputField";

export default function ProgressReportBatchTable({ onRefresh, onSelect }) {
  const [batches, setBatches] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [newName, setNewName] = useState("");

  const fetchBatches = async () => {
  const token = localStorage.getItem("userToken");
  const res = await axios.get("http://localhost:5050/api/progress-reports/batches", {
    headers: { Authorization: `Bearer ${token}` },
  });
  setBatches(res.data);

  // ✅ Auto-select the first batch if none selected yet
  if (res.data.length > 0) {
    onSelect(res.data[0]._id);      // Set the selected batch in the parent
  }

  // ✅ Also pass batches to parent for refresh triggering if needed
  onRefresh(res.data);
};

  const handleDelete = async (id) => {
    const token = localStorage.getItem("userToken");
    await axios.delete(`http://localhost:5050/api/progress-reports/batch/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBatches();
    onRefresh();
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setNewName(batch.name);
    setEditModalOpen(true);
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("userToken");
    await axios.put(`http://localhost:5050/api/progress-reports/batch/${editingBatch._id}`, {
      name: newName,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEditModalOpen(false);
    fetchBatches();
    onRefresh();
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Uploaded Reports</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Report Name</TableCell>
                <TableCell className="px-5 py-3 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center p-4 text-gray-500">No uploaded batches</TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch._id}>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                      <button onClick={() => onSelect(batch._id)} className="hover:underline">
                        {batch.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right space-x-2">
                      <button onClick={() => handleEdit(batch)}>
                        <PencilIcon className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                      <button onClick={() => handleDelete(batch._id)}>
                        <TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-600" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-md">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Edit Report Name</h4>
          <div className="space-y-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}