import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Database, Code, Table } from 'lucide-react';

const Notes = () => {
  const navigate = useNavigate();

  const subjects = [
    {
      id: 'python',
      name: 'Python',
      icon: Code,
      bgColor: 'hsl(var(--python-bg))',
      textColor: 'hsl(var(--python-fg))',
    },
    {
      id: 'data-structures',
      name: 'Data Structures',
      icon: Database,
      bgColor: 'hsl(var(--datastructures-bg))',
      textColor: 'hsl(var(--datastructures-fg))',
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: BookOpen,
      bgColor: 'hsl(var(--javascript-bg))',
      textColor: 'hsl(var(--javascript-fg))',
    },
    {
      id: 'sql',
      name: 'SQL',
      icon: Table,
      bgColor: 'hsl(var(--sql-bg))',
      textColor: 'hsl(var(--sql-fg))',
    },
  ];

  const handleCardClick = (subjectId: string) => {
    navigate(`/student/notes/${subjectId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Study Notes</h2>
        <p className="text-muted-foreground">Select a subject to access your notes and study materials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-0"
            style={{ backgroundColor: subject.bgColor }}
            onClick={() => handleCardClick(subject.id)}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <subject.icon 
                  className="h-12 w-12"
                  style={{ color: subject.textColor }}
                />
              </div>
              <h3 
                className="text-xl font-bold"
                style={{ color: subject.textColor }}
              >
                {subject.name}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notes;