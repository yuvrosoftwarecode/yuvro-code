import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Search, X, Save } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';


interface FilterState {
  search: string;
  location: string[];
  experienceLevel: string[];
  jobType: string[];
  salaryRange: number[];
  skills: string[];
  companySize: string[];
  postedDate: string[];
}

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

const JobFilters = ({ onFilterChange }: JobFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    location: [],
    experienceLevel: [],
    jobType: [],
    salaryRange: [0, 30],
    skills: [],
    companySize: [],
    postedDate: [],
  });

  const [savedFilters, setSavedFilters] = useState<FilterState[]>([]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      location: [],
      experienceLevel: [],
      jobType: [],
      salaryRange: [0, 30],
      skills: [],
      companySize: [],
      postedDate: [],
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const handleSaveFilters = () => {
    setSavedFilters([...savedFilters, filters]);
  };

  const handleLoadSavedFilter = (savedFilter: FilterState) => {
    setFilters(savedFilter);
    onFilterChange(savedFilter);
  };

  const handleRemoveSavedFilter = (index: number) => {
    setSavedFilters(savedFilters.filter((_, i) => i !== index));
  };

  const locationOptions = ['Remote', 'Hybrid', 'Onsite'];
  const experienceOptions = ['Fresher', '0-2 yrs', '2-5 yrs'];
  const jobTypeOptions = ['Full-time', 'Internship', 'Contract'];
  const skillOptions = ['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'MongoDB', 'Spring Boot', 'Tailwind CSS'];
  const companySizeOptions = ['1-10', '10-50', '50-100', '100-500', '500+'];
  const postedDateOptions = ['Last 24 hours', 'Last 7 days', 'Last 30 days'];

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, skill, or company..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Active Filters */}
      {(filters.location.length > 0 || filters.experienceLevel.length > 0 || filters.skills.length > 0) && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
          {[...filters.location, ...filters.experienceLevel, ...filters.skills].map(filter => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                if (filters.location.includes(filter)) toggleArrayFilter('location', filter);
                if (filters.experienceLevel.includes(filter)) toggleArrayFilter('experienceLevel', filter);
                if (filters.skills.includes(filter)) toggleArrayFilter('skills', filter);
              }} />
            </Badge>
          ))}
        </div>
      )}

      {/* Location */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Location</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {locationOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${option}`}
                checked={filters.location.includes(option)}
                onCheckedChange={() => toggleArrayFilter('location', option)}
              />
              <label htmlFor={`location-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Experience Level */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Experience Level</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {experienceOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`exp-${option}`}
                checked={filters.experienceLevel.includes(option)}
                onCheckedChange={() => toggleArrayFilter('experienceLevel', option)}
              />
              <label htmlFor={`exp-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Job Type */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Job Type</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {jobTypeOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${option}`}
                checked={filters.jobType.includes(option)}
                onCheckedChange={() => toggleArrayFilter('jobType', option)}
              />
              <label htmlFor={`type-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Salary Range */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Salary Range</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <Slider
            value={filters.salaryRange}
            onValueChange={(value) => updateFilter('salaryRange', value)}
            max={30}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{filters.salaryRange[0]} LPA</span>
            <span>₹{filters.salaryRange[1]} LPA</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tech Stack */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Tech Stack</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {skillOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`skill-${option}`}
                checked={filters.skills.includes(option)}
                onCheckedChange={() => toggleArrayFilter('skills', option)}
              />
              <label htmlFor={`skill-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Company Size */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Company Size</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {companySizeOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${option}`}
                checked={filters.companySize.includes(option)}
                onCheckedChange={() => toggleArrayFilter('companySize', option)}
              />
              <label htmlFor={`size-${option}`} className="text-sm cursor-pointer">
                {option} employees
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Posted Date */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label className="text-sm font-semibold">Posted Date</Label>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {postedDateOptions.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`date-${option}`}
                checked={filters.postedDate.includes(option)}
                onCheckedChange={() => toggleArrayFilter('postedDate', option)}
              />
              <label htmlFor={`date-${option}`} className="text-sm cursor-pointer">
                {option}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full gap-2" 
          size="sm"
          onClick={handleSaveFilters}
        >
          <Save className="h-4 w-4" />
          Save Filters
        </Button>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-2 mt-3">
            <Label className="text-xs text-muted-foreground">Saved Filters</Label>
            {savedFilters.map((savedFilter, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <button
                  onClick={() => handleLoadSavedFilter(savedFilter)}
                  className="flex-1 text-left text-sm"
                >
                  Filter {index + 1}
                  {savedFilter.skills.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({savedFilter.skills.slice(0, 2).join(', ')})
                    </span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveSavedFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button 
          variant="ghost" 
          className="w-full" 
          size="sm"
          onClick={clearAllFilters}
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export default JobFilters;
