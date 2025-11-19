import React, { useState } from "react";
import { Plus, Pencil, Trash, Eye } from "lucide-react";
import Navigation from "../../components/Navigation";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  workType: string;
  salary: string;
  applicants: number;
  status: string;
  jobType?: string;
  experience?: string;
  skills?: string;
}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 1,
      title: "Frontend Developer",
      company: "Tech Innovations Inc",
      location: "Bangalore",
      workType: "Hybrid",
      salary: "₹6-10 LPA",
      applicants: 45,
      status: "Active",
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "Startup Labs",
      location: "Remote",
      workType: "Remote",
      salary: "₹8-12 LPA",
      applicants: 67,
      status: "Active",
    },
    {
      id: 3,
      title: "Backend Developer",
      company: "Enterprise Solutions",
      location: "Pune",
      workType: "Onsite",
      salary: "₹7-11 LPA",
      applicants: 32,
      status: "Closed",
    },
  ]);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    workType: "Remote",
    salary: "",
    status: "Active",
    jobType: "",
    experience: "",
    skills: "",
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);

  // Input Handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open Add Job Modal
  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      title: "",
      company: "",
      location: "",
      workType: "Remote",
      salary: "",
      status: "Active",
      jobType: "",
      experience: "",
      skills: "",
    });
    setIsModalOpen(true);
  };

  // Add Job
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();

    const job: Job = {
      id: jobs.length + 1,
      applicants: 0,
      ...formData,
    };

    setJobs([...jobs, job]);
    setIsModalOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (job: Job) => {
    setIsEditing(true);
    setSelectedJobId(job.id);
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      workType: job.workType,
      salary: job.salary,
      status: job.status,
      jobType: job.jobType || "",
      experience: job.experience || "",
      skills: job.skills || "",
    });
    setIsModalOpen(true);
  };

  // Update Job
  const handleUpdateJob = (e: React.FormEvent) => {
    e.preventDefault();

    setJobs(
      jobs.map((job) =>
        job.id === selectedJobId ? { ...job, ...formData } : job
      )
    );

    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedJobId(null);
  };

  // Delete Modal
  const openDeleteModal = (id: number) => {
    setJobToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteJob = () => {
    setJobs(jobs.filter((job) => job.id !== jobToDelete));
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto p-6">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-2/3 border px-4 py-2 rounded"
          />

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus size={18} /> Post New Job
          </button>
        </div>

        {/* Job Table */}
        <h2 className="text-2xl font-bold mb-4">Job Listings</h2>
        <p className="text-gray-600 mb-6">{jobs.length} job(s) found</p>

        <div className="bg-white shadow rounded">
          <table className="w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Job Title</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Work Type</th>
                <th className="p-3 text-left">Salary</th>
                <th className="p-3 text-left">Applicants</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3 font-semibold">{job.title}</td>
                  <td className="p-3">{job.company}</td>
                  <td className="p-3">{job.location}</td>
                  <td className="p-3">{job.workType}</td>
                  <td className="p-3">{job.salary}</td>
                  <td className="p-3 flex items-center gap-1">
                    <Eye size={18} /> {job.applicants}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        job.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-3 text-gray-600">
                    <Pencil
                      size={18}
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => openEditModal(job)}
                    />
                    <Trash
                      size={18}
                      className="cursor-pointer text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(job.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD/EDIT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center overflow-y-auto">
            <div className="bg-white p-6 w-full max-w-3xl rounded shadow-lg my-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? "Update Job" : "Post New Job"}
                </h2>
                <button onClick={() => setIsModalOpen(false)}>✖</button>
              </div>

              <form
                onSubmit={isEditing ? handleUpdateJob : handleAddJob}
                className="space-y-4"
              >
                {/* Job Title */}
                <div>
                  <label className="font-semibold">Job Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded mt-1"
                    required
                  />
                </div>

                {/* Company + Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                    />
                  </div>

                  <div>
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                    />
                  </div>
                </div>

                {/* Work Type + Job Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Work Type</label>
                    <select
                      name="workType"
                      value={formData.workType}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>

                  <div>
                    <label>Job Type</label>
                    <input
                      type="text"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                      placeholder="e.g., Full-time"
                    />
                  </div>
                </div>

                {/* Experience + Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Experience Level</label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                      placeholder="e.g., Fresher"
                    />
                  </div>

                  <div>
                    <label>Salary Range</label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                      placeholder="e.g., ₹6-10 LPA"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label>Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded mt-1"
                    placeholder="e.g., React, Node.js"
                  />
                </div>

                {/* Status */}
                <div>
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded mt-1"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {isEditing ? "Update Job" : "Post Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-96 text-center">
              <h3 className="text-lg font-semibold mb-4">
                Are you sure you want to delete this job?
              </h3>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteJob}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
