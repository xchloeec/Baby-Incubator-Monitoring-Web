import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileText, Plus, Clock, User, Stethoscope, Pill, Utensils, Baby } from 'lucide-react';

interface NursingNote {
  id: string;
  timestamp: Date;
  nurseId: string;
  nurseName: string;
  category: 'vital_signs' | 'feeding' | 'medication' | 'behavior' | 'care' | 'shift_handoff';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export function NursingNotes() {
  const [notes, setNotes] = useState<NursingNote[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      nurseId: 'N001',
      nurseName: 'Sarah Johnson, RN',
      category: 'vital_signs',
      title: 'Stable vital signs',
      content: 'HR: 140-150 bpm, RR: 45-50/min, O2 Sat: 98-99% on room air. Temperature stable at 37.2°C. No signs of distress.',
      priority: 'normal'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      nurseId: 'N002',
      nurseName: 'Michael Chen, RN',
      category: 'feeding',
      title: 'Feeding tolerance good',
      content: 'Took 35ml of breast milk via NG tube over 30 minutes. No residuals. Abdomen soft, bowel sounds present. Weight: 1.8kg (+15g from yesterday).',
      priority: 'normal'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      nurseId: 'N001',
      nurseName: 'Sarah Johnson, RN',
      category: 'behavior',
      title: 'Increased alertness',
      content: 'Baby showing more periods of quiet alertness. Responds to voice and touch. Parents visited 14:00-16:00, participated in kangaroo care for 45 minutes.',
      priority: 'normal'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      nurseId: 'N003',
      nurseName: 'Lisa Torres, RN',
      category: 'shift_handoff',
      title: 'Night shift report',
      content: 'Quiet night overall. Fed every 3 hours with good tolerance. Parents called twice for updates. Scheduled for echo tomorrow at 10 AM. Continue current medication regimen.',
      priority: 'normal'
    }
  ]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    category: 'care' as const,
    title: '',
    content: '',
    priority: 'normal' as const
  });

  const categoryIcons = {
    vital_signs: Stethoscope,
    feeding: Utensils,
    medication: Pill,
    behavior: Baby,
    care: FileText,
    shift_handoff: User
  };

  const categoryColors = {
    vital_signs: 'bg-blue-100 text-blue-800',
    feeding: 'bg-green-100 text-green-800',
    medication: 'bg-purple-100 text-purple-800',
    behavior: 'bg-pink-100 text-pink-800',
    care: 'bg-gray-100 text-gray-800',
    shift_handoff: 'bg-orange-100 text-orange-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    critical: 'bg-red-100 text-red-600'
  };

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: NursingNote = {
      id: Date.now().toString(),
      timestamp: new Date(),
      nurseId: 'N001',
      nurseName: 'Current User, RN',
      category: newNote.category,
      title: newNote.title,
      content: newNote.content,
      priority: newNote.priority
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({
      category: 'care',
      title: '',
      content: '',
      priority: 'normal'
    });
    setIsAddingNote(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nursing Notes & Care Log
        </CardTitle>
        <Button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingNote && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Add Nursing Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newNote.category}
                    onValueChange={(value: any) => setNewNote(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vital_signs">Vital Signs</SelectItem>
                      <SelectItem value="feeding">Feeding</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                      <SelectItem value="care">General Care</SelectItem>
                      <SelectItem value="shift_handoff">Shift Handoff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newNote.priority}
                    onValueChange={(value: any) => setNewNote(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the note"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Detailed Notes</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detailed nursing observations, care provided, patient response..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddNote}>Save Note</Button>
                <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {notes.map((note) => {
            const CategoryIcon = categoryIcons[note.category];
            return (
              <Card key={note.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span className="font-medium">{note.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[note.priority]}>
                        {note.priority.toUpperCase()}
                      </Badge>
                      <Badge className={categoryColors[note.category]}>
                        {note.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{note.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {note.nurseName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(note.timestamp)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}