from django.db import models


class Job(models.Model):

    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    work_type = models.CharField(max_length=50)      
    job_type = models.CharField(max_length=50)        
    experience_level = models.CharField(max_length=50)  

    description = models.TextField()


    skills = models.JSONField(default=list, blank=True)
    responsibilities = models.JSONField(default=list, blank=True)
    required_skills = models.JSONField(default=list, blank=True)
    preferred_skills = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)


    company_info = models.JSONField(default=dict, blank=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    logo = models.URLField(blank=True, null=True)


    salary = models.CharField(max_length=255)
    posted_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_company_info(self):
        """
        Returns company_info with all required fields, using defaults if missing.
        Ensures consistency across the API.
        """
        if not self.company_info:
            self.company_info = {}
        
        return {
            "name": self.company_info.get("name") or self.company,
            "about": self.company_info.get("about") or "",
            "size": self.company_info.get("size") or self.company_size or "N/A",
            "domain": self.company_info.get("domain") or "",
            "website": self.company_info.get("website") or "",
        }

    def save(self, *args, **kwargs):
        """Ensure company_info has required fields when saving."""
        if not self.company_info:
            self.company_info = {}
        
        if not self.company_info.get("name"):
            self.company_info["name"] = self.company
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} at {self.company}"


class Company(models.Model):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)  

    def __str__(self):
        return self.name

