
import { formatDistanceToNow } from "date-fns";
import { Phone, FileText, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Activity {
  id: string;
  type: 'call' | 'note' | 'sms' | 'callback';
  timestamp: string;
  content: string;
  status?: string;
  duration?: number;
}

interface LeadTimelineProps {
  activities: Activity[];
}

export const LeadTimeline = ({ activities }: LeadTimelineProps) => {
  const renderActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'call':
        return <Phone className="h-5 w-5 text-blue-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'sms':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'callback':
        return <Calendar className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getActivityClass = (activity: Activity) => {
    if (activity.type === 'callback' && activity.status === 'scheduled') {
      return 'border-red-200 bg-red-50';
    }
    
    switch (activity.type) {
      case 'call':
        return activity.status === 'missed' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50';
      case 'note':
        return 'border-green-200 bg-green-50';
      case 'sms':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Sort activities by timestamp
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
          
          <div className="space-y-6">
            {sortedActivities.map((activity, index) => (
              <div key={activity.id} className="relative pl-12">
                {/* Icon circle */}
                <div className="absolute left-0 top-0 bg-white p-1 rounded-full border-2 border-gray-200">
                  {renderActivityIcon(activity)}
                </div>
                
                {/* Activity content */}
                <div className={`border rounded-md p-3 ${getActivityClass(activity)}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{activity.content}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp) > new Date() 
                        ? `in ${formatDistanceToNow(new Date(activity.timestamp))}`
                        : `${formatDistanceToNow(new Date(activity.timestamp))} ago`
                      }
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
