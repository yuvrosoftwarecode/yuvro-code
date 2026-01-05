import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/common/Navigation";
import { FileText } from "lucide-react";

import profileService, {
  Profile as ProfileType,
  Skill,
  Experience,
  Project,
  Education,
  Certification,
} from "@/services/profileService";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Edit,
  Plus,
  Github,
  Linkedin,
  Globe,
  Mail,
  MapPin,
  Calendar,
  Award,
  Trophy,
  Code,
  Briefcase,
  GraduationCap,
  Star,
  ExternalLink,
  Upload,
  Building2,
  Clock,
  Trash2,
  Download,
} from "lucide-react";

// Dialogs
import EditProfileDialog from "@/components/student/profile/EditProfileDialog";
import AddSkillDialog from "@/components/student/profile/AddSkillDialog";
import AddExperienceDialog, {
  ExperienceForm,
} from "@/components/student/profile/AddExperienceDialog";
import AddProjectDialog from "@/components/student/profile/AddProjectDialog";
import AddEducationDialog from "@/components/student/profile/AddEducationDialog";
import EditLinksDialog from "@/components/student/profile/EditLinksDialog";
import AddCertificationDialog, {
  CertificationForm,
} from "@/components/student/profile/AddCertificationDialog";

import { generateResumePDF } from "../../utils/resumeGenerator";
import resumeService from "../../services/resumeService";
import { toast } from "sonner";

type SkillForm = {
  name: string;
  level: string;
  percentage: number;
};

type ProjectForm = {
  title: string;
  description: string;
  role: string;
  techStack: string[];
  githubLink?: string;
  liveLink?: string;
};

type EducationForm = {
  institution: string;
  degree: string;
  field: string;
  duration: string;
  cgpa?: string;
};

const calculateProfileStrength = (profile: ProfileType) => {
  let score = 0;

  if (profile.full_name) score += 5;
  if (profile.title) score += 5;
  if (profile.about) score += 5;
  if (profile.location) score += 5;

  if (profile.education.length > 0) score += 15;

  if (profile.skills.length > 0) score += 15;

  if (profile.experiences.length > 0) score += 15;

  if (profile.projects.length > 0) score += 15;

  if (profile.certifications.length > 0) score += 10;

  const anySocial =
    profile.links.github ||
    profile.links.linkedin ||
    profile.links.portfolio ||
    profile.links.email;

  if (anySocial) score += 5;

  if (profile.profile_image) score += 3;
  if (profile.cover_image) score += 2;

  return score;
};

const generateSuggestions = (profile: ProfileType) => {
  const suggestions: { text: string; boost: number }[] = [];

  if (!profile.profile_image)
    suggestions.push({ text: "Add a profile picture", boost: 3 });

  if (!profile.cover_image)
    suggestions.push({ text: "Add a cover image", boost: 2 });

  if (!profile.title)
    suggestions.push({ text: "Add a professional title", boost: 5 });

  if (!profile.about)
    suggestions.push({ text: "Write a short About section", boost: 5 });

  if (!profile.location)
    suggestions.push({ text: "Add your current location", boost: 5 });

  if (profile.education.length === 0)
    suggestions.push({ text: "Add your education details", boost: 15 });

  if (profile.skills.length === 0)
    suggestions.push({ text: "Add at least one skill", boost: 15 });

  if (profile.experiences.length === 0)
    suggestions.push({ text: "Add your experience", boost: 15 });

  if (profile.projects.length === 0)
    suggestions.push({ text: "Add a project you worked on", boost: 15 });

  if (profile.certifications.length === 0)
    suggestions.push({ text: "Add a certification", boost: 10 });

  const hasSocial =
    profile.links.github ||
    profile.links.linkedin ||
    profile.links.portfolio ||
    profile.links.email;

  if (!hasSocial)
    suggestions.push({ text: "Add social links (GitHub/LinkedIn)", boost: 5 });

  return suggestions;
};



const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [profilePic, setProfilePic] = useState<string>("");
  const [coverPic, setCoverPic] = useState<string>("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] =
    useState(false);

  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [experienceEditData, setExperienceEditData] =
    useState<Experience | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );
  const [editingCertification, setEditingCertification] =
    useState<Certification | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileService.fetchProfileDetail();
      setProfile(response);

      if (response.profile_image) setProfilePic(response.profile_image);
      if (response.cover_image) setCoverPic(response.cover_image);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading profile...
      </div>
    );
  }
  const profileStrength = calculateProfileStrength(profile);
  const suggestions = generateSuggestions(profile);


  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverPicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCoverPic(reader.result as string);
    reader.readAsDataURL(file);
  };


  const handleAddExperience = async (exp: ExperienceForm) => {
    await profileService.addExperience(exp);
    await loadProfile();
    setExperienceEditData(null);
  };

  const handleEditExperience = async (expId: string, data: ExperienceForm) => {
    await profileService.updateExperience(expId, data);
    await loadProfile();
    setExperienceEditData(null);
  };

  const handleDeleteExperience = async (id: string) => {
    await profileService.deleteExperience(id);
    await loadProfile();
  };


  const handleSaveSkill = async (data: SkillForm) => {
    if (editingSkill) {
      await profileService.updateSkill(editingSkill.id, data);
    } else {
      await profileService.addSkill(data);
    }
    await loadProfile();
    setEditingSkill(null);
  };

  const handleDeleteSkill = async (id: string) => {
    await profileService.deleteSkill(id);
    await loadProfile();
  };


  const handleSaveProject = async (form: ProjectForm) => {
    const payload = {
      title: form.title,
      description: form.description,
      role: form.role,
      tech_stack: form.techStack,
      github_link: form.githubLink,
      live_link: form.liveLink,
    };

    if (editingProject) {
      await profileService.updateProject(editingProject.id, payload);
    } else {
      await profileService.addProject(payload);
    }
    await loadProfile();
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    await profileService.deleteProject(id);
    await loadProfile();
  };


  const handleSaveEducation = async (form: EducationForm) => {
    if (editingEducation) {
      await profileService.updateEducation(editingEducation.id, form);
    } else {
      await profileService.addEducation(form);
    }
    await loadProfile();
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    await profileService.deleteEducation(id);
    await loadProfile();
  };


  const handleSaveCertification = async (data: CertificationForm) => {
    if (editingCertification) {
      await profileService.updateCertification(editingCertification.id, data);
    } else {
      await profileService.addCertification(data);
    }
    await loadProfile();
    setEditingCertification(null);
  };

  const handleDeleteCertification = async (id: string) => {
    await profileService.deleteCertification(id);
    await loadProfile();
  };


  const handleDownloadResume = async () => {
    if (!profile) {
      toast.error("Profile data not available");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      toast.info("Generating your resume PDF...");
      
      await generateResumePDF(profile);
      
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error generating resume:", error);
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========== LEFT MAIN CONTENT ========== */}
          <div className="lg:col-span-2 space-y-6">
            {/* ========= HEADER CARD ========= */}
            <Card>
              <div className="relative">
                {/* COVER */}
                <div className="h-48 bg-gradient-to-r from-orange-100 to-orange-50 relative group">
                  {coverPic && (
                    <img
                      src={coverPic}
                      className="w-full h-full object-cover"
                      alt="Cover"
                    />
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverPicUpload}
                      />
                      <Button size="sm" variant="secondary">
                        <Upload className="h-4 w-4 mr-2" /> Upload Cover
                      </Button>
                    </label>
                  </div>
                </div>

                {/* PROFILE PIC */}
                <div className="absolute -bottom-16 left-8">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    {profilePic ? (
                      <AvatarImage src={profilePic} alt="Profile" />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {profile.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>

              <CardContent className="pt-20 pb-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold">
                      {profile.full_name || "Student User"}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {profile.title || "Your Title Here"}
                    </p>

                    {profile.education.length > 0 && (
                      <p className="text-sm text-muted-foreground flex gap-3 items-center">
                        <Building2 className="h-4 w-4" />
                        {profile.education[0].institution} |{" "}
                        {profile.education[0].degree} |{" "}
                        {profile.education[0].duration}
                      </p>
                    )}

                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </p>
                  </div>

                    <div className="flex gap-2">
                    <Button
                      onClick={() => navigate('/student/resume-builder')}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg transition"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Resume Builder
                    </Button>

                    <Button
                      onClick={() => setEditDialogOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>


                </div>
              </CardContent>
            </Card>

            {/* ========= ABOUT ========= */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-muted-foreground">
                  {profile.about || "No about added yet."}
                </p>
              </CardContent>
            </Card>

            {/* ========= CERTIFICATIONS ========= */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Certifications
                  </h2>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCertification(null);
                      setCertificationDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Certification
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.certifications.map((cert) => (
                    <Card key={cert.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{cert.name}</h3>

                            <p className="text-sm text-muted-foreground">
                              {cert.issuer}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {cert.completion_date}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            {/* Edit */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCertification(cert);
                                setCertificationDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:text-destructive"
                              onClick={() =>
                                handleDeleteCertification(cert.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Download file */}
                            {cert.certificate_file && (
                              <a
                                href={cert.certificate_file}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ========= EXPERIENCE ========= */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Experience
                  </h2>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExperienceEditData(null);
                      setExperienceDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>

                <div className="space-y-6">
                  {profile.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="border-l-2 border-primary/20 pl-4 relative"
                    >
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full" />

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{exp.role}</h3>
                          <p className="text-muted-foreground">{exp.company}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {exp.duration}
                          </p>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExperienceEditData(exp);
                              setExperienceDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-destructive"
                            onClick={() => handleDeleteExperience(exp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Description */}
                      <ul className="list-disc pl-4 text-muted-foreground text-sm mb-3">
                        {exp.description_list.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>

                      {/* Tech stack */}
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ========= PROJECTS ========= */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" /> Projects
                  </h2>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProject(null);
                      setProjectDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {profile.projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {project.title}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              {project.description}
                            </p>
                            <p className="text-primary mt-1">
                              Role: {project.role}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProject(project);
                                setProjectDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:text-destructive"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.tech_stack.map((tech) => (
                            <Badge variant="outline" key={tech}>
                              {tech}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3">
                          {project.github_link && (
                            <a
                              href={project.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <Github className="h-4 w-4 mr-1" /> GitHub
                              </Button>
                            </a>
                          )}
                          {project.live_link && (
                            <a
                              href={project.live_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-4 w-4 mr-1" /> Live
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ========= EDUCATION ========= */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" /> Education
                  </h2>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingEducation(null);
                      setEducationDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-4 border rounded-lg flex justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">
                          {edu.institution}
                        </h3>
                        <p className="text-muted-foreground">
                          {edu.degree} in {edu.field}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {edu.duration}
                        </p>
                        {edu.cgpa && (
                          <p className="text-sm text-primary">CGPA: {edu.cgpa}</p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEducation(edu);
                            setEducationDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-destructive"
                          onClick={() => handleDeleteEducation(edu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ========= SOCIAL LINKS ========= */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-3">
                  <h2 className="text-xl font-semibold">Social Links</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinksDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Links
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a
                    href={profile.links.github || "#"}
                    className="p-3 border rounded hover:bg-accent flex items-center gap-2"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <a
                    href={profile.links.linkedin || "#"}
                    className="p-3 border rounded hover:bg-accent flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                  <a
                    href={profile.links.portfolio || "#"}
                    className="p-3 border rounded hover:bg-accent flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </a>
                  <a
                    href={`mailto:${profile.links.email}`}
                    className="p-3 border rounded hover:bg-accent flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== RIGHT SIDEBAR ========== */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Trophy className="h-6 w-6 text-[hsl(var(--saffron))]" />
                  Contest Performance
                </h2>

                <div className="bg-gradient-to-br from-yellow-200/10 to-yellow-200/5 rounded p-6 text-center mb-5">
                  <p className="text-muted-foreground">Current Rank</p>
                  <h3 className="text-5xl font-bold text-yellow-600">#42</h3>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="px-4 py-1.5 bg-yellow-500 text-white">
                      DSA
                    </Badge>
                    <Badge className="px-4 py-1.5 bg-green-500 text-white">
                      React
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Next Badge Level</h4>
                  <div className="relative w-full h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 dark:bg-yellow-400 transition-all"
                      style={{ width: `75%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Matrix */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Skills Matrix</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSkill(null);
                      setSkillDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {profile.skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {skill.percentage}%
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSkill(skill);
                              setSkillDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-destructive"
                            onClick={() => handleDeleteSkill(skill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 overflow-hidden mt-2">
                        <div
                          className="h-full bg-green-500 dark:bg-green-400 transition-all"
                          style={{ width: `${skill.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Strength */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Profile Strength</h3>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {profileStrength}% Complete
                  </span>
                </div>

                {/* Strength Bar */}
                <div className="relative w-full h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 overflow-hidden mt-2">
                  <div
                    className="h-full bg-green-500 dark:bg-green-400 transition-all"
                    style={{ width: `${profileStrength}%` }}
                  ></div>
                </div>


                {/* Suggestions */}
                {suggestions.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Suggestions to improve:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {suggestions.slice(0, 5).map((s, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>• {s.text}</span>
                          <span className="text-primary font-medium">+{s.boost}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 mt-2">
                    Your profile is 100% complete. Great job!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ========= PROFILE STATS ========= */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">Profile Stats</h3>

                <div className="space-y-4">

                  {/* Certificates */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Certificates Earned
                    </span>
                    <span className="font-semibold text-lg">
                      {profile.certifications.length}
                    </span>
                  </div>

                  {/* Projects */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Projects Added
                    </span>
                    <span className="font-semibold text-lg">
                      {profile.projects.length}
                    </span>
                  </div>

                  {/* Contests (Static for now — can make dynamic later) */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Contests Participated
                    </span>
                    <span className="font-semibold text-lg">
                      {profile.contests ? profile.contests.length : 2}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Skills Added
                    </span>
                    <span className="font-semibold text-lg">
                      {profile.skills.length}
                    </span>
                  </div>

                </div>
              </CardContent>
            </Card>
            <Card className="border-[hsl(var(--saffron))]/20 bg-gradient-to-br from-[hsl(var(--saffron))]/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-2 mb-3">
                  <Star className="h-5 w-5 text-[hsl(var(--saffron))] mt-0.5" />
                  <h3 className="font-semibold">AI Suggestions</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--saffron))]">•</span>
                    <span>Add more projects to showcase your skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--saffron))]">•</span>
                    <span>Complete your education details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--saffron))]">•</span>
                    <span>Add GitHub links to your projects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>

      {/* UPDATE PROFILE */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profileData={{
          first_name: profile.user.first_name,
          last_name: profile.user.last_name,
          title: profile.title || "",
          location: profile.location || "",
          about: profile.about || "",
        }}
        onSave={async (data) => {
          await profileService.updateProfile(data);
          await loadProfile();
        }}
      />

      {/* SKILLS */}
      <AddSkillDialog
        open={skillDialogOpen}
        onOpenChange={(open) => {
          setSkillDialogOpen(open);
          if (!open) setEditingSkill(null);
        }}
        editingData={editingSkill ?? undefined}
        onSave={handleSaveSkill}
      />

      {/* EXPERIENCE (Dynamic) */}
      <AddExperienceDialog
        open={experienceDialogOpen}
        onOpenChange={(open) => {
          setExperienceDialogOpen(open);
          if (!open) setExperienceEditData(null);
        }}
        editingData={experienceEditData ?? undefined}
        onSave={async (exp) => {
          if (experienceEditData) {
            await handleEditExperience(experienceEditData.id, exp);
          } else {
            await handleAddExperience(exp);
          }
        }}
      />

      {/* PROJECTS */}
      <AddProjectDialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        editingData={editingProject ?? undefined}
        onSave={handleSaveProject}
      />

      {/* EDUCATION */}
      <AddEducationDialog
        open={educationDialogOpen}
        onOpenChange={(open) => {
          setEducationDialogOpen(open);
          if (!open) setEditingEducation(null);
        }}
        editingData={editingEducation ?? undefined}
        onSave={handleSaveEducation}
      />

      {/* CERTIFICATION */}
      <AddCertificationDialog
        open={certificationDialogOpen}
        onOpenChange={(open) => {
          setCertificationDialogOpen(open);
          if (!open) setEditingCertification(null);
        }}
        editingData={editingCertification ?? undefined}
        onSave={handleSaveCertification}
      />

      {/* SOCIAL LINKS */}
      <EditLinksDialog
        open={linksDialogOpen}
        onOpenChange={setLinksDialogOpen}
        links={profile.links}
        onSave={async (links) => {
          await profileService.updateSocialLinks(links);
          await loadProfile();
        }}
      />
    </div>
  );
};

export default Profile;
