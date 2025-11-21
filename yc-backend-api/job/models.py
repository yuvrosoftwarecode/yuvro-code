from django.db import models

class Job(models.Model):
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=100)
    work_type = models.CharField(max_length=50, choices=[('Remote','Remote'),('Hybrid','Hybrid'),('Onsite','Onsite')])
    posted_date = models.DateField(auto_now_add=True)
    skills = models.JSONField(default=list)  # list of skills
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    experience_level = models.CharField(max_length=50)
    job_type = models.CharField(max_length=50)
    description = models.TextField()
    responsibilities = models.JSONField(default=list, blank=True)
    required_skills = models.JSONField(default=list, blank=True)
    preferred_skills = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    company_info = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.title} at {self.company}"
