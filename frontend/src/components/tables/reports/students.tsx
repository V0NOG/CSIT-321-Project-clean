// Updated StudentsTable.tsx with Tutors-style table formatting
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
import { PencilIcon, TrashIcon, PlusIcon, FilterIcon, XIcon } from "lucide-react";
import { Pagination } from "../../ui/pagination/Pagination";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import CustomSelect from "../../form/input/Select";
import Select from 'react-select';

export default function StudentsTable() {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({ name: "", campus: null, tutor: null, dateRange: "", units: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [campuses, setCampuses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [units, setUnits] = useState([]);

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    campus: null,
    tutor: null,
    jobCoach: "",
    startDate: "",
    progressing: false,
    unitProgress: [],
  });

  const fetchCampuses = async () => {
    const token = localStorage.getItem("userToken");
    const res = await axios.get("http://localhost:5050/api/campuses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCampuses(res.data.map((c) => ({ label: c.name, value: c._id })));
  };

  const fetchTutors = async () => {
    const token = localStorage.getItem("userToken");
    const res = await axios.get("http://localhost:5050/api/tutors", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTutors(res.data.map((t) => ({ label: `${t.firstName} ${t.lastName}`, value: t._id })));
  };

  const fetchUnits = async () => {
    const token = localStorage.getItem("userToken");
    const res = await axios.get("http://localhost:5050/api/units", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUnits(res.data.map((u) => ({ label: u.code + ' - ' + u.title, value: u._id })));
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("userToken"); // assuming it's stored here
      const res = await axios.get("http://localhost:5050/api/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  useEffect(() => {
  fetchStudents();
  fetchCampuses();
  fetchTutors();
  fetchUnits();
  }, []);


  const handleDelete = async (id: string) => {
    await axios.delete(`http://localhost:5050/api/students/${id}`);
    fetchStudents();
  };

  const handleEditOpen = (student: any) => {
    const matchedCampus = campuses.find(c => c.value === student.campus?._id);
    const matchedTutor = tutors.find(t => t.value === student.tutor?._id);
    const matchedUnits = units.filter(u => student.unitProgress?.some(up => up.unit?._id === u.value));

    setEditingStudent({
      ...student,
      campus: matchedCampus || null,
      tutor: matchedTutor || null,
      unitProgress: matchedUnits,
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    const token = localStorage.getItem("userToken");
    const studentToUpdate = {
      ...editingStudent,
      campus: editingStudent.campus?.value,
      tutor: editingStudent.tutor?.value,
      unitProgress: editingStudent.unitProgress.map((unit) => ({
        unit: unit.value,
        status: "Enrolled",
      })),
    };
    await axios.put(`http://localhost:5050/api/students/${editingStudent._id}`, studentToUpdate, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEditModalOpen(false);
    fetchStudents();
  };

  const handleClearFilters = () => {
    setFilters({ name: "", campus: null, tutor: null, dateRange: "", units: [] });
  };

  const filterIndicator = filters.name || filters.campus || filters.tutor || filters.dateRange || (filters.units?.length > 0);

  const handleExport = () => {
    const data = students.map((s) => ({
      Name: `${s.firstName} ${s.lastName}`,
      Campus: s.campus?.name,
      Tutor: `${s.tutor?.firstName || ""} ${s.tutor?.lastName || ""}`,
      JobCoach: s.jobCoach,
      StartDate: s.startDate?.slice(0, 10),
      Progressing: s.progressing ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "students.xlsx");
  };

  const filteredStudents = students.filter((s) => {
    const nameMatch =
      filters.name === "" ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(filters.name.toLowerCase()) ||
      s.email?.toLowerCase().includes(filters.name.toLowerCase());
    const campusMatch = !filters.campus || s.campus?._id === filters.campus.value;
    const tutorMatch = !filters.tutor || s.tutor?._id === filters.tutor.value;
    const dateMatch = filters.dateRange === "" || s.startDate?.startsWith(filters.dateRange);
    const unitIds = filters.units?.map(u => u.value);
    const unitMatch = !unitIds?.length || s.unitProgress?.some(up => unitIds.includes(up.unit?._id));
    return nameMatch && campusMatch && tutorMatch && dateMatch && unitMatch;
  });

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAddStudent = async () => {
    const token = localStorage.getItem("userToken");

    const studentToAdd = {
      ...newStudent,
      campus:
        typeof newStudent.campus === "object"
          ? newStudent.campus.value
          : newStudent.campus,
      tutor:
        typeof newStudent.tutor === "object"
          ? newStudent.tutor.value
          : newStudent.tutor,
      unitProgress: newStudent.unitProgress.map((unitId) => ({
        unit: unitId,
        status: "Enrolled",
      })),
    };

    try {
      await axios.post("http://localhost:5050/api/students", studentToAdd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddModalOpen(false);
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        campus: null,
        tutor: null,
        jobCoach: "",
        startDate: "",
        progressing: false,
        unitProgress: [],
      });

      fetchStudents();
    } catch (err) {
      console.error("Failed to add student", err);
    }
  };


  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 mb-4">
          <Button size="sm" onClick={() => setFilterModalOpen(true)}>
            <FilterIcon className="w-4 h-4 mr-2" /> Filter
          </Button>
          {filterIndicator && (
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              <XIcon className="w-4 h-4 mr-2 text-red-500" /> Clear Filters
            </Button>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" /> Add Student
          </Button>
          <Button size="sm" onClick={handleExport}>Export to Excel</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campus</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Job Coach</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tutor</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Start Date</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Progressing</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Units</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginatedStudents.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                      {s.email || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {s.campus?.name || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {s.jobCoach || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {s.tutor ? `${s.tutor.firstName} ${s.tutor.lastName}` : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {s.startDate?.slice(0, 10) || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge size="sm" color={s.progressing ? "success" : "warning"}>{s.progressing ? "Yes" : "No"}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <ul className="text-xs space-y-1">
                      {s.unitProgress?.map((up) => (
                        <li key={up.unit?._id}>
                          {up.unit?.code || "?"} - {up.unit?.title || "?"}:{" "}
                          <Badge size="sm" color="info">{up.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditOpen(s)} className="text-gray-500 hover:text-blue-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="text-gray-500 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredStudents.length}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} className="max-w-2xl">
      <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Add Student</h4>
        <form className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <Input value={newStudent.firstName} onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={newStudent.lastName} onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })} />
          </div>
          <div className="lg:col-span-2">
            <Label>Email</Label>
            <Input value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
          </div>
          <div>
            <Label>Campus</Label>
            <Select
              value={newStudent.campus || ""}
              onChange={(selected) => setNewStudent({ ...newStudent, campus: selected })}
              options={campuses}
            />
          </div>
          <div>
            <Label>Tutor</Label>
            <Select
              value={newStudent.tutor || ""}
              onChange={(selected) => setNewStudent({ ...newStudent, tutor: selected })}
              options={tutors}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Units</Label>
            <Select
              isMulti
              options={units}
              value={units.filter(u => newStudent.unitProgress.includes(u.value))}
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions.map((opt) => opt.value);
                setNewStudent({ ...newStudent, unitProgress: selectedIds });
              }}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Job Coach</Label>
            <Input value={newStudent.jobCoach} onChange={(e) => setNewStudent({ ...newStudent, jobCoach: e.target.value })} />
          </div>
          <div className="lg:col-span-2">
            <Label>Start Date</Label>
            <Input type="date" value={newStudent.startDate} onChange={(e) => setNewStudent({ ...newStudent, startDate: e.target.value })} />
          </div>
          <div className="lg:col-span-2 text-right mt-4">
            <Button size="sm" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddStudent}>Add</Button>
          </div>
        </form>
      </div>
    </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-2xl">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Student</h4>
          <form className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <Input
                value={editingStudent?.firstName || ""}
                onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={editingStudent?.lastName || ""}
                onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Email</Label>
              <Input
                value={editingStudent?.email || ""}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Campus</Label>
              <Select
                value={editingStudent?.campus || null}
                onChange={(selected) => setEditingStudent({ ...editingStudent, campus: selected })}
                options={campuses}
              />
            </div>
            <div>
              <Label>Tutor</Label>
              <Select
                value={editingStudent?.tutor || null}
                onChange={(selected) => setEditingStudent({ ...editingStudent, tutor: selected })}
                options={tutors}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Units</Label>
              <Select
                isMulti
                options={units}
                value={editingStudent?.unitProgress || []}
                onChange={(selectedOptions) => {
                  setEditingStudent({ ...editingStudent, unitProgress: selectedOptions });
                }}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Job Coach</Label>
              <Input
                value={editingStudent?.jobCoach || ""}
                onChange={(e) => setEditingStudent({ ...editingStudent, jobCoach: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editingStudent?.startDate?.slice(0, 10) || ""}
                onChange={(e) => setEditingStudent({ ...editingStudent, startDate: e.target.value })}
              />
            </div>
            <div className="lg:col-span-2 text-right mt-4">
              <Button size="sm" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleEditSave}>Save</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} className="max-w-md">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Filter Students</h4>
          <form className="space-y-4">
            <div>
              <Label>Name / Email</Label>
              <Input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
            </div>
            <div>
              <Label>Campus</Label>
              <Select
                name="campus"
                value={filters.campus}
                onChange={(selected) => setFilters({ ...filters, campus: selected })}
                options={campuses}
              />
            </div>
            <div>
              <Label>Tutor</Label>
              <Select
                name="tutor"
                value={filters.tutor}
                onChange={(selected) => setFilters({ ...filters, tutor: selected })}
                options={tutors}
              />
            </div>
            <div>
              <Label>Units</Label>
              <Select
                isMulti
                options={units}
                value={filters.units}
                onChange={(selected) => setFilters({ ...filters, units: selected })}
              />
            </div>
            <div>
              <Label>Date Range</Label>
              <Input type="date" value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })} />
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