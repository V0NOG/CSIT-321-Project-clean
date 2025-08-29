// ProgressReportTable.tsx with batch dropdown and pagination
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { FilterIcon } from "lucide-react";

export default function ProgressReportTable({ batchId, refreshKey }) {
  const [reports, setReports] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || "");
  const [loading, setLoading] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    fullName: "",
    emailAddress: "",
    assessmentStatus: "",
    assessment: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get("http://localhost:5050/api/progress-reports/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data);
      if (res.data.length > 0) {
        setSelectedBatchId(res.data[0]._id);
      } else {
        setSelectedBatchId(""); // clear selected if no batches
        setReports([]);          // clear reports if nothing to show
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const fetchReports = async (batchId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`http://localhost:5050/api/progress-reports/batch/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        fetchBatches();
    }, [refreshKey]);

  useEffect(() => {
  if (selectedBatchId) {
    fetchReports(selectedBatchId);
  } else {
    setReports([]);
  }
}, [selectedBatchId]);

  const filteredReports = reports.filter((r) => {
    const nameMatch =
        filters.fullName === "" ||
        r.fullName?.toLowerCase().includes(filters.fullName.toLowerCase());

    const emailMatch =
        filters.emailAddress === "" ||
        r.emailAddress?.toLowerCase().includes(filters.emailAddress.toLowerCase());

    const statusMatch =
        filters.assessmentStatus === "" ||
        r.assessmentStatus?.toLowerCase() === filters.assessmentStatus.toLowerCase();

    const assessmentMatch =
        filters.assessment === "" ||
        r.assessment?.toLowerCase() === filters.assessment.toLowerCase();

    return nameMatch && emailMatch && statusMatch && assessmentMatch;
  });


  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!selectedBatchId && batches.length === 0) {
    return <div className="text-gray-500 text-center mt-4">No batches uploaded yet.</div>;
  }

  return (
    <div>
      <div className="flex justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-white">Reports:</label>
          <select
            className="border rounded p-2 dark:bg-gray-800 dark:text-white"
            value={selectedBatchId}
            onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setCurrentPage(1);
                setFilters({ fullName: "", emailAddress: "", assessment: "", assessmentStatus: "" }); // optional reset
            }}
          >
            {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                    {batch.name}
                </option>
            ))}
          </select>
        </div>

        <Button size="sm" onClick={() => setFilterModalOpen(true)}>
          <FilterIcon className="w-4 h-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Full Name</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email Address</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Assessment</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Assessment Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-5 text-center text-gray-500">Loading...</TableCell>
                </TableRow>
              ) : paginatedReports.length > 0 ? (
                paginatedReports.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{r.fullName
                        ?.toLowerCase()
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{r.emailAddress?.toLowerCase()}</TableCell>
                    <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{r.assessment}</TableCell>
                    <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{r.assessmentStatus}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-5 text-center text-gray-500">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} className="max-w-md">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl">
          <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Filter Progress Reports</h4>
          <form className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={filters.fullName} onChange={(e) => setFilters({ ...filters, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={filters.emailAddress} onChange={(e) => setFilters({ ...filters, emailAddress: e.target.value })} />
            </div>
            <div>
                <Label>Assessment</Label>
                <select
                    value={filters.assessment}
                    onChange={(e) => setFilters({ ...filters, assessment: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-800 dark:text-white"
                >
                    <option value="">All</option>
                    {[...new Set(reports.map((r) => r.assessment))].map((assessment) => (
                    <option key={assessment} value={assessment}>{assessment}</option>
                    ))}
                </select>
                </div>
                <div>
                <Label>Assessment Status</Label>
                <select
                    value={filters.assessmentStatus}
                    onChange={(e) => setFilters({ ...filters, assessmentStatus: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-800 dark:text-white"
                >
                    <option value="">All</option>
                    {[...new Set(reports.map((r) => r.assessmentStatus))].map((status) => (
                    <option key={status} value={status}>{status}</option>
                    ))}
                </select>
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