import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Play, FileText, Code2, ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ContentItem {
  id: string;
  title: string;
  children?: ContentItem[];
}

interface CustomContentSidebarProps {
  subjectName: string;
  onTopicSelect: (topicId: string, title: string) => void;
  selectedTopic: string | null;
  onBackToNotes: () => void;
}

// Unified content data - common across all tabs
const contentData: ContentItem[] = [
  {
    id: 'basics',
    title: 'Python Basics',
    children: [
      { id: 'intro', title: 'Introduction to Python Programming Language' },
      { id: 'syntax', title: 'Basic Syntax Rules and Conventions' },
      { id: 'variables', title: 'Variables and Data Types' },
      { id: 'operators', title: 'Operators and Expressions' },
    ]
  },
  {
    id: 'control',
    title: 'Control Structures',
    children: [
      { id: 'conditionals', title: 'If Else Conditional Statements' },
      { id: 'loops', title: 'For While Loop Constructs' },
      { id: 'functions', title: 'Function Definition and Parameters' },
      { id: 'scope', title: 'Variable Scope and Namespaces' },
    ]
  },
  {
    id: 'data-types',
    title: 'Data Types and Structures',
    children: [
      { id: 'numbers', title: 'Numbers and Mathematical Operations' },
      { id: 'strings', title: 'String Text Manipulation Methods' },
      { id: 'lists', title: 'Lists Arrays and Collections' },
      { id: 'tuples', title: 'Tuples Immutable Sequences' },
      { id: 'dicts', title: 'Dictionary Hash Maps Key Value' },
      { id: 'sets', title: 'Sets Unique Collections' },
    ]
  },
  {
    id: 'oop',
    title: 'Object Oriented Programming',
    children: [
      { id: 'classes', title: 'Classes and Object Creation' },
      { id: 'inheritance', title: 'Inheritance and Polymorphism' },
      { id: 'encapsulation', title: 'Encapsulation Data Hiding' },
      { id: 'methods', title: 'Methods and Special Functions' },
    ]
  },
  {
    id: 'modules',
    title: 'Modules and Packages',
    children: [
      { id: 'importing', title: 'Import Statements and Modules' },
      { id: 'packages', title: 'Package Creation and Management' },
      { id: 'stdlib', title: 'Standard Library Overview' },
      { id: 'pip', title: 'Package Installation with Pip' },
    ]
  },
  {
    id: 'libraries',
    title: 'Popular Libraries and Frameworks',
    children: [
      { id: 'numpy', title: 'NumPy Scientific Computing Library' },
      { id: 'pandas', title: 'Pandas Data Analysis and Manipulation' },
      { id: 'matplotlib', title: 'Matplotlib Data Visualization Plotting' },
      { id: 'requests', title: 'Requests HTTP Library Web APIs' },
      { id: 'flask', title: 'Flask Web Framework Development' },
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Topics',
    children: [
      { id: 'exceptions', title: 'Exception Error Handling Try Catch' },
      { id: 'decorators', title: 'Decorators Function Modification' },
      { id: 'generators', title: 'Generators Iterator Patterns' },
      { id: 'context', title: 'Context Managers With Statements' },
      { id: 'async', title: 'Asynchronous Programming Async Await' },
    ]
  },
  {
    id: 'projects',
    title: 'Practice Projects',
    children: [
      { id: 'calculator', title: 'Basic Calculator Application' },
      { id: 'todo-app', title: 'Todo List Management System' },
      { id: 'web-scraper', title: 'Web Scraping Data Extraction' },
      { id: 'api-client', title: 'REST API Client Implementation' },
      { id: 'data-analysis', title: 'Data Analysis and Visualization' },
      { id: 'machine-learning', title: 'Machine Learning Model Training' },
    ]
  }
];

// Function to generate abbreviation from title
const generateAbbreviation = (title: string): string => {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  const firstLetter = words[0].charAt(0).toUpperCase();
  const lastLetter = words[words.length - 1].charAt(0).toUpperCase();
  return firstLetter + lastLetter;
};

// Function to truncate text for expanded mode
const truncateText = (text: string, maxLength: number = 18): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Function to truncate text for collapsed mode
const truncateTextCollapsed = (text: string, maxLength: number = 12): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

interface ContentMenuItemProps {
  item: ContentItem;
  level: number;
  isCollapsed: boolean;
  onTopicSelect: (topicId: string, title: string) => void;
  selectedTopic: string | null;
}

const ContentMenuItem: React.FC<ContentMenuItemProps> = ({ item, level, isCollapsed, onTopicSelect, selectedTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const abbreviation = generateAbbreviation(item.title);
  const truncatedTitle = truncateText(item.title);
  const truncatedTitleCollapsed = truncateTextCollapsed(item.title);
  const shouldShowTooltip = item.title.length > 18;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group",
            !isCollapsed && "w-full",
            level > 0 && !isCollapsed && "ml-4",
            isCollapsed && "p-2"
          )}
          title={isCollapsed ? item.title : (shouldShowTooltip ? item.title : undefined)}
        >
          <div className="flex items-center space-x-2 min-w-0">
            {isCollapsed ? (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md flex-shrink-0" title={item.title}>
                {abbreviation}
              </span>
            ) : (
              <>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md flex-shrink-0">
                  {abbreviation}
                </span>
                <span className="text-sm font-medium truncate">{truncatedTitle}</span>
              </>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-shrink-0 ml-2">
              {isOpen ? (
                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-3 w-3 transition-transform duration-200" />
              )}
            </div>
          )}
        </button>
        
        {(isOpen || isCollapsed) && (
          <div className={cn("space-y-1", isCollapsed ? "pl-1" : "pl-2 animate-accordion-down")}>
            {item.children?.map((child) => (
              <ContentMenuItem
                key={child.id}
                item={child}
                level={level + 1}
                isCollapsed={isCollapsed}
                onTopicSelect={onTopicSelect}
                selectedTopic={selectedTopic}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onTopicSelect(item.id, item.title)}
      className={cn(
        "flex items-center space-x-2 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group",
        !isCollapsed && "w-full",
        level > 0 && !isCollapsed && "ml-4",
        isCollapsed && "p-2",
        selectedTopic === item.id && "bg-primary/10 text-primary"
      )}
      title={isCollapsed ? item.title : (shouldShowTooltip ? item.title : undefined)}
    >
      {isCollapsed ? (
        <span className="text-xs font-medium bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md flex-shrink-0" title={item.title}>
          {abbreviation}
        </span>
      ) : (
        <>
          <span className="text-xs font-medium bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md flex-shrink-0">
            {abbreviation}
          </span>
          <span className="text-sm truncate">{truncatedTitle}</span>
        </>
      )}
    </button>
  );
};

const CustomContentSidebar: React.FC<CustomContentSidebarProps> = ({ subjectName, onTopicSelect, selectedTopic, onBackToNotes }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Filter topics based on search query
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return contentData;
    }

    const query = searchQuery.toLowerCase();
    const filtered: ContentItem[] = [];

    contentData.forEach((topic) => {
      // Check if topic name matches
      const topicMatches = topic.title.toLowerCase().includes(query);
      
      // Check if any subtopic matches
      const matchingSubtopics = topic.children?.filter(subtopic => 
        subtopic.title.toLowerCase().includes(query)
      ) || [];

      if (topicMatches) {
        // If topic matches, include all subtopics
        filtered.push(topic);
      } else if (matchingSubtopics.length > 0) {
        // If subtopics match, include only matching subtopics
        filtered.push({
          ...topic,
          children: matchingSubtopics
        });
      }
    });

    return filtered;
  }, [searchQuery]);

  return (
    <div
      className={cn(
        "flex-shrink-0 bg-background border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-24" : "w-64"
      )}
      style={{ height: '100%' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="border-b border-border flex-shrink-0">
        {/* Back Button */}
        <div className="p-3 border-b border-border">
          <button
            onClick={onBackToNotes}
            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isCollapsed && <span>Back to Notes</span>}
          </button>
        </div>
        
        {/* Title and Collapse Button */}
        <div className={cn("flex items-center p-4", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2 min-w-0">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold text-sm truncate">
                Course Content
              </h3>
            </div>
          )}
          <button
            onClick={handleToggleCollapse}
            className={cn(
              "p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
              !isCollapsed && "ml-auto"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                !isCollapsed && "rotate-180"
              )} 
            />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3 flex-1 overflow-hidden flex flex-col">
        <div 
          className="flex-1 overflow-auto sidebar-scrollbar"
          style={{
            overflowX: 'hidden',
            overflowY: 'auto'
          }}
        >
          {!isCollapsed && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground px-2">
                {subjectName} Topics
              </p>
            </div>
          )}
          
          <div className="space-y-1" style={{ minWidth: 'max-content' }}>
            {filteredContent.map((item) => (
              <ContentMenuItem
                key={item.id}
                item={item}
                level={0}
                isCollapsed={isCollapsed}
                onTopicSelect={onTopicSelect}
                selectedTopic={selectedTopic}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomContentSidebar;