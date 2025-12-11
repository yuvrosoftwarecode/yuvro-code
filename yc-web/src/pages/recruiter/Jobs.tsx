import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash, Eye, ClipboardList, Filter } from "lucide-react";
import { fetchJobs, createJob, updateJob, deleteJobById } from "../../services/jobsapi";
import AssessmentInterface from "../../components/student/AssessmentInterface";
import RoleSidebar from "../../components/common/RoleSidebar";
import RoleHeader from "../../components/common/RoleHeader";


interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  work_type: string;
  salary: string;
  applicants?: number;
  status: string;
  job_type?: string;
  experience_level?: number;
  description: string,
  skills?: string;
}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    work_type: "Remote",
    salary: "",
    experience_level: 0,
    job_type: "",
    description: "",
    skills: "",
    status: "Active",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assessment states
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAssessmentConfig, setShowAssessmentConfig] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assessmentConfig, setAssessmentConfig] = useState({
    duration: 60,
    totalQuestions: 10,
    topicId: "1"
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      title: "",
      company: "",
      location: "",
      work_type: "Remote",
      salary: "",
      experience_level: 0,
      job_type: "",
      description: "",
      skills: "",
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setIsEditing(true);
    setSelectedJobId(job.id);
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      work_type: job.work_type,
      salary: job.salary,
      status: job.status,
      job_type: job.job_type || "",
      experience_level: job.experience_level || 0,
      skills: job.skills || "",
      description: job.description,
    });
    setIsModalOpen(true);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createJob(formData);
      loadJobs();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating job:", err);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJobId) return;

    try {
      await updateJob(selectedJobId, formData);
      loadJobs();
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedJobId(null);
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteJobId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobId) return;
    try {
      setIsDeleting(true);
      await deleteJobById(deleteJobId);
      setJobs(prev => prev.filter(job => job.id !== deleteJobId));
      setIsDeleteModalOpen(false);
      setDeleteJobId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteJobId(null);
  };

  // Assessment handlers
  const openAssessmentConfig = (job: Job) => {
    setSelectedJob(job);
    setAssessmentConfig({
      duration: 60,
      totalQuestions: 10,
      topicId: "1"
    });
    setShowAssessmentConfig(true);
  };

  const startAssessment = () => {
    setShowAssessmentConfig(false);
    setShowAssessment(true);
  };

  const handleAssessmentComplete = (stats?: { answeredCount: number; totalQuestions: number; timeSpent: number }) => {
    console.log("Assessment completed:", stats);
    setShowAssessment(false);
    setSelectedJob(null);
    // Here you can save the assessment results to your backend
  };

  const handleAssessmentBack = () => {
    setShowAssessment(false);
    setSelectedJob(null);
  };

  const closeAssessmentConfig = () => {
    setShowAssessmentConfig(false);
    setSelectedJob(null);
  };

  const headerActions = (
    <>
      <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <Filter className="h-4 w-4" />
        <span>Filter</span>
      </button>
      <button
        onClick={openAddModal}
        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        <Plus className="h-4 w-4" />
        <span>Post New Job</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <RoleSidebar />

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <RoleHeader 
            title="Job Management Dashboard"
            subtitle="Manage your job recruitment pipeline"
            actions={headerActions}
          />

          <div className="p-6">
            {/* Search Section */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full max-w-md border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

        <h2 className="text-2xl font-bold mb-4">Job Listings</h2>
        <p className="text-gray-600 mb-6">{jobs.length} job(s) found</p>

        <div className="bg-white shadow rounded">
          <table className="w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Job Title</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Applicants</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Assessment</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3 font-semibold">{job.title}</td>
                  <td className="p-3">{job.company}</td>
                  <td className="p-3">{job.location}</td>
                  <td className="p-3 flex items-center gap-1">
                    <Eye size={18} /> {job.applicants || 0}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded text-sm ${job.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {job.status}
                    </span>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => openAssessmentConfig(job)}
                      className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      <ClipboardList size={14} />
                      Create Assessment
                    </button>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Work Type</label>
                    <select
                      name="work_type"
                      value={formData.work_type}
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
                      name="job_type"
                      value={formData.job_type}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                      placeholder="e.g., Full-time"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Experience Level</label>
                    <input
                      type="text"
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded mt-1"
                      placeholder="e.g., Fresher"
                    />
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label> Description</label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded mt-1"
                        placeholder="e.g., Fresher"
                      />
                    </div>
                  </div>

                  <div>
                    <label>Salary</label>
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

                <div className="flex justify-end gap-4">
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
                  onClick={confirmDeleteJob}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Configuration Modal */}
        {showAssessmentConfig && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Configure Assessment</h2>
                <button onClick={closeAssessmentConfig}>✖</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Position</label>
                  <input
                    type="text"
                    value={selectedJob.title}
                    disabled
                    className="w-full border px-3 py-2 rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <select
                    value={assessmentConfig.duration}
                    onChange={(e) => setAssessmentConfig({ ...assessmentConfig, duration: parseInt(e.target.value) })}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Number of Questions</label>
                  <select
                    value={assessmentConfig.totalQuestions}
                    onChange={(e) => setAssessmentConfig({ ...assessmentConfig, totalQuestions: parseInt(e.target.value) })}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Topic/Skill Area</label>
                  <select
                    value={assessmentConfig.topicId}
                    onChange={(e) => setAssessmentConfig({ ...assessmentConfig, topicId: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="1">JavaScript Fundamentals</option>
                    <option value="2">React Development</option>
                    <option value="3">Node.js Backend</option>
                    <option value="4">Python Programming</option>
                    <option value="5">Data Structures & Algorithms</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">Assessment Preview</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Duration: {assessmentConfig.duration} minutes</li>
                    <li>• Questions: {assessmentConfig.totalQuestions} mixed (MCQ + Coding)</li>
                    <li>• Proctored with camera monitoring</li>
                    <li>• Auto-submit on time completion</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={closeAssessmentConfig}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startAssessment}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Start Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Interface */}
        {showAssessment && selectedJob && (
          <div className="fixed inset-0 bg-white z-50">
            <AssessmentInterface
              assessment={{
                id: selectedJob.id.toString(),
                title: `${selectedJob.title} - Skill Assessment`,
                course: selectedJob.company,
                duration: assessmentConfig.duration,
                totalQuestions: assessmentConfig.totalQuestions,
                topicId: assessmentConfig.topicId
              }}
              onComplete={handleAssessmentComplete}
              onBack={handleAssessmentBack}
            />
          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
