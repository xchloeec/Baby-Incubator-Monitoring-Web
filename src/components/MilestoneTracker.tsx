import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Trophy, 
  Heart, 
  Baby, 
  Scale, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Star,
  Target,
  Users,
  Stethoscope,
  MessageCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: 'medical' | 'development' | 'feeding' | 'bonding' | 'growth';
  targetDate?: Date;
  isCompleted: boolean;
  completedDate?: Date;
  progress: number;
  importance: 'essential' | 'important' | 'beneficial';
  setBy: 'healthcare' | 'parent';
  guidance: {
    whatParentsCanDo: string[];
    whatToExpect: string;
    whenToCelebrate: string;
  };
  medicalNotes?: string;
}

export function MilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'Stable Temperature Control',
      description: 'Baby maintains body temperature consistently without external heating',
      category: 'medical',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      isCompleted: false,
      progress: 65,
      importance: 'essential',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Practice skin-to-skin contact (kangaroo care) when approved by medical team',
          'Keep incubator doors closed except during necessary care',
          'Ask nurses about optimal timing for holding baby'
        ],
        whatToExpected: 'Baby will gradually need less external heating as their ability to regulate temperature improves. This is a sign of neurological development.',
        whenToCelebrate: 'When baby can maintain 98.6°F (37°C) for 24 hours without extra heating'
      },
      medicalNotes: 'Critical for discharge planning. Target: 24 hours stable at 37°C'
    },
    {
      id: '2',
      title: 'First Successful Breastfeeding',
      description: 'Baby latches and feeds directly from breast for the first time',
      category: 'feeding',
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      isCompleted: false,
      progress: 30,
      importance: 'important',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Pump breast milk regularly to maintain supply',
          'Practice skin-to-skin contact to encourage rooting reflex',
          'Talk to lactation consultant about positioning techniques',
          'Be patient - this may take several attempts'
        ],
        whatToExpected: 'Initial attempts may be brief (1-2 minutes). Baby may tire easily but will gradually build stamina.',
        whenToCelebrate: 'When baby successfully latches and feeds for 5+ minutes'
      },
      medicalNotes: 'Coordinate with lactation consultant. Start when respiratory stable.'
    },
    {
      id: '3',
      title: 'Weight Gain Milestone: 2.5 lbs',
      description: 'Reaching consistent weight gain pattern and 2.5 lb milestone',
      category: 'growth',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      isCompleted: false,
      progress: 80,
      importance: 'essential',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Help with feeding times when possible',
          'Provide gentle, calm environment during feeds',
          'Chart feeding amounts if requested by medical team',
          'Celebrate small daily gains - every gram counts!'
        ],
        whatToExpected: 'Premature babies typically gain 15-20 grams per day. Weight may fluctuate day to day.',
        whenToCelebrate: 'When baby reaches 2.5 lbs and shows consistent daily weight gain'
      },
      medicalNotes: 'Current: 2.1 lbs. Target gain: 15-20g/day'
    },
    {
      id: '4',
      title: 'Recognizing Parent\'s Voice',
      description: 'Baby shows clear response to familiar voices, especially parents',
      category: 'development',
      isCompleted: true,
      completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      progress: 100,
      importance: 'beneficial',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Talk and sing to baby during visits',
          'Read stories aloud, even if baby seems to be sleeping',
          'Use the same phrases consistently ("Hello sweet baby")',
          'Record your voice for nurses to play when you\'re not there'
        ],
        whatToExpected: 'Baby may turn toward your voice, change breathing pattern, or become more alert when you speak.',
        whenToCelebrate: 'When baby consistently responds to your voice with movement or expression changes'
      }
    },
    {
      id: '5',
      title: 'Breathing Without Assistance',
      description: 'Baby maintains stable breathing patterns without respiratory support',
      category: 'medical',
      targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      isCompleted: false,
      progress: 45,
      importance: 'essential',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Practice calm, steady breathing during skin-to-skin contact',
          'Keep environment quiet and peaceful',
          'Support medical team\'s breathing exercises if recommended',
          'Ask questions about baby\'s breathing patterns'
        ],
        whatToExpected: 'Gradual reduction in oxygen support. Baby may have brief episodes of irregular breathing - this is normal.',
        whenToCelebrate: 'When baby breathes independently for 24+ hours with normal oxygen levels'
      },
      medicalNotes: 'Currently on minimal oxygen support. Weaning gradually.'
    },
    {
      id: '6',
      title: 'First Eye Contact',
      description: 'Meaningful eye contact and visual tracking during alert periods',
      category: 'bonding',
      isCompleted: false,
      progress: 70,
      importance: 'important',
      setBy: 'healthcare',
      guidance: {
        whatParentsCanDo: [
          'Position your face 8-12 inches from baby during quiet alert times',
          'Use high contrast patterns (black and white) to encourage focus',
          'Talk softly while maintaining eye contact',
          'Be patient - newborns focus best during short alert periods'
        ],
        whatToExpected: 'Brief moments of focused attention, usually lasting 30 seconds to 2 minutes at first.',
        whenToCelebrate: 'When baby maintains eye contact for 30+ seconds and tracks your movement'
      }
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryIcons = {
    medical: Stethoscope,
    development: Baby,
    feeding: Heart,
    bonding: Users,
    growth: Scale
  };

  const categoryColors = {
    medical: 'bg-blue-100 text-blue-800',
    development: 'bg-purple-100 text-purple-800',
    feeding: 'bg-green-100 text-green-800',
    bonding: 'bg-pink-100 text-pink-800',
    growth: 'bg-orange-100 text-orange-800'
  };

  const importanceColors = {
    essential: 'bg-red-100 text-red-700 border-red-200',
    important: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    beneficial: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const filteredMilestones = selectedCategory === 'all' 
    ? milestones 
    : milestones.filter(m => m.category === selectedCategory);

  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const totalMilestones = milestones.length;
  const overallProgress = (completedMilestones / totalMilestones) * 100;

  const markComplete = (milestoneId: string) => {
    setMilestones(prev => 
      prev.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, isCompleted: true, completedDate: new Date(), progress: 100 }
          : milestone
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Development Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{completedMilestones} of {totalMilestones} milestones</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">For New Parents</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    These milestones are set by your medical team based on your baby's specific needs. 
                    Each one includes guidance on how you can help and what to expect. Remember, every baby develops at their own pace!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Milestones
        </Button>
        {Object.entries(categoryIcons).map(([category, Icon]) => (
          <Button 
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.map((milestone) => {
          const CategoryIcon = categoryIcons[milestone.category];
          return (
            <Card key={milestone.id} className={`${milestone.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {milestone.isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <CategoryIcon className="h-6 w-6 text-gray-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[milestone.category]}>
                      {milestone.category}
                    </Badge>
                    <Badge variant="outline" className={importanceColors[milestone.importance]}>
                      {milestone.importance}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!milestone.isCompleted && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{milestone.progress}%</span>
                    </div>
                    <Progress value={milestone.progress} className="h-2" />
                  </div>
                )}

                {milestone.targetDate && !milestone.isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Target: {milestone.targetDate.toLocaleDateString()}
                  </div>
                )}

                {milestone.completedDate && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Star className="h-4 w-4" />
                    Achieved on {milestone.completedDate.toLocaleDateString()}!
                  </div>
                )}

                {/* Guidance Section */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    How You Can Help
                  </h4>
                  <ul className="space-y-1">
                    {milestone.guidance.whatParentsCanDo.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                        <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-2 border-t border-blue-200">
                    <h5 className="font-medium text-blue-800 text-sm mb-1">What to Expect:</h5>
                    <p className="text-sm text-blue-700">{milestone.guidance.whatToExpected}</p>
                  </div>
                  
                  <div className="pt-2 border-t border-blue-200">
                    <h5 className="font-medium text-blue-800 text-sm mb-1">When to Celebrate:</h5>
                    <p className="text-sm text-blue-700">{milestone.guidance.whenToCelebrate}</p>
                  </div>
                </div>

                {milestone.medicalNotes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-800 text-sm mb-1 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Medical Notes:
                    </h5>
                    <p className="text-sm text-gray-600">{milestone.medicalNotes}</p>
                  </div>
                )}

                {!milestone.isCompleted && (
                  <Button 
                    onClick={() => markComplete(milestone.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Achieved
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}